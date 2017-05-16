import * as ts from 'typescript';
import { transpileModule, TranspileOutput } from './transpiler';
import { Application, PatternplateConfiguration, PatterplateFile, TypeScriptTransform, DependencyMap } from './types';
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
      content: output.declarationText,
      file: input
    });
  }
}

function transpile(input: PatterplateFile, compilerOptions: ts.CompilerOptions, application: Application,
    map: DependencyMap): void {
  const transpileOptions: ts.TranspileOptions = {
    compilerOptions,
    fileName: input.path,
    reportDiagnostics: true,
    moduleName: input.basename
  };
  const content = typeof input.buffer === 'string' ? input.buffer : input.buffer.toString('utf-8');
  const output = transpileModule(content, transpileOptions, map, input.pattern.base);
  input.buffer = new Buffer(output.outputText);
  writeDeclaration(input, output, application);
}

function transpileFile(file: PatterplateFile, compilerOptions: ts.CompilerOptions,
  application: Application, map: DependencyMap): void {
  Object.keys(file.dependencies).forEach(localName => {
    const dependency = file.dependencies[localName];
    if (file.pattern.id !== dependency.pattern.id || file.path !== dependency.path) {
      transpileFile(dependency, compilerOptions, application, map);
    }
  });
  transpile(file, compilerOptions, application, map);
}

function buildPattternMap(file: PatterplateFile, map: DependencyMap): void {
  map[file.path] = file;
  if (file.dependencies) {
    Object
      .keys(file.dependencies)
      .forEach(localName => buildPattternMap(file.dependencies[localName], map));
  }
}

function typescriptTransformFactory(application: Application): TypeScriptTransform {
  return async function typescriptTransform(file: PatterplateFile, _, configuration: PatternplateConfiguration):
    Promise<PatterplateFile> {

    const map: DependencyMap = {};
    buildPattternMap(file, map);

    const compilerOptions = configuration.opts || ts.getDefaultCompilerOptions();
    transpileFile(file, compilerOptions, application, map);
    return file;
  };
}
