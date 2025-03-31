'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get existing columns
      const [existingColumns] = await queryInterface.sequelize.query(
        'SELECT column_name FROM information_schema.columns WHERE table_name = \'teams\''
      );
      const columnNames = existingColumns.map(col => col.column_name);

      // Add new columns if they don't exist
      const columnsToAdd = [
        { name: 'vlr_id', type: Sequelize.STRING, allowNull: true },
        { name: 'team_url', type: Sequelize.STRING, allowNull: true },
        { name: 'global_rank', type: Sequelize.INTEGER, allowNull: true },
        { name: 'regional_rank', type: Sequelize.INTEGER, allowNull: true },
        { name: 'rating', type: Sequelize.FLOAT, allowNull: true },
        { name: 'roster_size', type: Sequelize.INTEGER, allowNull: true },
        { name: 'social_media', type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
        { name: 'last_updated', type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      ];

      for (const column of columnsToAdd) {
        if (!columnNames.includes(column.name)) {
          console.log(`Adding column: ${column.name}`);
          await queryInterface.addColumn('teams', column.name, column, { transaction });
        } else {
          console.log(`Column already exists: ${column.name}`);
        }
      }

      // Modify existing columns
      await queryInterface.changeColumn('teams', 'earnings', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      }, { transaction });

      await queryInterface.changeColumn('teams', 'team_abbreviation', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false // Remove unique constraint
      }, { transaction });

      // Remove unused columns if they exist
      const columnsToRemove = ['tag', 'country', 'country_code', 'score', 'record', 'founded_year', 'game'];
      for (const columnName of columnsToRemove) {
        if (columnNames.includes(columnName)) {
          console.log(`Removing column: ${columnName}`);
          await queryInterface.removeColumn('teams', columnName, { transaction });
        } else {
          console.log(`Column does not exist: ${columnName}`);
        }
      }

      // Add indexes
      const indexesToAdd = [
        { name: 'teams_vlr_id_unique', columns: ['vlr_id'], unique: true },
        { name: 'teams_region_idx', columns: ['region'] },
        { name: 'teams_global_rank_idx', columns: ['global_rank'] },
        { name: 'teams_regional_rank_idx', columns: ['regional_rank'] }
      ];

      for (const index of indexesToAdd) {
        try {
          await queryInterface.addIndex('teams', index.columns, {
            name: index.name,
            unique: index.unique
          }, { transaction });
          console.log(`Added index: ${index.name}`);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.parent.code === '42P07') {
            console.log(`Index already exists: ${index.name}`);
          } else {
            throw error;
          }
        }
      }

      // Finally, make vlr_id required after all data is migrated
      await queryInterface.changeColumn('teams', 'vlr_id', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove indexes
      const indexesToRemove = ['teams_vlr_id_unique', 'teams_region_idx', 'teams_global_rank_idx', 'teams_regional_rank_idx'];
      for (const indexName of indexesToRemove) {
        try {
          await queryInterface.removeIndex('teams', indexName, { transaction });
          console.log(`Removed index: ${indexName}`);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.parent.code === '42P07') {
            console.log(`Index does not exist: ${indexName}`);
          } else {
            throw error;
          }
        }
      }

      // Remove new columns
      const columnsToRemove = ['vlr_id', 'team_url', 'global_rank', 'regional_rank', 'rating', 'roster_size', 'social_media', 'last_updated'];
      for (const columnName of columnsToRemove) {
        try {
          await queryInterface.removeColumn('teams', columnName, { transaction });
          console.log(`Removed column: ${columnName}`);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.parent.code === '42703') {
            console.log(`Column does not exist: ${columnName}`);
          } else {
            throw error;
          }
        }
      }

      // Restore original columns
      const columnsToAdd = [
        { name: 'tag', type: Sequelize.STRING },
        { name: 'country', type: Sequelize.STRING },
        { name: 'country_code', type: Sequelize.STRING },
        { name: 'score', type: Sequelize.FLOAT },
        { name: 'record', type: Sequelize.STRING },
        { name: 'founded_year', type: Sequelize.INTEGER },
        { name: 'game', type: Sequelize.STRING }
      ];

      for (const column of columnsToAdd) {
        try {
          await queryInterface.addColumn('teams', column.name, column, { transaction });
          console.log(`Added column: ${column.name}`);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.parent.code === '42701') {
            console.log(`Column already exists: ${column.name}`);
          } else {
            throw error;
          }
        }
      }

      // Restore original column types
      await queryInterface.changeColumn('teams', 'earnings', {
        type: Sequelize.FLOAT
      }, { transaction });

      await queryInterface.changeColumn('teams', 'team_abbreviation', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 