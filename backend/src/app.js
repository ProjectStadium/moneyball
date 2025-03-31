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

// Health check route
app.use('/api', require('./routes/health'));

// Debug: Print all routes before registration
const riotRoutes = require('./routes/riot.routes');
console.log('[DEBUG] Riot routes:', Object.keys(riotRoutes.stack || {}).map(key => riotRoutes.stack[key].route?.path).filter(Boolean));

app.use('/api/players', require('./routes/player.routes'));
app.use('/api/teams', require('./routes/team.routes'));
app.use('/api/tournaments', require('./routes/tournament.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/data-integration', require('./routes/dataIntegrationRoutes'));
app.use('/api/data-import', require('./routes/dataImport.routes'));
app.use('/api/riot', riotRoutes);
app.use('/api/liquipedia', require('./routes/liquipedia.routes'));
app.use('/api/role-performance', require('./routes/rolePerformance.routes'));
app.use('/api/data-collection', require('./routes/dataCollection.routes'));

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
function printRoutes(stack, prefix = '') {
  stack.forEach(function(r) {
    if (r.route) {
      // Direct route
      console.log(`${Object.keys(r.route.methods)} ${prefix}${r.route.path}`);
    } else if (r.name === 'router') {
      // Router middleware
      const path = r.regexp.toString().replace(/\\\//g, '/').replace(/[^/]/g, '');
      printRoutes(r.handle.stack, prefix + path);
    }
  });
}
printRoutes(app._router.stack);

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
    console.log('[INFO] Database connection successful');

    // Start the server
    app.listen(PORT, () => {
      console.log(`[INFO] Server is running on port ${PORT}`);
      console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start the scheduler
    scheduler.start();
    console.log('[INFO] Scheduler started');

  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;