// __tests__/helpers/teardown.js
const db = require('../../src/models');

// Clear test database tables
async function clearDatabase() {
  try {
    await db.Player.destroy({ where: {}, truncate: { cascade: true } });
    await db.Team.destroy({ where: {}, truncate: { cascade: true } });
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Close database connections after all tests
module.exports = async () => {
  try {
    await clearDatabase();
    await db.sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during teardown:', error);
  }
};

// Export the clearDatabase function for use in individual tests
module.exports.clearDatabase = clearDatabase;