const { sequelize, testConnection } = require('../utils/database');
const db = require('../models');
const Player = db.Player;

async function testDb() {
  try {
    // Test connection
    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connection successful!');

    // Try to count players
    console.log('\nCounting players in database...');
    const playerCount = await Player.count();
    console.log(`Found ${playerCount} players in database`);

    // Try to get one player
    if (playerCount > 0) {
      console.log('\nTrying to fetch one player...');
      const player = await Player.findOne();
      console.log('Sample player:', JSON.stringify(player, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('\nError testing database:', error);
    if (error.name === 'SequelizeConnectionError') {
      console.error('Connection details:', {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER
      });
    }
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

testDb(); 