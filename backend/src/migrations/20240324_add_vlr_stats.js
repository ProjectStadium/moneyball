'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('players', 'kda', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Kill/Death/Assist ratio from VLR'
    });

    await queryInterface.addColumn('players', 'kd_ratio', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Kill/Death ratio from VLR'
    });

    await queryInterface.addColumn('players', 'acs', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Average Combat Score from VLR'
    });

    await queryInterface.addColumn('players', 'deaths_per_map', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Deaths per Map from VLR'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('players', 'kda');
    await queryInterface.removeColumn('players', 'kd_ratio');
    await queryInterface.removeColumn('players', 'acs');
    await queryInterface.removeColumn('players', 'deaths_per_map');
  }
}; 