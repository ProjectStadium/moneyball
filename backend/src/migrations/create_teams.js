'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if teams table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('teams')) {
        // Create teams table if it doesn't exist
        await queryInterface.createTable('teams', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
          },
          team_abbreviation: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          full_team_name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          team_url: {
            type: Sequelize.STRING,
            allowNull: true
          },
          region: {
            type: Sequelize.STRING,
            allowNull: true
          },
          rank: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          rating: {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          earnings: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
          },
          roster_size: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          logo_url: {
            type: Sequelize.STRING,
            allowNull: true
          },
          social_media: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {}
          },
          last_updated: {
            type: Sequelize.DATE,
            allowNull: false,
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
        await queryInterface.addIndex('teams', ['region'], { transaction });
        await queryInterface.addIndex('teams', ['rank'], { transaction });
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
      await queryInterface.dropTable('teams', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 