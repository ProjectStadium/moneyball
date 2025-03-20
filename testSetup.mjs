import dotenv from 'dotenv';
import { initializeDb } from './src/models/index.js';
import { sequelize } from './src/utils/database.js';

dotenv.config({ path: '.env.test' });

before(async () => {
  await initializeDb(sequelize, Sequelize);
  console.log('Test database initialized');
});

after(async () => {
  await sequelize.close();
  console.log('Test database connection closed');
});

console.log('POSTGRES_HOST in testSetup:', process.env.POSTGRES_HOST);