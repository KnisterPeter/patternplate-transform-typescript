import test from 'ava';
import {stripIndents} from 'common-tags';
import {Application, PatterplateFile, PatternplateConfiguration} from './types';

import createTypescriptTransform = require('./index');

function getApplicationMock(): Application {
    return {};
}

function getFileMock(buffer: Buffer|string): PatterplateFile {
    return {
        buffer,
        name: 'name',
        basename: 'basename',
        ext: 'ext',
        format: 'tsx',
        fs: undefined,
        path: 'path',
        pattern: {
            id: 'id',
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

async function transpile(application: Application, codeOrFile: string|PatterplateFile,
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
        "use strict";
        exports.__esModule = true;
        function double(n) { return n * 2; }
    `);
});

test('createTypescriptTransform should transpile module with dependencies', async t => {
    const application = getApplicationMock();
    const file = getFileMock(`
        function double0(n: number) { return n * 2; }
    `);
    file.dependencies['dep'] = getFileMock(`
        function double1(n: number) { return n * 2; }
    `);
    file.dependencies['dep'].dependencies['dep2'] = getFileMock(`
        function double2(n: number) { return n * 2; }
    `);

    const result = await transpile(application, file);

    t.is(result.buffer.toString().trim(), stripIndents`
        "use strict";
        exports.__esModule = true;
        function double0(n) { return n * 2; }
    `);
    t.is(result.dependencies['dep'].buffer.toString().trim(), stripIndents`
        "use strict";
        exports.__esModule = true;
        function double1(n) { return n * 2; }
    `);
    t.is(result.dependencies['dep'].dependencies['dep2'].buffer.toString().trim(), stripIndents`
        "use strict";
        exports.__esModule = true;
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

    t.deepEqual(application.resources[0], {
        id: `typescript-definition/id`,
        pattern: 'id',
        type: 'd.ts',
        reference: true,
        content: 'declare function double(n: number): number;\n'
    });
});
