import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { initializeDb, db } from '../models/index.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

console.log('POSTGRES_HOST in database.js:', process.env.POSTGRES_HOST);

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'moneyball_test',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'FourZero26!',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5433,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Initialize models and set up `db`
await initializeDb(sequelize, Sequelize);

// Export both `sequelize` and `db`
export { sequelize, db };