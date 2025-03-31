const express = require('express');
const router = express.Router();
const LiquipediaService = require('../services/liquipedia.service');
const liquipediaService = new LiquipediaService();

// Test endpoint to verify Liquipedia API connection
router.get('/test-connection', async (req, res) => {
  try {
    const tournaments = await liquipediaService.getTournamentList({ limit: 1 });
    res.json({ success: true, data: tournaments });
  } catch (error) {
    console.error('Liquipedia API connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No response data'
    });
  }
});

// Get tournament list
router.get('/tournaments', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const tournaments = await liquipediaService.getTournamentList({ 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournament list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search for a player
router.get('/players/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const results = await liquipediaService.searchPlayer(name);
    res.json(results);
  } catch (error) {
    console.error('Error searching for player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player details
router.get('/players/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const playerData = await liquipediaService.getPlayerPage(title);
    res.json(playerData);
  } catch (error) {
    console.error('Error fetching player details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player match history
router.get('/players/:title/matches', async (req, res) => {
  try {
    const { title } = req.params;
    const matches = await liquipediaService.getPlayerMatches(title);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching player matches:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 