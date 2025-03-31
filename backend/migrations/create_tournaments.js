const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if tournaments table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('tournaments')) {
        // Create tournaments table if it doesn't exist
        await queryInterface.createTable('tournaments', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          liquipedia_url: {
            type: Sequelize.STRING,
            unique: true
          },
          start_date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          end_date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          prize_pool: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
          },
          currency: {
            type: Sequelize.STRING,
            defaultValue: 'USD'
          },
          status: {
            type: Sequelize.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
            defaultValue: 'upcoming'
          },
          region: {
            type: Sequelize.STRING,
            allowNull: true
          },
          organizer: {
            type: Sequelize.STRING,
            allowNull: true
          },
          type: {
            type: Sequelize.ENUM('major', 'minor', 'qualifier', 'showmatch', 'other'),
            defaultValue: 'other'
          },
          format: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          participants: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          results: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          statistics: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          metadata: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          last_updated: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false
          }
        }, { transaction });

        // Add indexes
        await queryInterface.addIndex('tournaments', ['name'], { transaction });
        await queryInterface.addIndex('tournaments', ['start_date'], { transaction });
        await queryInterface.addIndex('tournaments', ['status'], { transaction });
        await queryInterface.addIndex('tournaments', ['region'], { transaction });
        await queryInterface.addIndex('tournaments', ['type'], { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('tournaments', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 