// src/routes/player.routes.js
const express = require('express');
const router = express.Router();
const players = require('../controllers/player.controller');

// Get all players (with optional filtering)
router.get('/', players.findAll);

// Get free agents
router.get('/free-agents', players.getFreeAgents);

// Get league leaders by role
router.get('/leaders', players.getLeagueLeaders);

// Get top players by specific stat
router.get('/top', players.getTopPlayers);

// Get top players by specific stat
router.get('/top/:stat', players.getTopPlayers);

// Search for player on Liquipedia and update their data
router.get('/search/liquipedia', players.searchAndUpdateLiquipedia);

// Get players by team
router.get('/team/:team_abbreviation', players.getPlayersByTeam);

// Get player statistics
router.get('/:id/stats', players.getStats);

// Get a single player by id
router.get('/:id', players.findOne);

// Create a new player
router.post('/', players.create);

// Update a player
router.put('/:id', players.update);

// Delete a player
router.delete('/:id', players.delete);

module.exports = router;