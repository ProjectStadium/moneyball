const express = require('express');
const router = express.Router();
const dataIntegrationController = require('../controllers/dataIntegrationController');
const LiquipediaService = require('../services/liquipedia.service');
const liquipediaService = new LiquipediaService();

// Get all free agents with enriched data
router.get('/free-agents', dataIntegrationController.getFreeAgents);

// Get enriched data for a specific player
router.get('/players/:playerId/enrich', dataIntegrationController.enrichPlayerData);

// Test Liquipedia API endpoints
router.get('/test/liquipedia/search/:playerName', async (req, res) => {
  try {
    const results = await liquipediaService.searchPlayer(req.params.playerName);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/liquipedia/tournaments', async (req, res) => {
  try {
    const tournaments = await liquipediaService.getTournamentList({
      limit: 10,
      offset: 0
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/liquipedia/player/:title', async (req, res) => {
  try {
    const playerData = await liquipediaService.getPlayerPage(req.params.title);
    res.json(playerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoints for player data
router.get('/players/:playerName/matches', async (req, res) => {
  try {
    const matches = await liquipediaService.getPlayerMatches(req.params.playerName);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/players/:playerName/teams', async (req, res) => {
  try {
    const teams = await liquipediaService.getPlayerTeams(req.params.playerName);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/liquipedia/tournament/stats', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Tournament title is required' });
    }
    const stats = await liquipediaService.getTournamentStats(title);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching tournament statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 