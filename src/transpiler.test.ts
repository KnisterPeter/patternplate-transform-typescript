import test from 'ava';
import * as ts from 'typescript';

import { transpileModule } from './transpiler';

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
