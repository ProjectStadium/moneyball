const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if matches table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('matches')) {
        // Create matches table if it doesn't exist
        await queryInterface.createTable('matches', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          tournament_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'tournaments',
              key: 'id'
            }
          },
          team1_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'teams',
              key: 'id'
            }
          },
          team2_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'teams',
              key: 'id'
            }
          },
          map_name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          match_date: {
            type: Sequelize.DATE,
            allowNull: false
          },
          team1_score: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          team2_score: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          winner_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'teams',
              key: 'id'
            }
          },
          match_type: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'bo3'
          },
          status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'completed'
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
        await queryInterface.addIndex('matches', ['tournament_id'], { transaction });
        await queryInterface.addIndex('matches', ['team1_id'], { transaction });
        await queryInterface.addIndex('matches', ['team2_id'], { transaction });
        await queryInterface.addIndex('matches', ['winner_id'], { transaction });
        await queryInterface.addIndex('matches', ['match_date'], { transaction });
        await queryInterface.addIndex('matches', ['map_name'], { transaction });
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
      await queryInterface.dropTable('matches', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 