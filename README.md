> TypeScript transform for patternplate patterns

# patternplate-transform-typescript

[![Greenkeeper badge](https://badges.greenkeeper.io/KnisterPeter/patternplate-transform-typescript.svg)](https://greenkeeper.io/)

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

---
Built by (c) Markus Wolf. Released under the [MIT license]('./LICENSE').