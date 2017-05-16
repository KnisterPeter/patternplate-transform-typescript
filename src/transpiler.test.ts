import test from 'ava';
import * as ts from 'typescript';

import { transpileModule, resolveDependency } from './transpiler';

test('Error during declaration building should fail fast', t => {
  const origError = console.error;
  try {
    const input = `
      type RGB = [number, number, number];

      type ColorOptions = {
        displayName: string;
        rgb: RGB;
      };

      export default ColorOptions;
    `;
    const options = ts.getDefaultCompilerOptions();
    const manifest = {};
    const root = '/tmp';

    t.throws(() => transpileModule(input, options, manifest, root),
      `module.tsx (6,14): Exported type alias \'ColorOptions\' has or is using private name \'RGB\'.`);
  } finally {
    console.error = origError;
  }
});

test('resolveDependency should not resolve relative paths', t => {
  const resolved = resolveDependency('./moduleName',
    'containingFile', {}, 'patternRoot', ts.getDefaultCompilerOptions());
  t.falsy(resolved);
});

test('resolveDependency should resolve Pattern if in demo.tsx', t => {
  const resolved = resolveDependency('Pattern',
    './demo.tsx', {}, '/patternRoot/', ts.getDefaultCompilerOptions());
  t.deepEqual(resolved, {
    resolvedFileName: './index.tsx'
  });
});

test('resolveDependency should resolve patterns from pattern.json', t => {
  const map = {
    '/patternRoot/pattern/index.tsx': {
      pattern: {
        manifest: {
          patterns: {
            dependency: 'dependency'
          }
        }
      }
    } as any
  };
  const resolved = resolveDependency('dependency',
    '/patternRoot/pattern/index.tsx', map, '/patternRoot/', ts.getDefaultCompilerOptions());
  t.deepEqual(resolved, {
    resolvedFileName: '/patternRoot/dependency/index.tsx'
  });
});
