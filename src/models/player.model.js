// src/models/player.model.js - Update
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    full_identifier: DataTypes.STRING,
    player_img_url: DataTypes.STRING,
    team_name: DataTypes.STRING,
    team_abbreviation: DataTypes.STRING,
    team_logo_url: DataTypes.STRING,
    country_name: DataTypes.STRING,
    country_code: DataTypes.STRING,
    is_free_agent: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Performance metrics
    acs: DataTypes.FLOAT,        // Average Combat Score
    kd_ratio: DataTypes.FLOAT,   // Kill/Death Ratio
    adr: DataTypes.FLOAT,        // Average Damage per Round
    kpr: DataTypes.FLOAT,        // Kills per Round
    apr: DataTypes.FLOAT,        // Assists per Round
    fk_pr: DataTypes.FLOAT,      // First Kills per Round
    fd_pr: DataTypes.FLOAT,      // First Deaths per Round
    hs_pct: DataTypes.FLOAT,     // Headshot Percentage
    rating: DataTypes.FLOAT,     // Overall player rating
    
    // New fields for enhanced analysis
    agent_usage: {
      type: DataTypes.TEXT,      // JSON string of agent usage stats
      get() {
        const value = this.getDataValue('agent_usage');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('agent_usage', JSON.stringify(value));
      }
    },
    playstyle: {
      type: DataTypes.TEXT,      // JSON string with playstyle analysis
      get() {
        const value = this.getDataValue('playstyle');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('playstyle', JSON.stringify(value));
      }
    },
    division: {
      type: DataTypes.STRING,    // T1, T2, T3 classification
      defaultValue: 'T3'
    },
    estimated_value: DataTypes.INTEGER, // Estimated monthly salary
    tournament_history: {
      type: DataTypes.TEXT,      // JSON string of tournament participation
      get() {
        const value = this.getDataValue('tournament_history');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('tournament_history', JSON.stringify(value));
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    // Earnings and contracts
    // Inside the Player.define() call, add these fields:
    total_earnings: DataTypes.DECIMAL(10, 2),
    earnings_by_year: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('earnings_by_year');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('earnings_by_year', JSON.stringify(value));
      }
    },
    tournament_earnings: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('tournament_earnings');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('tournament_earnings', JSON.stringify(value));
      }
    },
    earnings_last_updated: DataTypes.DATE,
    
    // Additional fields
    source: DataTypes.STRING,    // Data source (e.g., "VLR")
    current_act: DataTypes.STRING, // Current Valorant Act/Season
    leaderboard_rank: DataTypes.INTEGER,
    ranked_rating: DataTypes.INTEGER,
    number_of_wins: DataTypes.INTEGER
  }, {
    tableName: 'players',
    timestamps: true,
    hooks: {
      beforeUpdate: (player) => {
        player.last_updated = new Date();
      }
    },
    indexes: [
      { fields: ['name'] },
      { fields: ['team_abbreviation'] },
      { fields: ['is_free_agent'] },
      { fields: ['country_code'] },
      { fields: ['division'] },
      { fields: ['estimated_value'] }
    ]
  });

  return Player;
};