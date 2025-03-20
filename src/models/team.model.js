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
      unique: true,
      allowNull: false
    },
    full_team_name: DataTypes.STRING,
    tag: DataTypes.STRING,
    region: DataTypes.STRING,
    country: DataTypes.STRING,
    country_code: DataTypes.STRING,
    rank: DataTypes.INTEGER,
    score: DataTypes.FLOAT,
    record: DataTypes.STRING,
    earnings: DataTypes.DECIMAL(10, 2),
    founded_year: DataTypes.INTEGER,
    game: DataTypes.STRING,
    logo_url: DataTypes.STRING
  }, {
    indexes: [
      { fields: ['team_abbreviation'] },
      { fields: ['region'] },
      { fields: ['country'] }
    ]
  });

  return Team;
};