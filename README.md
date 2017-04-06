> TypeScript transform for patternplate patterns

# patternplate-transform-typescript

[![GitHub license][license-image]][license-link]
[![npm][npm-image]][npm-link]
[![Travis][ci-image]][ci-link]
[![Coverage Status][coverage-image]][coverage-link]
[![Commitizen friendly][commitizen-image]][commitizen-link]
[![Standard Version][standard-version-image]][standard-version-link]

## Installation

```shell
npm install --save-dev typescript patternplate-transform-typescript
```

## Usage

```js
// configuration/patternplate-server/transforms.js
module.exports = {
  'typescript': {
    inFormat: 'tsx',
    outFormat: 'js',
    opts: {
      target: 'es5',
      module: 'commonjs',
      jsx: 'react'
    }
  },
  'react-to-markup': {
    inFormat: 'js',
    outFormat: 'html',
    opts: {
      automount: true
    }
  }
};

// configuration/patternplate-server/pattern.js
module.exports = {
  formats: {
    js: {
      transforms: ['typescript', 'react-to-markup']
    }
  }
};

```

Note: Currently there are a [few transpiler/compiler defaults](https://github.com/KnisterPeter/patternplate-transform-typescript/blob/master/src/transpiler.ts#L22-L90) which are not overridable

---
Built by (c) Markus Wolf. Released under the [MIT license]('./LICENSE').

[license-image]: https://img.shields.io/github/license/KnisterPeter/patternplate-transform-typescript.svg
[license-link]: https://github.com/KnisterPeter/patternplate-transform-typescript
[npm-image]: https://img.shields.io/npm/v/patternplate-transform-typescript.svg
[npm-link]: https://www.npmjs.com/package/patternplate-transform-typescript
[ci-image]: https://img.shields.io/travis/KnisterPeter/patternplate-transform-typescript.svg
[ci-link]: https://travis-ci.org/KnisterPeter/patternplate-transform-typescript
[coverage-image]: https://coveralls.io/repos/github/KnisterPeter/patternplate-transform-typescript/badge.svg?branch=master
[coverage-link]: https://coveralls.io/github/KnisterPeter/patternplate-transform-typescript?branch=master
[commitizen-image]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-link]: http://commitizen.github.io/cz-cli/
[standard-version-image]: https://img.shields.io/badge/release-standard%20version-brightgreen.svg
[standard-version-link]: https://github.com/conventional-changelog/standard-version
