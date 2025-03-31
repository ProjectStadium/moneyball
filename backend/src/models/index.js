// src/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: env === 'development' ? console.log : false
  });
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging
  });
}

const db = {};

// Read all model files and initialize them
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-9) === '.model.js'
    );
  });

console.log('Found model files:', modelFiles);

modelFiles.forEach(file => {
  // Initialize each model with the sequelize instance
  const model = require(path.join(__dirname, file))(sequelize);
  console.log('Initialized model:', model.name);
  db[model.name] = model;
});

console.log('Available models:', Object.keys(db));

// Set up associations after all models are loaded
const setupAssociations = () => {
  // Call associate function for each model if it exists
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      console.log(`Setting up associations for ${modelName}`);
      db[modelName].associate(db);
    }
  });

  // Define associations between Team and Player
  if (db.Team && db.Player) {
    console.log('Setting up Team-Player associations');
    db.Team.hasMany(db.Player, {
      foreignKey: 'team_id'
    });
    db.Player.belongsTo(db.Team, {
      foreignKey: 'team_id'
    });
  }

  // Define associations for Tournaments
  if (db.Tournament && db.Earnings) {
    console.log('Setting up Tournament-Earnings associations');
    db.Tournament.hasMany(db.Earnings, {
      foreignKey: 'tournament_id'
    });
    db.Earnings.belongsTo(db.Tournament, {
      foreignKey: 'tournament_id'
    });
  }

  // Define associations for Players and Earnings
  if (db.Player && db.Earnings) {
    console.log('Setting up Player-Earnings associations');
    db.Player.hasMany(db.Earnings, {
      foreignKey: 'player_id'
    });
    db.Earnings.belongsTo(db.Player, {
      foreignKey: 'player_id'
    });
  }

  // Define associations for Teams and Earnings
  if (db.Team && db.Earnings) {
    console.log('Setting up Team-Earnings associations');
    db.Team.hasMany(db.Earnings, {
      foreignKey: 'team_id'
    });
    db.Earnings.belongsTo(db.Team, {
      foreignKey: 'team_id'
    });
  }

  // Define associations for PlayerTournamentHistory
  if (db.Player && db.PlayerTournamentHistory) {
    console.log('Setting up Player-PlayerTournamentHistory associations');
    db.Player.hasMany(db.PlayerTournamentHistory, {
      foreignKey: 'player_id'
    });
    db.PlayerTournamentHistory.belongsTo(db.Player, {
      foreignKey: 'player_id'
    });
  }

  // Define associations for Player, PlayerMatch, and Match
  if (db.Player && db.PlayerMatch && db.Match) {
    console.log('Setting up Player-PlayerMatch-Match associations');
    db.Player.hasMany(db.PlayerMatch, {
      foreignKey: 'player_id',
      as: 'player_match_stats'
    });
    db.PlayerMatch.belongsTo(db.Player, {
      foreignKey: 'player_id'
    });
    db.Match.hasMany(db.PlayerMatch, {
      foreignKey: 'match_id',
      as: 'match_player_stats'
    });
    db.PlayerMatch.belongsTo(db.Match, {
      foreignKey: 'match_id'
    });
  }
};

// Set up associations
setupAssociations();

// Export the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;