// src/routes/player.routes.js
const express = require('express');
const router = express.Router();
const players = require('../controllers/player.controller');

// Get all players (with optional filtering)
router.get('/', players.findAll);

// Get free agents
router.get('/free-agents', players.getFreeAgents);

// Get top players by specific stat
router.get('/top', players.getTopPlayers);

// Get players by team
router.get('/team/:team_abbreviation', players.getPlayersByTeam);

// Get a single player by id
router.get('/:id', players.findOne);

// Create a new player
router.post('/', players.create);

// Update a player
router.put('/:id', players.update);

// Delete a player
router.delete('/:id', players.delete);

// Get player statistics
router.get('/:id/stats', players.getStats);

// Get top players by specific stat
router.get('/top/:stat', players.getTopPlayers);

module.exports = router;