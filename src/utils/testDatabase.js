// src/utils/testDatabase.js
import { Sequelize } from 'sequelize';
import config from '../config/config.json' assert { type: 'json' };

// Extract test configuration
const testConfig = config.test;

// Initialize Sequelize instance for testing
const sequelize = new Sequelize(
  testConfig.database,
  testConfig.username,
  testConfig.password,
  {
    host: testConfig.host,
    dialect: testConfig.dialect,
    logging: false, // Suppress logging during tests
  }
);

export default sequelize;