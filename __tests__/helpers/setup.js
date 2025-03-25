// __tests__/helpers/setup.js
const cron = require('node-cron');
const { sequelize } = require('../../src/utils/database');

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_DB = 'moneyball_test';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'FourZero26!';

// Mock node-cron to prevent actual scheduling
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

// Global setup - initialize database before all tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');
    await sequelize.sync({ force: true });
    console.log('Test database synced successfully.');
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    throw error;
  }
}, 30000); // Increase timeout to 30 seconds

// Clear all mocks after each test
afterEach(async () => {
  jest.clearAllMocks();
  // Clear all tables after each test
  await sequelize.truncate({ cascade: true });
});

// Clean up after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed successfully.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
});

module.exports = {
  sequelize,
  // Export any helper functions needed by tests
};