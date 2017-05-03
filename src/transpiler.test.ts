import test from 'ava';
import * as ts from 'typescript';

import { transpileModule } from './transpiler';

test('Error during declaration building should log warnings/errors', t => {
  const origError = console.error;
  try {
    const lines: string[] = [];
    console.error = function(message: string): void {
      lines.push(message);
    };

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

    transpileModule(input, options, manifest, root);

    t.deepEqual(lines, [
      `module.tsx (6,14): Exported type alias \'ColorOptions\' has or is using private name \'RGB\'.`]);
  } finally {
    console.error = origError;
  }
});
