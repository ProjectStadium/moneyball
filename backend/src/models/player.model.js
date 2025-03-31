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
    kast: DataTypes.FLOAT,       // Kill/Assist/Survival/Trade percentage
    adr: DataTypes.FLOAT,        // Average Damage per Round
    kpr: DataTypes.FLOAT,        // Kills per Round
    apr: DataTypes.FLOAT,        // Assists per Round
    fk_pr: DataTypes.FLOAT,      // First Kills per Round
    fd_pr: DataTypes.FLOAT,      // First Deaths per Round
    hs_pct: DataTypes.FLOAT,     // Headshot Percentage
    rating: DataTypes.FLOAT,     // Overall player rating
    
    // Liquipedia-specific stats
    liquipedia_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    liquipedia_stats: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('liquipedia_stats');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('liquipedia_stats', value ? JSON.stringify(value) : null);
      }
    },
    tournament_results: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('tournament_results');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('tournament_results', value ? JSON.stringify(value) : null);
      }
    },
    deaths_per_map: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    kills_per_map: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    assists_per_map: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    acs_per_map: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    tournaments_played: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tournaments_won: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tournaments_top_4: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
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
      get() {
        const value = this.getDataValue('playstyle');
        try {
          return value ? JSON.parse(value) : {};
        } catch (e) {
          console.error('Error parsing playstyle:', e);
          return {};
        }
      },
      set(value) {
        try {
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          this.setDataValue('playstyle', JSON.stringify(parsedValue));
        } catch (e) {
          console.error('Error stringifying playstyle:', e);
          this.setDataValue('playstyle', '{}');
        }
      }
    },
    division: {
      type: DataTypes.ENUM('T1', 'T2', 'T3', 'T4'),
      defaultValue: 'T3',
      allowNull: false
    },
    division_details: {
      type: DataTypes.TEXT,      // JSON string with division analysis
      get() {
        const value = this.getDataValue('division_details');
        try {
          return value ? JSON.parse(value) : {
            current_division: 'T3',
            consistency_score: 0,  // 0-100, higher means more consistent at their tier
            tournaments_at_current_division: 0,
            last_division_change: null,
            division_history: [],  // Array of past divisions with dates
            highest_division_achieved: 'T3',
            notes: null
          };
        } catch (e) {
          console.error('Error parsing division_details:', e);
          return {
            current_division: 'T3',
            consistency_score: 0,
            tournaments_at_current_division: 0,
            last_division_change: null,
            division_history: [],
            highest_division_achieved: 'T3',
            notes: null
          };
        }
      },
      set(value) {
        try {
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          this.setDataValue('division_details', JSON.stringify(parsedValue));
        } catch (e) {
          console.error('Error stringifying division_details:', e);
          this.setDataValue('division_details', '{}');
        }
      }
    },
    estimated_value: {
      type: DataTypes.INTEGER, // Estimated monthly salary
      allowNull: true
    },
    tournament_history: {
      type: DataTypes.TEXT,      // JSON string of tournament participation
      get() {
        const value = this.getDataValue('tournament_history');
        try {
          return value ? JSON.parse(value) : [];
        } catch (e) {
          console.error('Error parsing tournament_history:', e);
          return [];
        }
      },
      set(value) {
        try {
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          this.setDataValue('tournament_history', JSON.stringify(parsedValue));
        } catch (e) {
          console.error('Error stringifying tournament_history:', e);
          this.setDataValue('tournament_history', '[]');
        }
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
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
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('earnings_by_year', value ? JSON.stringify(value) : null);
      }
    },
    tournament_earnings: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('tournament_earnings');
        try {
          return value ? JSON.parse(value) : [];
        } catch (e) {
          console.error('Error parsing tournament_earnings:', e);
          return [];
        }
      },
      set(value) {
        try {
          const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
          this.setDataValue('tournament_earnings', JSON.stringify(parsedValue));
        } catch (e) {
          console.error('Error stringifying tournament_earnings:', e);
          this.setDataValue('tournament_earnings', '[]');
        }
      }
    },
    earnings_last_updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Additional fields
    source: {
      type: DataTypes.STRING,    // Data source (e.g., "VLR", "Liquipedia")
      allowNull: true
    },
    current_act: {
      type: DataTypes.STRING,    // Current Valorant Act/Season
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
      allowNull: true,
      defaultValue: 0
    },
    team_history: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('team_history');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('team_history', value ? JSON.stringify(value) : null);
      }
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
      { fields: ['estimated_value'] },
      { fields: ['liquipedia_url'] }
    ]
  });

  // Define associations
  Player.associate = (models) => {
    Player.hasMany(models.PlayerMatch, {
      foreignKey: 'player_id',
      as: 'player_matches'
    });
    Player.hasMany(models.Earnings, {
      foreignKey: 'player_id',
      as: 'earnings'
    });
    Player.hasMany(models.PlayerTournamentHistory, {
      foreignKey: 'player_id',
      as: 'tournament_entries'
    });
  };

  return Player;
};