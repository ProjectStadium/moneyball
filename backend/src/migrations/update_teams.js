'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add new columns
    await queryInterface.addColumn('teams', 'vlr_id', {
      type: Sequelize.STRING,
      allowNull: true // temporarily allow null
    });

    await queryInterface.addColumn('teams', 'team_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('teams', 'global_rank', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('teams', 'regional_rank', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('teams', 'rating', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.addColumn('teams', 'roster_size', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('teams', 'social_media', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('teams', 'last_updated', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Modify existing columns
    await queryInterface.changeColumn('teams', 'earnings', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.changeColumn('teams', 'team_abbreviation', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false // Remove unique constraint
    });

    // Remove unused columns
    await queryInterface.removeColumn('teams', 'tag');
    await queryInterface.removeColumn('teams', 'country');
    await queryInterface.removeColumn('teams', 'country_code');
    await queryInterface.removeColumn('teams', 'score');
    await queryInterface.removeColumn('teams', 'record');
    await queryInterface.removeColumn('teams', 'founded_year');
    await queryInterface.removeColumn('teams', 'game');

    // Add indexes
    await queryInterface.addIndex('teams', ['vlr_id'], {
      unique: true,
      name: 'teams_vlr_id_unique'
    });

    await queryInterface.addIndex('teams', ['region'], {
      name: 'teams_region_idx'
    });

    await queryInterface.addIndex('teams', ['global_rank'], {
      name: 'teams_global_rank_idx'
    });

    await queryInterface.addIndex('teams', ['regional_rank'], {
      name: 'teams_regional_rank_idx'
    });

    // Finally, make vlr_id required after all data is migrated
    await queryInterface.changeColumn('teams', 'vlr_id', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('teams', 'teams_vlr_id_unique');
    await queryInterface.removeIndex('teams', 'teams_region_idx');
    await queryInterface.removeIndex('teams', 'teams_global_rank_idx');
    await queryInterface.removeIndex('teams', 'teams_regional_rank_idx');

    // Remove new columns
    await queryInterface.removeColumn('teams', 'vlr_id');
    await queryInterface.removeColumn('teams', 'team_url');
    await queryInterface.removeColumn('teams', 'global_rank');
    await queryInterface.removeColumn('teams', 'regional_rank');
    await queryInterface.removeColumn('teams', 'rating');
    await queryInterface.removeColumn('teams', 'roster_size');
    await queryInterface.removeColumn('teams', 'social_media');
    await queryInterface.removeColumn('teams', 'last_updated');

    // Restore original columns
    await queryInterface.addColumn('teams', 'tag', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('teams', 'country', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('teams', 'country_code', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('teams', 'score', {
      type: Sequelize.FLOAT
    });
    await queryInterface.addColumn('teams', 'record', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('teams', 'founded_year', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('teams', 'game', {
      type: Sequelize.STRING
    });

    // Restore original column types
    await queryInterface.changeColumn('teams', 'earnings', {
      type: Sequelize.FLOAT
    });

    await queryInterface.changeColumn('teams', 'team_abbreviation', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
}; 