'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add Liquipedia URL and stats
    await queryInterface.addColumn('players', 'liquipedia_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'liquipedia_stats', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add tournament results
    await queryInterface.addColumn('players', 'tournament_results', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add earnings data
    await queryInterface.addColumn('players', 'total_earnings', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('players', 'earnings_by_year', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add team history
    await queryInterface.addColumn('players', 'team_history', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add performance stats
    await queryInterface.addColumn('players', 'deaths_per_map', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'kills_per_map', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'assists_per_map', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'acs_per_map', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // Add tournament stats
    await queryInterface.addColumn('players', 'tournaments_played', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'tournaments_won', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('players', 'tournaments_top_4', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('players', ['liquipedia_url']);
    await queryInterface.addIndex('players', ['total_earnings']);
    await queryInterface.addIndex('players', ['tournaments_played']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('players', ['liquipedia_url']);
    await queryInterface.removeIndex('players', ['total_earnings']);
    await queryInterface.removeIndex('players', ['tournaments_played']);

    // Remove columns
    await queryInterface.removeColumn('players', 'liquipedia_url');
    await queryInterface.removeColumn('players', 'liquipedia_stats');
    await queryInterface.removeColumn('players', 'tournament_results');
    await queryInterface.removeColumn('players', 'total_earnings');
    await queryInterface.removeColumn('players', 'earnings_by_year');
    await queryInterface.removeColumn('players', 'team_history');
    await queryInterface.removeColumn('players', 'deaths_per_map');
    await queryInterface.removeColumn('players', 'kills_per_map');
    await queryInterface.removeColumn('players', 'assists_per_map');
    await queryInterface.removeColumn('players', 'acs_per_map');
    await queryInterface.removeColumn('players', 'tournaments_played');
    await queryInterface.removeColumn('players', 'tournaments_won');
    await queryInterface.removeColumn('players', 'tournaments_top_4');
  }
}; 