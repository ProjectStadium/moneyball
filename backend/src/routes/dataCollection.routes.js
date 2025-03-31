const express = require('express');
const router = express.Router();
const dataCollectionService = require('../services/dataCollection.service');

// Start data collection
router.post('/start', async (req, res) => {
  try {
    await dataCollectionService.startCollection();
    res.json({ message: 'Data collection started' });
  } catch (error) {
    console.error('Error starting data collection:', error);
    res.status(500).json({ error: 'Failed to start data collection' });
  }
});

// Get collection status
router.get('/status', async (req, res) => {
  try {
    const status = await dataCollectionService.getCollectionStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting collection status:', error);
    res.status(500).json({ error: 'Failed to get collection status' });
  }
});

module.exports = router; 