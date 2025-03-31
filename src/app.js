// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./models');
require('./jobs/liquipediaUpdateJob');  // Add this line to start the cron job

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moneyball API' });
});

// Import routes
app.use('/api/players', require('./routes/player.routes'));
app.use('/api/teams', require('./routes/team.routes'));
app.use('/api/tournaments', require('./routes/tournament.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));

// Admin routes (should be protected in production)
app.use('/api/admin', require('./routes/admin.routes'));

// Initialize the scheduler when the application starts
const scheduler = require('./services/scheduler.service');
scheduler.init();


// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ 
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Sync database models
  try {
    await db.sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
});

module.exports = app;