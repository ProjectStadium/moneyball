// jest.config.js
require('dotenv').config({ path: '.env.test' });

module.exports = {
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
  testTimeout: 30000, // Increase timeout to 30 seconds
  maxWorkers: 1, // Run tests serially to avoid database conflicts
  forceExit: true, // Force exit after tests complete
  setupFilesAfterEnv: ['./__tests__/helpers/setup.js']
};