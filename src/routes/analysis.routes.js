import express from 'express';
import {
  findSimilarPlayers,
  getFreeAgentMarketAnalysis,
  generateOptimalRoster,
  comparePlayers,
  getPlayerValuation,
} from '../controllers/analysis.controller.js';

const router = express.Router();

// Player similarity routes
router.get('/players/similar/:player_id', findSimilarPlayers);

// Market analysis
router.get('/market/free-agents', getFreeAgentMarketAnalysis);

// Roster generation
router.get('/roster/generate', generateOptimalRoster);

// Player comparison
router.get('/players/compare', comparePlayers);

// Player valuation
router.get('/players/valuation/:player_id', getPlayerValuation);

export default router;