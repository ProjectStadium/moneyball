// src/utils/database.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

// Set NODE_ENV to development for logging
process.env.NODE_ENV = 'development';

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

// Log database configuration (without password)
console.log('Database Configuration:', {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER
});

// Create Sequelize instance with enhanced configuration
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
      max: 10,     // Increased max connections
      min: 2,      // Increased min connections
      acquire: 30000,  // Increased acquire timeout
      idle: 10000,     // Increased idle timeout
      evict: 1000,     // Check for dead connections every second
      handleDisconnects: true
    },
    define: {
      underscored: true,  // Use snake_case for all fields
      timestamps: true,   // Add timestamps
      freezeTableName: true // Don't pluralize table names
    },
    dialectOptions: {
      useUTC: true,
      dateStrings: true,
      typeCast: true,
      // Enable PostgreSQL specific features
      statement_timeout: 60000, // 1 minute timeout
      idle_in_transaction_session_timeout: 60000,
      // Enable RETURNING clause
      returning: true
    },
    retry: {
      max: 5,      // Maximum number of retries
      backoffBase: 1000, // Base delay between retries
      backoffExponent: 1.5 // Exponential backoff
    }
  }
);

// Enhanced connection testing with retries
const testConnection = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting database connection (attempt ${attempt}/${retries})...`);
      await sequelize.authenticate();
      console.log('PostgreSQL connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error('All connection attempts failed');
        throw error;
      }
    }
  }
};

// Enhanced database sync with validation
const syncDatabase = async (force = false) => {
  try {
    // Validate connection before sync
    await testConnection();
    
    // Log sync operation
    console.log(`Starting database sync (force: ${force})...`);
    
    // Perform sync
    await sequelize.sync({ force });
    
    console.log('Database synced successfully.');
    return true;
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

// Transaction helper function
const withTransaction = async (callback) => {
  const t = await sequelize.transaction();
  
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// Batch operation helper
const batchOperation = async (items, operation, batchSize = 100) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)}`);
    const batchResults = await withTransaction(async (t) => {
      return await Promise.all(batch.map(item => operation(item, t)));
    });
    results.push(...batchResults);
  }
  return results;
};

// Export enhanced database utilities
module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  withTransaction,
  batchOperation
};