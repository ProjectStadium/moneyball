const express = require('express');
const router = express.Router();
const tournaments = require('../controllers/tournament.controller');

// Get all tournaments (with optional filtering)
router.get('/', tournaments.findAll);

// Create a new tournament
router.post('/', tournaments.create);

// Get a single tournament by id
router.get('/:id', tournaments.findOne);

// Update a tournament
router.put('/:id', tournaments.update);

// Delete a tournament
router.delete('/:id', tournaments.delete);

// Get tournament standings
router.get('/:id/standings', tournaments.getStandings);

// Get tournament statistics
router.get('/:id/stats', tournaments.getStats);

module.exports = router; 