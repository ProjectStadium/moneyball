// src/utils/testDatabase.js
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

const testConfig = config.test;
const sequelize = new Sequelize(
  testConfig.database,
  testConfig.username,
  testConfig.password,
  {
    host: testConfig.host,
    dialect: testConfig.dialect,
    logging: false // Suppress logging during tests
  }
);

module.exports = sequelize;