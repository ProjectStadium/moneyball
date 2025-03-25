// src/routes/team.routes.js
const express = require('express');
const router = express.Router();
const teams = require('../controllers/team.controller');

// Get all teams (with optional filtering)
router.get('/', teams.findAll);

// Get top teams
router.get('/top', teams.getTopTeams);

// Get teams by region
router.get('/region/:region', teams.getTeamsByRegion);

// Get team roster
router.get('/:id/roster', teams.getTeamRoster);

// Get a single team by id or abbreviation
router.get('/:id', teams.findOne);

// Create a new team
router.post('/', teams.create);

// Update a team
router.put('/:id', teams.update);

// Delete a team
router.delete('/:id', teams.delete);

// Get team statistics
router.get('/:id/stats', teams.getStats);

module.exports = router;