const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if earnings table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('earnings')) {
        // Create earnings table if it doesn't exist
        await queryInterface.createTable('earnings', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          player_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'players',
              key: 'id'
            }
          },
          tournament_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'tournaments',
              key: 'id'
            }
          },
          team_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'teams',
              key: 'id'
            }
          },
          amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
          },
          currency: {
            type: Sequelize.STRING,
            defaultValue: 'USD'
          },
          placement: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          source: {
            type: Sequelize.STRING,
            defaultValue: 'liquipedia'
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
        await queryInterface.addIndex('earnings', ['player_id'], { transaction });
        await queryInterface.addIndex('earnings', ['tournament_id'], { transaction });
        await queryInterface.addIndex('earnings', ['team_id'], { transaction });
        await queryInterface.addIndex('earnings', ['date'], { transaction });
        await queryInterface.addIndex('earnings', ['placement'], { transaction });
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
      await queryInterface.dropTable('earnings', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 