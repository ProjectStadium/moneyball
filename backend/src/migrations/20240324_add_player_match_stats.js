'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('player_matches', 'flash_assists', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of flash assists in the match'
    });

    await queryInterface.addColumn('player_matches', 'clutches', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of clutches in the match'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('player_matches', 'flash_assists');
    await queryInterface.removeColumn('player_matches', 'clutches');
  }
}; 