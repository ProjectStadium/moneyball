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

module.exports = router;