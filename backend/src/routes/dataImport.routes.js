const express = require('express');
const router = express.Router();
const dataIntegrationService = require('../services/dataIntegrationService');

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route working' });
});

// Raw data route
router.get('/raw-data', (req, res) => {
  console.log('Raw data route hit');
  res.json({ message: 'Raw data route working' });
});

// Import tournament data from Liquipedia
router.post('/liquipedia/tournaments', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await dataIntegrationService.importTournamentData(parseInt(limit));
        res.json(result);
    } catch (error) {
        console.error('Error importing tournament data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Import specific player data from Liquipedia
router.post('/liquipedia/players/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const searchResults = await dataIntegrationService.searchAndImportPlayer(name);
        res.json(searchResults);
    } catch (error) {
        console.error('Error importing player data:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 