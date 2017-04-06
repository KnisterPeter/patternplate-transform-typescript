import * as ts from 'typescript';

export interface TranspileOptions {
  compilerOptions?: ts.CompilerOptions;
  fileName?: string;
  reportDiagnostics?: boolean;
  moduleName?: string;
  renamedDependencies?: ts.MapLike<string>;
}

export interface TranspileOutput {
  outputText: string;
  declarationText?: string;
  diagnostics?: ts.Diagnostic[];
  sourceMapText?: string;
}

// tslint:disable cyclomatic-complexity
export function transpileModule(input: string, transpileOptions: TranspileOptions): TranspileOutput {
  const diagnostics: ts.Diagnostic[] = [];

  const options: ts.CompilerOptions = transpileOptions.compilerOptions || ts.getDefaultCompilerOptions();

  options.isolatedModules = true;

  // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts
  // between input and output paths.
  options.suppressOutputPathCheck = true;

  // filename can be non-ts file.
  options.allowNonTsExtensions = true;

  // we are not returning a sourceFile for lib file when asked by the program,
  // so pass --noLib to avoid reporting a file not found error.
  options.noLib = true;

  // clear out other settings that would not be used in transpiling this module
  options.lib = undefined;
  options.types = undefined;
  options.noEmit = undefined;
  options.noEmitOnError = undefined;
  options.paths = undefined;
  options.rootDirs = undefined;
  options.declarationDir = undefined;
  options.out = undefined;
  options.outFile = undefined;

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

  // we are not doing a full typecheck, we are not resolving the whole context,
  // so pass --noResolve to avoid reporting missing file errors.
  options.noResolve = true;

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
    getSourceFile: (fileName) => fileName === inputFileName ? sourceFile : undefined!,
    writeFile: (name, text) => {
      if (name.endsWith('.map')) {
        sourceMapText = text;
      } else if (name.endsWith('.d.ts')) {
        declarationText = text;
      } else {
        outputText = text;
      }
    },
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => '\n',
    fileExists: (fileName): boolean => fileName === inputFileName,
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => []
  };

  const program = ts.createProgram([inputFileName], options, compilerHost);

  program.emit();

  return {
    outputText,
    declarationText,
    diagnostics,
    sourceMapText
  };
}
