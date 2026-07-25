module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',           // This line is important
    '**/*.spec.js'
  ],
  clearMocks: true,
  verbose: true,
  testTimeout: 10000,
};