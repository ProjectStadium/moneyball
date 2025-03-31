const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if player_matches table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('player_matches')) {
        // Create player_matches table if it doesn't exist
        await queryInterface.createTable('player_matches', {
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
          match_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'matches',
              key: 'id'
            }
          },
          // Basic stats
          kills: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          deaths: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          assists: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          score: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          // First blood/death stats
          first_bloods: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          first_deaths: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          first_touches: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          // Objective stats
          plants: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          defuses: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          // Utility stats
          smokes: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          flashes: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          recon: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          traps: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          post_plant_kills: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          flash_assists: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          clutches: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          // Match metadata
          match_date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          map_name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          agent: {
            type: Sequelize.STRING,
            allowNull: true
          },
          role: {
            type: Sequelize.STRING,
            allowNull: true
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
        await queryInterface.addIndex('player_matches', ['player_id'], { transaction });
        await queryInterface.addIndex('player_matches', ['match_id'], { transaction });
        await queryInterface.addIndex('player_matches', ['match_date'], { transaction });
        await queryInterface.addIndex('player_matches', ['agent'], { transaction });
        await queryInterface.addIndex('player_matches', ['role'], { transaction });
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
      await queryInterface.dropTable('player_matches', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 