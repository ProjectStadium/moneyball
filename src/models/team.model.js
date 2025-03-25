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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    abbreviation: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    logo_url: DataTypes.STRING,
    country: DataTypes.STRING,
    region: DataTypes.STRING,
    metadata: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('metadata');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value));
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    hooks: {
      beforeUpdate: (team) => {
        team.last_updated = new Date();
      }
    }
  });

  return Team;
};