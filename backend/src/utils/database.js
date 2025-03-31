// src/utils/database.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

// Set NODE_ENV to development for logging
const env = process.env.NODE_ENV || 'development';

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    }
  });
} else {
  console.log('Using individual connection parameters');
  // Validate required environment variables for individual connection
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

  sequelize = new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      dialect: 'postgres',
      logging: env === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
        handleDisconnects: true
      }
    }
  );
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
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