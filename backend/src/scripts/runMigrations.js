const { Sequelize } = require('sequelize');
const config = require('../config/database');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging
});

async function runMigrations() {
  try {
    // Read all migration files
    const migrationFiles = fs.readdirSync(path.join(__dirname, '../../migrations'))
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log('Found migration files:', migrationFiles);

    // Create SequelizeMeta table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL,
        PRIMARY KEY ("name")
      );
    `);

    // Get executed migrations
    const [executedMigrations] = await sequelize.query('SELECT "name" FROM "SequelizeMeta"');
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(__dirname, '../../migrations', file));
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        
        // Record migration in SequelizeMeta
        await sequelize.query('INSERT INTO "SequelizeMeta" ("name") VALUES (?)', {
          replacements: [file],
          type: Sequelize.QueryTypes.INSERT
        });
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await sequelize.close();
  }
}

// Run migrations
runMigrations(); 