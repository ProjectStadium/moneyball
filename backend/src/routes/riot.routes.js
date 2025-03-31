const express = require('express');
const router = express.Router();
const RiotService = require('../services/riot.service');
const riotService = new RiotService();

// Test endpoint to verify Riot API connection
router.get('/test-connection', async (req, res) => {
  try {
    const response = await riotService.makeRequest('/status/v1/platform-data');
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Riot API connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No response data'
    });
  }
});

// Get player account by name and tag
router.get('/account/:name/:tag', async (req, res) => {
  try {
    const { name, tag } = req.params;
    const account = await riotService.getAccountByName(name, tag);
    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player match history
router.get('/matches/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const { size = 10 } = req.query;
    const matches = await riotService.getMatchHistory(puuid, parseInt(size));
    res.json(matches);
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get match details
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await riotService.getMatchDetails(matchId);
    res.json(match);
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player ranked stats
router.get('/ranked/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const stats = await riotService.getRankedStats(puuid);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching ranked stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player MMR history
router.get('/mmr/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const history = await riotService.getMMRHistory(puuid);
    res.json(history);
  } catch (error) {
    console.error('Error fetching MMR history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 