// First, set up environment variables BEFORE any imports
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'moneyball_test';
process.env.POSTGRES_USER = 'esports_user';
process.env.POSTGRES_PASSWORD = 'FourZero26!';
process.env.NODE_ENV = 'test';

// AFTER setting environment variables, import the database
const { Sequelize } = require('sequelize');
const initModels = require('../../src/models');

const sequelize = new Sequelize('test_db', 'test_user', 'test_password', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres' // Explicitly supply the dialect
});
const db = initModels(sequelize, Sequelize);

// Global setup for tests
beforeAll(async () => {
  // Connect to test database
  try {
    await sequelize.authenticate();
    console.log('Test database connection established');
  } catch (error) {
    console.error('Unable to connect to test database:', error);
  }
});

afterAll(async () => {
  // Close database connections after all tests
  await db.sequelize.close();
});

module.exports = db;