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
        try {
          return value ? JSON.parse(value) : {};
        } catch (e) {
          console.error('Error parsing agent_usage:', e);
          return {};
        }
      },
      set(value) {
        try {
          // If value is already a string, try to parse it first
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          this.setDataValue('agent_usage', JSON.stringify(parsedValue));
        } catch (e) {
          console.error('Error stringifying agent_usage:', e);
          this.setDataValue('agent_usage', '{}');
        }
      }
    },
    playstyle: {
      type: DataTypes.TEXT,      // JSON string with playstyle analysis
      allowNull: true,
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
      defaultValue: 'T3',
      allowNull: true
    },
    division_details: {
      type: DataTypes.TEXT,      // JSON string with division analysis
      allowNull: true,
      get() {
        const value = this.getDataValue('division_details');
        return value ? JSON.parse(value) : {
          current_division: 'T3',
          consistency_score: 0,  // 0-100, higher means more consistent at their tier
          tournaments_at_current_division: 0,
          last_division_change: null,
          division_history: [],  // Array of past divisions with dates
          highest_division_achieved: 'T3',
          notes: null
        };
      },
      set(value) {
        this.setDataValue('division_details', JSON.stringify(value));
      }
    },
    estimated_value: {
      type: DataTypes.INTEGER, // Estimated monthly salary
      allowNull: true
    },
    tournament_history: {
      type: DataTypes.TEXT,      // JSON string of tournament participation
      allowNull: true,
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
      defaultValue: DataTypes.NOW,
      allowNull: true
    },

    // Earnings and contracts
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    earnings_by_year: {
      type: DataTypes.TEXT,
      allowNull: true,
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
      allowNull: true,
      get() {
        const value = this.getDataValue('tournament_earnings');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('tournament_earnings', JSON.stringify(value));
      }
    },
    earnings_last_updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Additional fields
    source: {
      type: DataTypes.STRING,    // Data source (e.g., "VLR")
      allowNull: true
    },
    current_act: {
      type: DataTypes.STRING, // Current Valorant Act/Season
      allowNull: true
    },
    leaderboard_rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ranked_rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    number_of_wins: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'players',
    timestamps: true,
    underscored: true,  // Use snake_case for timestamp columns
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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