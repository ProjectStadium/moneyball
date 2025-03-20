// src/models/index.js
const sequelize = require('../utils/database');
const fs = require('fs');
const path = require('path');

const db = {};

// Read all model files and initialize them
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    // Initialize each model with the sequelize instance
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// Set up associations between models if needed
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define associations between Team and Player
db.Team.hasMany(db.Player, {
  foreignKey: 'team_abbreviation',
  sourceKey: 'team_abbreviation'
});
db.Player.belongsTo(db.Team, {
  foreignKey: 'team_abbreviation',
  targetKey: 'team_abbreviation'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;