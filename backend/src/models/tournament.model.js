const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    liquipedia_url: {
      type: DataTypes.STRING,
      unique: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    prize_pool: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'upcoming'
    },
    region: DataTypes.STRING,
    organizer: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('major', 'minor', 'qualifier', 'showmatch', 'other'),
      defaultValue: 'other'
    },
    tier: {
      type: DataTypes.ENUM('S', 'A', 'B', 'C', 'Qualifier'),
      allowNull: false,
      defaultValue: 'C'
    },
    format: {
      type: DataTypes.TEXT,  // JSON string of tournament format details
      get() {
        const value = this.getDataValue('format');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('format', JSON.stringify(value));
      }
    },
    participants: {
      type: DataTypes.TEXT,  // JSON string of participating teams
      get() {
        const value = this.getDataValue('participants');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('participants', JSON.stringify(value));
      }
    },
    results: {
      type: DataTypes.TEXT,  // JSON string of tournament results
      get() {
        const value = this.getDataValue('results');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('results', JSON.stringify(value));
      }
    },
    statistics: {
      type: DataTypes.TEXT,  // JSON string of tournament statistics
      get() {
        const value = this.getDataValue('statistics');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('statistics', JSON.stringify(value));
      }
    },
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
    tableName: 'tournaments',
    timestamps: true,
    underscored: true,  // Use snake_case for timestamp columns
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: (tournament) => {
        tournament.last_updated = new Date();
      }
    },
    indexes: [
      { fields: ['name'] },
      { fields: ['start_date'] },
      { fields: ['status'] },
      { fields: ['region'] },
      { fields: ['type'] }
    ]
  });

  return Tournament;
}; 