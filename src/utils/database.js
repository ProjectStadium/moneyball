if (process.env.NODE_ENV === 'test') {
  // No need to load .env.test here; jest.config.js handles it
}

// src/utils/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST', 
  'POSTGRES_PORT', 
  'POSTGRES_DB', 
  'POSTGRES_USER', 
  'POSTGRES_PASSWORD'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.POSTGRES_DB,    // database
  process.env.POSTGRES_USER,  // username
  process.env.POSTGRES_PASSWORD, // password
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,     // Maximum number of connection in pool
      min: 0,     // Minimum number of connection in pool
      acquire: 30000,  // Maximum time (ms) to acquire a connection
      idle: 10000      // Maximum time (ms) a connection can be idle
    },
    define: {
      // Automatically add timestamps
      timestamps: true,
      // Use snake_case for automatically added attributes
      underscored: true
    }
  }
);

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Initialize database connection
testConnection();

module.exports = sequelize;