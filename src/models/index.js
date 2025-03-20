// src/models/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeModels = async (sequelize, Sequelize) => {
  const db = {};

  // Read all model files and initialize them
  const modelFiles = fs
    .readdirSync(__dirname)
    .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-9) === '.model.js');

  for (const file of modelFiles) {
    const model = (await import(path.join(__dirname, file))).default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }

  // Set up associations between models if needed
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

// Export `db` as a named export
export let db = null;

// Function to initialize and set `db`
export const initializeDb = async (sequelize, Sequelize) => {
  db = await initializeModels(sequelize, Sequelize);
};