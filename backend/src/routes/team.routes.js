// src/routes/team.routes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');

// Get all teams with pagination and filtering
router.get('/', teamController.getTeams);

// Search teams (must be before /:id to avoid conflict)
router.get('/search', teamController.searchTeams);

// Get top teams
router.get('/top', teamController.getTopTeams);

// Get teams by region
router.get('/region/:region', teamController.getTeamsByRegion);

// Get a single team by ID
router.get('/:id', teamController.getTeamById);

// Get team roster
router.get('/:id/roster', teamController.getTeamRoster);

// Get team statistics
router.get('/:id/stats', teamController.getStats);

// Create a new team
router.post('/', teamController.create);

// Update a team
router.put('/:id', teamController.update);

// Delete a team
router.delete('/:id', teamController.delete);

module.exports = router;