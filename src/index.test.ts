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
    name: 'name.tsx',
    basename: 'name',
    ext: 'tsx',
    format: 'tsx',
    fs: undefined,
    path: 'path',
    pattern: {
      id,
      base: 'base',
      path: 'path'
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
        function double(n: number) { return n * 2; }
    `, configuration);

  t.is(application.resources.length, 1);
});
