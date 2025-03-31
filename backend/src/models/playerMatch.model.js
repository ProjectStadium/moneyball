const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PlayerMatch extends Model {}

  PlayerMatch.init({
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
    match_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'matches',
        key: 'id'
      }
    },
    // Basic stats
    kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    deaths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    assists: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // First blood/death stats
    first_bloods: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    first_deaths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    first_touches: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Objective stats
    plants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    defuses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Utility stats
    smokes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    flashes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    recon: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    traps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    post_plant_kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    flash_assists: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    clutches: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Match metadata
    match_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    map_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    agent: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PlayerMatch',
    tableName: 'player_matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  PlayerMatch.associate = (models) => {
    PlayerMatch.belongsTo(models.Player, {
      foreignKey: 'player_id',
      as: 'Player'
    });
    PlayerMatch.belongsTo(models.Match, {
      foreignKey: 'match_id',
      as: 'Match'
    });
  };

  return PlayerMatch;
}; 