'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add tier to tournaments table
    await queryInterface.addColumn('tournaments', 'tier', {
      type: Sequelize.ENUM('S', 'A', 'B', 'C', 'Qualifier'),
      allowNull: false,
      defaultValue: 'C'
    });

    // Add division_details to players table
    await queryInterface.addColumn('players', 'division_details', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create player_tournament_history table
    await queryInterface.createTable('player_tournament_history', {
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
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      placement: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      performance_stats: {
        type: Sequelize.TEXT
      },
      division_at_time: {
        type: Sequelize.ENUM('T1', 'T2', 'T3', 'T4'),
        allowNull: false,
        defaultValue: 'T3'
      },
      division_change: {
        type: Sequelize.ENUM('promoted', 'relegated', 'maintained'),
        allowNull: false,
        defaultValue: 'maintained'
      },
      notes: Sequelize.TEXT,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('player_tournament_history', ['player_id']);
    await queryInterface.addIndex('player_tournament_history', ['tournament_id']);
    await queryInterface.addIndex('player_tournament_history', ['team_id']);
    await queryInterface.addIndex('player_tournament_history', ['division_at_time']);
    await queryInterface.addIndex('player_tournament_history', ['division_change']);
    await queryInterface.addIndex('player_tournament_history', ['placement']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('player_tournament_history', ['player_id']);
    await queryInterface.removeIndex('player_tournament_history', ['tournament_id']);
    await queryInterface.removeIndex('player_tournament_history', ['team_id']);
    await queryInterface.removeIndex('player_tournament_history', ['division_at_time']);
    await queryInterface.removeIndex('player_tournament_history', ['division_change']);
    await queryInterface.removeIndex('player_tournament_history', ['placement']);

    // Drop player_tournament_history table
    await queryInterface.dropTable('player_tournament_history');

    // Remove division_details from players
    await queryInterface.removeColumn('players', 'division_details');

    // Remove tier from tournaments
    await queryInterface.removeColumn('tournaments', 'tier');

    // Remove ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tournaments_tier";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_player_tournament_history_division_at_time";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_player_tournament_history_division_change";');
  }
}; 