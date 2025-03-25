const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlayerTournamentHistory = sequelize.define('PlayerTournamentHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    player_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'players',
        key: 'id'
      }
    },
    tournament_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tournaments',
        key: 'id'
      }
    },
    team_id: {
      type: DataTypes.UUID,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    placement: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    performance_stats: {
      type: DataTypes.TEXT,  // JSON string of player's stats in this tournament
      get() {
        const value = this.getDataValue('performance_stats');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('performance_stats', JSON.stringify(value));
      }
    },
    division_at_time: {
      type: DataTypes.ENUM('T1', 'T2', 'T3', 'T4'),
      allowNull: false,
      defaultValue: 'T3'
    },
    division_change: {
      type: DataTypes.ENUM('promoted', 'relegated', 'maintained'),
      allowNull: false,
      defaultValue: 'maintained'
    },
    notes: DataTypes.TEXT
  }, {
    tableName: 'player_tournament_history',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['player_id'] },
      { fields: ['tournament_id'] },
      { fields: ['team_id'] },
      { fields: ['division_at_time'] },
      { fields: ['division_change'] },
      { fields: ['placement'] }
    ]
  });

  return PlayerTournamentHistory;
}; 