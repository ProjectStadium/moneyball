import express from 'express';
import {
  findAll,
  getFreeAgents,
  getTopPlayers,
  getPlayersByTeam,
  findOne,
} from '../controllers/player.controller.js';

const router = express.Router();

// Get all players (with optional filtering)
router.get('/', findAll);

// Get free agents
router.get('/free-agents', getFreeAgents);

// Get top players by specific stat
router.get('/top', getTopPlayers);

// Get players by team
router.get('/team/:team_abbreviation', getPlayersByTeam);

// Get a single player by id
router.get('/:id', findOne);

export default router;