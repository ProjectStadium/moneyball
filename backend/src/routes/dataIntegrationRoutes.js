const express = require('express');
const router = express.Router();
const dataIntegrationController = require('../controllers/dataIntegrationController');

// Get all free agents with enriched data
router.get('/free-agents', dataIntegrationController.getFreeAgents);

// Get enriched data for a specific player
router.get('/players/:playerId/enrich', dataIntegrationController.enrichPlayerData);

module.exports = router; 