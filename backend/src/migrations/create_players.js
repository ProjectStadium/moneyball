const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if players table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('players')) {
        // Create players table if it doesn't exist
        await queryInterface.createTable('players', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
          },
          full_identifier: {
            type: Sequelize.STRING,
            allowNull: true
          },
          player_img_url: {
            type: Sequelize.STRING,
            allowNull: true
          },
          team_name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          team_abbreviation: {
            type: Sequelize.STRING,
            allowNull: true
          },
          team_logo_url: {
            type: Sequelize.STRING,
            allowNull: true
          },
          country_name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          country_code: {
            type: Sequelize.STRING,
            allowNull: true
          },
          is_free_agent: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          // Performance metrics
          acs: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          kd_ratio: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          adr: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          kpr: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          apr: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          fk_pr: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          fd_pr: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          hs_pct: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          rating: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          agent_usage: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          playstyle: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          division: {
            type: Sequelize.STRING,
            defaultValue: 'T3'
          },
          estimated_value: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          tournament_history: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          last_updated: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          total_earnings: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
          },
          earnings_by_year: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          tournament_earnings: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          earnings_last_updated: {
            type: Sequelize.DATE,
            allowNull: true
          },
          source: {
            type: Sequelize.STRING,
            allowNull: true
          },
          current_act: {
            type: Sequelize.STRING,
            allowNull: true
          },
          leaderboard_rank: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          ranked_rating: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          number_of_wins: {
            type: Sequelize.INTEGER,
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
        await queryInterface.addIndex('players', ['name'], { transaction });
        await queryInterface.addIndex('players', ['team_abbreviation'], { transaction });
        await queryInterface.addIndex('players', ['is_free_agent'], { transaction });
        await queryInterface.addIndex('players', ['country_code'], { transaction });
        await queryInterface.addIndex('players', ['division'], { transaction });
        await queryInterface.addIndex('players', ['estimated_value'], { transaction });
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
      await queryInterface.dropTable('players', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 