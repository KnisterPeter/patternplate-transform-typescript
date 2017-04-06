import * as ts from 'typescript';
import { transpileModule, TranspileOutput } from './transpiler';
import { Application, PatternplateConfiguration, PatterplateFile, TypeScriptTransform } from './types';
import * as utils from './utils';

module.exports = function createTypescriptTransform(application: Application): TypeScriptTransform {
  return typescriptTransformFactory(application);
};

function writeDeclaration(input: PatterplateFile, output: TranspileOutput, application: Application): void {
  if (output.declarationText) {
    utils.addOutputArtifact(application, {
      id: `typescript-definition/${input.pattern.id}`,
      pattern: input.pattern.id,
      type: 'd.ts',
      reference: true,
      content: output.declarationText
    });
  }
}

function transpile(input: PatterplateFile, compilerOptions: ts.CompilerOptions, application: Application): void {
  const transpileOptions: ts.TranspileOptions = {
    compilerOptions,
    fileName: input.name,
    reportDiagnostics: true,
    moduleName: input.basename
  };
  const content = typeof input.buffer === 'string' ? input.buffer : input.buffer.toString('utf-8');
  const output = transpileModule(content, transpileOptions);
  input.buffer = new Buffer(output.outputText);
  writeDeclaration(input, output, application);
}

function transpileFile(file: PatterplateFile, compilerOptions: ts.CompilerOptions,
  application: Application): void {
  Object.keys(file.dependencies).forEach(localName => {
    const dependency = file.dependencies[localName];
    transpileFile(dependency, compilerOptions, application);
  });
  transpile(file, compilerOptions, application);
}

function typescriptTransformFactory(application: Application): TypeScriptTransform {
  return async function typescriptTransform(file: PatterplateFile, _, configuration: PatternplateConfiguration):
    Promise<PatterplateFile> {
    const compilerOptions = configuration.opts || ts.getDefaultCompilerOptions();
    transpileFile(file, compilerOptions, application);
    return file;
  };
}
