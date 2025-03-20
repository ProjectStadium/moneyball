console.log('db.Team:', db.Team);
// src/models/team.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Team = sequelize.define(
    'Team',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      team_abbreviation: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
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
      logo_url: DataTypes.STRING,
    },
    {
      indexes: [
        { fields: ['team_abbreviation'] },
        { fields: ['region'] },
        { fields: ['country'] },
      ],
    }
  );

  // Define associations (if any)
  Team.associate = (models) => {
    // Example: Team has many Players
    Team.hasMany(models.Player, { foreignKey: 'team_id', as: 'players' });
  };

  return Team;
};