// src/routes/analysis.routes.js
const express = require('express');
const router = express.Router();
const analysis = require('../controllers/analysis.controller');

// Player similarity routes
router.get('/players/similar/:player_id', analysis.findSimilarPlayers);

// Market analysis
router.get('/market/free-agents', analysis.getFreeAgentMarketAnalysis);

// Roster generation
router.get('/roster/generate', analysis.generateOptimalRoster);

// Player comparison
router.get('/players/compare', analysis.comparePlayers);

// Player valuation
router.get('/players/valuation/:player_id', analysis.getPlayerValuation);

module.exports = router;