module.exports = function(wallaby) {
  return {
    files: [
      'src/**/*.ts'
    ],
    tests: [
      'src/**/*.test.ts'
    ],
    env: {
      type: 'node'
    },
    testFramework: 'ava',
    debug: false
  };
}
