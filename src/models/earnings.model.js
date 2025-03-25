const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Earnings = sequelize.define('Earnings', {
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
    tournament_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tournaments',
        key: 'id'
      }
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    placement: DataTypes.INTEGER,  // Tournament placement (1st, 2nd, etc.)
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'liquipedia'
    },
    metadata: {
      type: DataTypes.TEXT,  // JSON string of additional earnings data
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
    tableName: 'earnings',
    timestamps: true,
    hooks: {
      beforeUpdate: (earnings) => {
        earnings.last_updated = new Date();
      }
    },
    indexes: [
      { fields: ['player_id'] },
      { fields: ['tournament_id'] },
      { fields: ['team_id'] },
      { fields: ['date'] },
      { fields: ['placement'] }
    ]
  });

  return Earnings;
}; 