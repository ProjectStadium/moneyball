const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get existing columns
      const [existingColumns] = await queryInterface.sequelize.query(
        'SELECT column_name FROM information_schema.columns WHERE table_name = \'players\''
      );
      const columnNames = existingColumns.map(col => col.column_name);

      // Add missing columns
      const columnsToAdd = [
        { name: 'liquipedia_url', type: Sequelize.STRING },
        { name: 'liquipedia_stats', type: Sequelize.TEXT },
        { name: 'tournament_results', type: Sequelize.TEXT },
        { name: 'deaths_per_map', type: Sequelize.FLOAT },
        { name: 'kills_per_map', type: Sequelize.FLOAT },
        { name: 'assists_per_map', type: Sequelize.FLOAT },
        { name: 'acs_per_map', type: Sequelize.FLOAT },
        { name: 'tournaments_played', type: Sequelize.INTEGER },
        { name: 'tournaments_won', type: Sequelize.INTEGER },
        { name: 'tournaments_top_4', type: Sequelize.INTEGER },
        { name: 'division_details', type: Sequelize.TEXT },
        { name: 'team_history', type: Sequelize.TEXT },
        { name: 'team_id', type: Sequelize.UUID, references: { model: 'teams', key: 'id' } }
      ];

      for (const column of columnsToAdd) {
        if (!columnNames.includes(column.name)) {
          console.log(`Adding column: ${column.name}`);
          await queryInterface.addColumn('players', column.name, {
            type: column.type,
            allowNull: true,
            references: column.references
          }, { transaction });
        } else {
          console.log(`Column already exists: ${column.name}`);
        }
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
      // Remove columns in reverse order
      const columnsToRemove = [
        'team_id',
        'team_history',
        'division_details',
        'tournaments_top_4',
        'tournaments_won',
        'tournaments_played',
        'acs_per_map',
        'assists_per_map',
        'kills_per_map',
        'deaths_per_map',
        'tournament_results',
        'liquipedia_stats',
        'liquipedia_url'
      ];

      for (const columnName of columnsToRemove) {
        await queryInterface.removeColumn('players', columnName, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 