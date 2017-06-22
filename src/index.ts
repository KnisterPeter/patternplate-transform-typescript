import { dirname, join, resolve, relative, sep } from 'path';
import * as ts from 'typescript';
import { transpileModule, TranspileOutput } from './transpiler';
import { Application, PatternplateConfiguration, PatterplateFile, TypeScriptTransform, DependencyMap } from './types';
import * as utils from './utils';

module.exports = function createTypescriptTransform(application: Application): TypeScriptTransform {
  return typescriptTransformFactory(application);
};

function writeDeclaration(input: PatterplateFile, output: TranspileOutput, application: Application): void {
  if (output.declarationText) {
    const patterns = Object
      .keys(input.pattern.manifest.patterns || {});
    let minDepth: number = -1;
    patterns.forEach(pattern => {
      const remote = ((input.pattern.manifest.patterns || {}) as any)[pattern];
      const remoteDepth = remote.split(sep);
      if (minDepth === -1 || remoteDepth.length < minDepth) {
        minDepth = remoteDepth.length;
      }
    });
    const content = patterns
      .reduce((source, local) => {
        const from = dirname(input.path);
        const remote = ((input.pattern.manifest.patterns || {}) as any)[local];
        const remoteDepth = remote ? Math.min(remote.split(sep).length, minDepth) : 1;
        const relativeRemotePath = new Array(remoteDepth).fill('..').join('/');
        const to = join(relative(from, resolve(from, join(relativeRemotePath, remote))), 'index');
        let result = source;
        while (true) {
          result = source
            // es2015 import
            .replace(new RegExp(`(import.*?from\\s+['"])${local}(['"]\\s*;)`), `$1${to}$2`)
            // import-require
            .replace(new RegExp(`(import.*?=\\s+require\\s*\\(\\s*['"])${local}(['"]\\s*\\)\\s*;)`),
              `$1${to}$2`)
            // commonjs require
            .replace(new RegExp(`((?:var|const|let).*?=\\s+require\\s*\\(\\s*['"])${local}(['"]\\s*\\)\\s*;)`),
              `$1${to}$2`);
          if (result === source) {
            return result;
          }
          source = result;
        }
      }, output.declarationText);

    utils.addOutputArtifact(application, {
      id: `typescript-definition/${input.pattern.id}`,
      pattern: input.pattern.id,
      type: 'd.ts',
      reference: true,
      content,
      file: input
    });
  }
}
module.exports.writeDeclaration = writeDeclaration;

function transpile(input: PatterplateFile, compilerOptions: ts.CompilerOptions, application: Application,
    map: DependencyMap): void {
  // xxx: hack to do not transpile twice
  if ((input as any).typescriptTranspiled) {
    return;
  }
  const transpileOptions: ts.TranspileOptions = {
    compilerOptions,
    fileName: input.path,
    reportDiagnostics: true,
    moduleName: input.basename
  };
  const content = typeof input.buffer === 'string' ? input.buffer : input.buffer.toString('utf-8');
  const output = transpileModule(content, transpileOptions, map, input.pattern.base);
  input.buffer = new Buffer(output.outputText);
  (input as any).typescriptTranspiled = true;
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
