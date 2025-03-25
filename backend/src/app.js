// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./models');
const { testConnection } = require('./utils/database');
const scraper = require('./services/vlrScraper.service');
const liquipediaService = require('./services/liquipedia.service');
const dataEnrichmentService = require('./services/dataEnrichment.service');
const dataIntegrationService = require('./services/dataIntegrationService');
const scheduler = require('./services/scheduler.service');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

// Import routes first
console.log('[DEBUG] Registering API routes...');
app.use('/api/players', require('./routes/player.routes'));
app.use('/api/teams', require('./routes/team.routes'));
app.use('/api/tournaments', require('./routes/tournament.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/data-integration', require('./routes/dataIntegrationRoutes'));
app.use('/api/data-import', require('./routes/dataImport.routes'));

// Admin routes (should be protected in production)
app.use('/api/admin', require('./routes/admin.routes'));

// Root routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moneyball API' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Data import test route
app.get('/api/data-import/test', (req, res) => {
  res.json({ message: 'Data import test route working' });
});

// Debug: Print all registered routes
console.log('\nRegistered Routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`404 for URL: ${req.url}`);
  res.status(404).json({ message: `Route ${req.url} not found` });
});

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
const startServer = async () => {
  try {
    // Test database connection first
    await testConnection();
    console.log('Database connection test successful');

    // Sync database models without force to preserve existing data
    await db.sequelize.sync();
    console.log('Database synchronized successfully');

    // Initialize the scheduler
    scheduler.init();
    console.log('Scheduler initialized');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      
      // Wait a short moment to ensure scheduler is ready
      setTimeout(() => {
        // Then try to collect data in the background using the scheduler
        console.log('Starting initial data collection...');
        scheduler.triggerImmediateDataCollection()
          .then(result => {
            console.log('Initial data collection result:', result);
            if (!result.success) {
              console.error('Some steps failed during initial data collection:', result.steps);
            }
          })
          .catch(error => {
            console.error('Error during initial data collection:', error);
            // Don't exit the process, just log the error
          });
      }, 1000); // Wait 1 second before starting data collection
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;