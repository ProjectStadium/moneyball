// src/routes/team.routes.js
import express from 'express';
import {
  findAll,
  getTopTeams,
  getTeamsByRegion,
  getTeamRoster,
  findOne,
} from '../controllers/team.controller.js';

const router = express.Router();

// Get all teams (with optional filtering)
router.get('/', findAll);

// Get top teams
router.get('/top', getTopTeams);

// Get teams by region
router.get('/region/:region', getTeamsByRegion);

// Get team roster
router.get('/:id/roster', getTeamRoster);

// Get a single team by id or abbreviation
router.get('/:id', findOne);

export default router;