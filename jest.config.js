// jest.config.js
module.exports = {
  setupFiles: ['dotenv/config'], // Load environment variables from .env.test
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
  testTimeout: 10000 // 10 seconds for API tests
};