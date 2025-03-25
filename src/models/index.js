// src/models/index.js
const { sequelize } = require('../utils/database');
const fs = require('fs');
const path = require('path');

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
};

// Set up associations
setupAssociations();

// Add sequelize instance to db object
db.sequelize = sequelize;

module.exports = db;