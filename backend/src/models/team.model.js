// src/models/team.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // This implements the Team model based on your schema documentation
  const Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_abbreviation: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    full_team_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    team_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    roster_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Additional metadata fields
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    social_media: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['region']
      },
      {
        fields: ['rank']
      }
    ]
  });

  return Team;
};