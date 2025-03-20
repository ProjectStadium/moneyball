// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./__tests__/helpers/setup.js'],
  globalTeardown: './__tests__/helpers/teardown.js',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!**/node_modules/**'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  // Remove the duplicate setupFilesAfterEnv
  testTimeout: 10000 // 10 seconds for API tests
};