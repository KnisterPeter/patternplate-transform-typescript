import * as ts from 'typescript';
import {transpileModule} from './transpiler';

interface PatterplateFile {
    buffer: Buffer;
    name: string;
    basename: string;
    ext: string;
    format: string;
    fs: any;
    path: string;
    pattern: {
        id: string;
        base: string;
        path: string;
    };
    meta: any;
    dependencies: {[name: string]: PatterplateFile};
    in: string;
    out: string;
}

interface PatternplateConfiguration {
    opts: ts.CompilerOptions;
}

interface Application {
    resources?: any;
}

type TypeScriptTransform = (file: PatterplateFile, unused: any, configuration: PatternplateConfiguration) =>
    Promise<PatterplateFile>;

module.exports = function createTypescriptTransform(application: Application): TypeScriptTransform {
    return typescriptTransformFactory(application);
};

function transpile(input: PatterplateFile, compilerOptions: ts.CompilerOptions, application: Application): void {
    const transpileOptions: ts.TranspileOptions = {
        compilerOptions,
        fileName: input.name,
        reportDiagnostics: true,
        moduleName: input.basename
    };
    const output = transpileModule(input.buffer.toString('utf-8'), transpileOptions);
    input.buffer = new Buffer(output.outputText);

    if (application.resources && output.declarationText) {
        application.resources = application.resources.filter(r => r.id !== `typescript-definition/${input.pattern.id}`);
        application.resources.push({
            id: `typescript-definition/${input.pattern.id}`,
            pattern: input.pattern.id,
            type: 'd.ts',
            reference: true,
            content: output.declarationText
        });
    }
}

function typescriptTransformFactory(application: Application): TypeScriptTransform {
    return async function typescriptTransform(file: PatterplateFile, _, configuration: PatternplateConfiguration):
            Promise<PatterplateFile> {
        // console.log(`Transform ${file.path} with TypeScript`);
        const compilerOptions = configuration.opts || ts.getDefaultCompilerOptions();

        Object.values(file.dependencies).forEach(file => transpile(file, compilerOptions, application));
        transpile(file, compilerOptions, application);

        return file;
    };
}
