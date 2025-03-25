require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../utils/database');
const path = require('path');
const fs = require('fs');
const { QueryTypes } = require('sequelize');

async function runMigrations() {
  const transaction = await sequelize.transaction();
  
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log('Starting migrations...');

    // Drop and recreate migrations table
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.includes('SequelizeMeta')) {
      console.log('Dropping existing migrations table...');
      await sequelize.getQueryInterface().dropTable('SequelizeMeta', { transaction });
    }

    console.log('Creating migrations table...');
    await sequelize.getQueryInterface().createTable('SequelizeMeta', {
      name: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      }
    }, { transaction });

    // Run each migration in sequence
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      console.log(`Running migration: ${migrationName}`);
      const migration = require(path.join(migrationsDir, file));
      
      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize, { transaction });
        
        // Record migration in SequelizeMeta
        await sequelize.getQueryInterface().sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES ($1)',
          {
            type: QueryTypes.INSERT,
            bind: [migrationName],
            transaction
          }
        );
        
        console.log(`Completed migration: ${migrationName}`);
      } catch (error) {
        console.error(`Error in migration ${migrationName}:`, error);
        throw error;
      }
    }

    await transaction.commit();
    console.log('All migrations completed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 