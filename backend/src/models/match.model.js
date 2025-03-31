const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Match extends Model {}

  Match.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tournament_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tournaments',
        key: 'id'
      }
    },
    team1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    team2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    map_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    match_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    team1_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    team2_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    winner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    match_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'bo3'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'completed'
    }
  }, {
    sequelize,
    modelName: 'Match',
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  Match.associate = (models) => {
    Match.hasMany(models.PlayerMatch, {
      foreignKey: 'match_id',
      as: 'player_matches'
    });
    Match.belongsTo(models.Tournament, {
      foreignKey: 'tournament_id'
    });
    Match.belongsTo(models.Team, {
      foreignKey: 'team1_id',
      as: 'Team1'
    });
    Match.belongsTo(models.Team, {
      foreignKey: 'team2_id',
      as: 'Team2'
    });
    Match.belongsTo(models.Team, {
      foreignKey: 'winner_id',
      as: 'Winner'
    });
  };

  return Match;
}; 