import * as ts from 'typescript';

module.exports = function createTypescriptTransform(): typeof typescriptTransform {
    return typescriptTransform;
};

interface PatterplateFile {
    buffer: Buffer;
    name: string;
    basename: string;
    ext: string;
    format: string;
    fs: any;
    path: string;
    pattern: {
        base: string;
        path: string;
    };
    meta: any;
    dependencies: any;
    in: string;
    out: string;
}

interface PatternplateConfiguration {
    opts: ts.CompilerOptions;
}

function transpile(input: PatterplateFile, compilerOptions: ts.CompilerOptions): void {
    const transpileOptions: ts.TranspileOptions = {
        compilerOptions,
        fileName: input.name,
        reportDiagnostics: true,
        moduleName: input.basename
    };
    const output = ts.transpileModule(input.buffer.toString('utf-8'), transpileOptions);
    input.buffer = new Buffer(output.outputText);
}

async function typescriptTransform(file: PatterplateFile, _, configuration: PatternplateConfiguration):
        Promise<PatterplateFile> {
    // console.log(`Transform ${file.path} with TypeScript`);
    const compilerOptions = configuration.opts || ts.getDefaultCompilerOptions();

    Object.values(file.dependencies).forEach(file => transpile(file, compilerOptions));
    transpile(file, compilerOptions);

    return file;
}
