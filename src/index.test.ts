import test from 'ava';
import { stripIndents } from 'common-tags';
import { Application, PatterplateFile, PatternplateConfiguration } from './types';

import createTypescriptTransform = require('./index');

function getApplicationMock(): Application {
  return {};
}

function getFileMock(buffer: Buffer | string, id = 'id'): PatterplateFile {
  return {
    buffer,
    name: 'module.tsx',
    basename: 'module',
    ext: 'tsx',
    format: 'tsx',
    fs: undefined,
    path: 'path/module.tsx',
    pattern: {
      id,
      base: 'base',
      path: 'path',
      manifest: {
      }
    },
    meta: undefined,
    dependencies: {},
    in: 'in',
    out: 'out'
  };
}

function getConfigurationMock(): PatternplateConfiguration {
  return {
    opts: {}
  };
}

async function transpile(application: Application, codeOrFile: string | PatterplateFile,
  configuration = getConfigurationMock()): Promise<PatterplateFile> {
  const input = typeof codeOrFile === 'string' ? getFileMock(codeOrFile) : codeOrFile;
  const transform = (createTypescriptTransform as any)(application);
  const result: PatterplateFile = await transform(input, undefined, configuration);
  return result;
}

test('createTypescriptTransform should transpile simple ts module', async t => {
  const application = getApplicationMock();

  const result = await transpile(application, `
        function double(n: number) { return n * 2; }
    `);

  t.is(result.buffer.toString().trim(), stripIndents`
        function double(n) { return n * 2; }
    `);
});

test('createTypescriptTransform should transpile module with dependencies', async t => {
  const application = getApplicationMock();
  const file = getFileMock(`
        function double0(n: number) { return n * 2; }
    `, 'id0');
  file.dependencies['dep'] = getFileMock(`
        function double1(n: number) { return n * 2; }
    `, 'id1');
  file.dependencies['dep'].dependencies['dep2'] = getFileMock(`
        function double2(n: number) { return n * 2; }
    `, 'id2');

  const result = await transpile(application, file);

  t.is(result.buffer.toString().trim(), stripIndents`
        function double0(n) { return n * 2; }
    `);
  t.is(result.dependencies['dep'].buffer.toString().trim(), stripIndents`
        function double1(n) { return n * 2; }
    `);
  t.is(result.dependencies['dep'].dependencies['dep2'].buffer.toString().trim(), stripIndents`
        function double2(n) { return n * 2; }
    `);
});

test('createTypescriptTransform should write declarations if requested and possible', async t => {
  const application = getApplicationMock();
  application.resources = [];
  const configuration = getConfigurationMock();
  configuration.opts.declaration = true;

  await transpile(application, `
        function double3(n: number) { return n * 2; }
    `, configuration);

  t.is(application.resources.length, 1);
});

test('writeDeclaration should rewrite dependency paths on a best guess', t => {
  const expected = stripIndents`
    import Type1 from '../dependency-folder/index';
    import { Type1a } from '../dependency-folder/index';
    import * as Type1b from '../dependency-folder/index';
    import Type2 = require('../dependency-folder/index');
    const Type3 = require('../dependency-folder/index');
  `;

  const input = getFileMock(``);
  input.path = '/tmp/patterns/input/index.tsx';
  input.pattern.manifest.patterns = {
    dependency: 'dependency-folder'
  };
  input.dependencies['dependency'] = getFileMock('', 'dependency-folder');
  input.dependencies['dependency'].path = '/tmp/patterns/dependency-folder/index.tsx';
  const application = getApplicationMock();
  application.resources = [];
  const output = {
    status: 0,
    outputText: '',
    declarationText: stripIndents`
      import Type1 from 'dependency';
      import { Type1a } from 'dependency';
      import * as Type1b from 'dependency';
      import Type2 = require('dependency');
      const Type3 = require('dependency');
    `
  };

  (createTypescriptTransform as any).writeDeclaration(input, output, application);

  t.deepEqual(application.resources[0].content, expected);
});

test('writeDeclaration should rewrite multiple dependency paths on a best guess', t => {
  const expected = stripIndents`
    import Type1 from '../dependency-folder/index';
    import { Type1a } from '../dependency-folder/index';
    import * as Type1b from '../dependency-folder/index';
    import Type2 = require('../dependency-folder/index');
    const Type3 = require('../dependency-folder/index');
    import Type4 from '../second-folder/index';
    import { Type4a } from '../second-folder/index';
    import * as Type4b from '../second-folder/index';
    import Type5 = require('../second-folder/index');
    const Type6 = require('../second-folder/index');
    import Type7 from '../another-folder/third-folder/index';
    import { Type7a } from '../another-folder/third-folder/index';
    import * as Type7b from '../another-folder/third-folder/index';
    import Type8 = require('../another-folder/third-folder/index');
    const Type9 = require('../another-folder/third-folder/index');
  `;

  const input = getFileMock(``);
  input.path = '/tmp/patterns/input/index.tsx';
  input.pattern.manifest.patterns = {
    dependency: 'dependency-folder',
    secondDependency: 'second-folder',
    thirdDependency: 'another-folder/third-folder'
  };
  input.dependencies['dependency'] = getFileMock('', 'dependency-folder');
  input.dependencies['dependency'].path = '/tmp/patterns/dependency-folder/index.tsx';
  input.dependencies['secondDependency'] = getFileMock('', 'second-folder');
  input.dependencies['secondDependency'].path = '/tmp/patterns/second-folder/index.tsx';
  input.dependencies['thirdDependency'] = getFileMock('', 'third-folder');
  input.dependencies['thirdDependency'].path = '/tmp/patterns/another-folder/third-folder/index.tsx';
  const application = getApplicationMock();
  application.resources = [];
  const output = {
    status: 0,
    outputText: '',
    declarationText: stripIndents`
      import Type1 from 'dependency';
      import { Type1a } from 'dependency';
      import * as Type1b from 'dependency';
      import Type2 = require('dependency');
      const Type3 = require('dependency');
      import Type4 from 'secondDependency';
      import { Type4a } from 'secondDependency';
      import * as Type4b from 'secondDependency';
      import Type5 = require('secondDependency');
      const Type6 = require('secondDependency');
      import Type7 from 'thirdDependency';
      import { Type7a } from 'thirdDependency';
      import * as Type7b from 'thirdDependency';
      import Type8 = require('thirdDependency');
      const Type9 = require('thirdDependency');
    `
  };

  (createTypescriptTransform as any).writeDeclaration(input, output, application);
  console.log(application.resources[0].content);

  t.deepEqual(application.resources[0].content, expected);
});

test('writeDeclaration should rewrite multiple and deeper dependency paths on a best guess', t => {
  const expected = stripIndents`
    import Type1 from '../dependency-folder/index';
    import Type2 = require('../../package-two/second-folder/index');
    const Type3 = require('../../package-two/another-folder/third-folder/index');
    import Type4 from '../../package-three/another-folder/fourth-folder/index';
  `;

  const input = getFileMock(``);
  input.path = '/tmp/patterns/package-one/input/index.tsx';
  input.pattern.manifest.patterns = {
    dependency: 'package-one/dependency-folder',
    secondDependency: 'package-two/second-folder',
    thirdDependency: 'package-two/another-folder/third-folder',
    fourthDependency: 'package-three/another-folder/fourth-folder'
  };
  input.dependencies['dependency'] = getFileMock('', 'dependency-folder');
  input.dependencies['dependency'].path = '/tmp/patterns/package-one/dependency-folder/index.tsx';
  input.dependencies['secondDependency'] = getFileMock('', 'second-folder');
  input.dependencies['secondDependency'].path = '/tmp/patterns/package-two/second-folder/index.tsx';
  input.dependencies['thirdDependency'] = getFileMock('', 'third-folder');
  input.dependencies['thirdDependency'].path = '/tmp/patterns/package-two/another-folder/third-folder/index.tsx';
  input.dependencies['thirdDependency'] = getFileMock('', 'third-folder');
  input.dependencies['thirdDependency'].path = '/tmp/patterns/package-three/another-folder/fourth-folder/index.tsx';
  const application = getApplicationMock();
  application.resources = [];
  const output = {
    status: 0,
    outputText: '',
    declarationText: stripIndents`
      import Type1 from 'dependency';
      import Type2 = require('secondDependency');
      const Type3 = require('thirdDependency');
      import Type4 from 'fourthDependency';
    `
  };

  (createTypescriptTransform as any).writeDeclaration(input, output, application);
  console.log(application.resources[0].content);

  t.deepEqual(application.resources[0].content, expected);
});
