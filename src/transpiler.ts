import * as path from 'path';
import * as ts from 'typescript';
import { PatternManifest } from './types';

export interface TranspileOptions {
  compilerOptions?: ts.CompilerOptions;
  fileName?: string;
  reportDiagnostics?: boolean;
  moduleName?: string;
  renamedDependencies?: ts.MapLike<string>;
}

export interface TranspileOutput {
  status: number;
  outputText: string;
  declarationText?: string;
  diagnostics?: ts.Diagnostic[];
  sourceMapText?: string;
}

// tslint:disable cyclomatic-complexity
export function transpileModule(input: string, transpileOptions: TranspileOptions,
    patternManifest: PatternManifest, patternRoot: string): TranspileOutput {
  const options: ts.CompilerOptions = transpileOptions.compilerOptions || ts.getDefaultCompilerOptions();

  if (options.jsx && typeof options.jsx === 'string') {
    switch ((options.jsx as string).toLowerCase()) {
      case 'none':
        options.jsx = ts.JsxEmit.None;
        break;
      case 'preserve':
        options.jsx = ts.JsxEmit.Preserve;
        break;
      case 'react':
        options.jsx = ts.JsxEmit.React;
        break;
      case 'react-native':
        options.jsx = ts.JsxEmit.ReactNative;
        break;
    }
  }

  if (options.target && typeof options.target === 'string') {
    switch ((options.target as string).toLowerCase()) {
      case 'es3':
        options.target = ts.ScriptTarget.ES3;
        break;
      case 'es5':
        options.target = ts.ScriptTarget.ES5;
        break;
      case 'es2015':
        options.target = ts.ScriptTarget.ES2015;
        break;
      case 'es2016':
        options.target = ts.ScriptTarget.ES2016;
        break;
      case 'es2017':
        options.target = ts.ScriptTarget.ES2017;
        break;
      case 'esnext':
        options.target = ts.ScriptTarget.ESNext;
        break;
    }
  }

  if (options.module && typeof options.module === 'string') {
    switch ((options.module as string).toLowerCase()) {
      case 'amd':
        options.module = ts.ModuleKind.AMD;
        break;
      case 'commonjs':
        options.module = ts.ModuleKind.CommonJS;
        break;
      case 'es2015':
        options.module = ts.ModuleKind.ES2015;
        break;
      case 'none':
        options.module = ts.ModuleKind.None;
        break;
      case 'system':
        options.module = ts.ModuleKind.System;
        break;
      case 'umd':
        options.module = ts.ModuleKind.UMD;
        break;
    }
  }

  // if jsx is specified then treat file as .tsx
  const inputFileName = transpileOptions.fileName || (options.jsx ? 'module.tsx' : 'module.ts');
  const sourceFile = ts.createSourceFile(inputFileName, input, options.target || ts.ScriptTarget.ES5);
  if (transpileOptions.moduleName) {
    sourceFile.moduleName = transpileOptions.moduleName;
  }

  // output
  let outputText = '';
  let declarationText = '';
  let sourceMapText = '';

  // create a compilerHost object to allow the compiler to read and write files
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => {
      if (fileName === inputFileName) {
        return sourceFile;
      }
      try {
        return ts.createSourceFile(fileName, ts.sys.readFile(fileName), options.target || ts.ScriptTarget.ES5);
      } catch (e) {
        console.error('failed to read source-file', fileName);
        return undefined!;
      }
    },
    writeFile: (name, text) => {
      if (name.endsWith('.map')) {
        sourceMapText = text;
      } else if (name.endsWith('.d.ts')) {
        declarationText = text;
      } else {
        outputText = text;
      }
    },
    getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getCanonicalFileName: fileName => ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
    getNewLine: () => ts.sys.newLine,
    fileExists: (fileName): boolean => ts.sys.fileExists(fileName),
    readFile: path => ts.sys.readFile(path),
    directoryExists: path => ts.sys.directoryExists(path),
    getDirectories: () => [],
    resolveModuleNames(moduleNames: string[], containingFile: string): (ts.ResolvedModule)[] {
      return moduleNames.map(moduleName => {
        // try patternplate demo Pattern dependency
        if (moduleName === 'Pattern' && containingFile.endsWith('demo.tsx')) {
          return { resolvedFileName: containingFile.replace('demo.tsx', 'index.tsx') };
        }

        if (patternManifest.patterns && moduleName in patternManifest.patterns) {
          const resolvedFileName = path.join(patternRoot, patternManifest.patterns[moduleName], 'index.tsx');
          return { resolvedFileName };
        }

        // try to use standard resolution
        const result = ts.resolveModuleName(moduleName, containingFile, options,
          { fileExists: ts.sys.fileExists, readFile: ts.sys.readFile });
        if (result.resolvedModule) {
          return result.resolvedModule;
        }

        // note: as any is a quirk here, since the CompilerHost interface does not allow strict null checks
        return undefined as any;
      });
    }
  };

  const program = ts.createProgram([inputFileName], options, compilerHost);

  const result = program.emit();
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);
  allDiagnostics.forEach(diagnostic => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.error(`${message}`);
    }
  });
  const exitCode = result.emitSkipped ? 1 : 0;

  return {
    status: exitCode,
    outputText,
    declarationText,
    diagnostics: allDiagnostics,
    sourceMapText
  };
}
