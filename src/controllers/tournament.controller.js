const db = require('../models');
const Tournament = db.Tournament;
const { Op } = require('sequelize');

// Get all tournaments with optional filtering
exports.findAll = async (req, res) => {
  try {
    const {
      name,
      status,
      region,
      type,
      start_date,
      end_date,
      min_prize_pool,
      max_prize_pool,
      limit = 100,
      offset = 0
    } = req.query;

    // Build filter conditions
    const condition = {};
    
    if (name) condition.name = { [Op.iLike]: `%${name}%` };
    if (status) condition.status = status;
    if (region) condition.region = region;
    if (type) condition.type = type;
    if (start_date) condition.start_date = { [Op.gte]: new Date(start_date) };
    if (end_date) condition.end_date = { [Op.lte]: new Date(end_date) };
    if (min_prize_pool) condition.prize_pool = { ...condition.prize_pool, [Op.gte]: parseFloat(min_prize_pool) };
    if (max_prize_pool) condition.prize_pool = { ...condition.prize_pool, [Op.lte]: parseFloat(max_prize_pool) };

    // Fetch tournaments with pagination
    const tournaments = await Tournament.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_date', 'DESC']]
    });

    res.json({
      total: tournaments.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: tournaments.rows
    });
  } catch (error) {
    console.error('Error retrieving tournaments:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving tournaments.'
    });
  }
};

// Create a new tournament
exports.create = async (req, res) => {
  try {
    const tournament = await Tournament.create(req.body);
    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while creating the tournament.'
    });
  }
};

// Get a single tournament by id
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findByPk(id);
    
    if (!tournament) {
      return res.status(404).json({
        message: `Tournament with id ${id} not found.`
      });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error retrieving tournament:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving the tournament.'
    });
  }
};

// Update a tournament
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Tournament.update(req.body, {
      where: { id }
    });
    
    if (updated) {
      const tournament = await Tournament.findByPk(id);
      res.json(tournament);
    } else {
      res.status(404).json({
        message: `Tournament with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while updating the tournament.'
    });
  }
};

// Delete a tournament
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Tournament.destroy({
      where: { id }
    });
    
    if (deleted) {
      res.json({
        message: `Tournament with id ${id} was deleted successfully.`
      });
    } else {
      res.status(404).json({
        message: `Tournament with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while deleting the tournament.'
    });
  }
};

// Get tournament standings
exports.getStandings = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findByPk(id);
    
    if (!tournament) {
      return res.status(404).json({
        message: `Tournament with id ${id} not found.`
      });
    }
    
    if (!tournament.results) {
      return res.json({
        message: 'Tournament standings not available yet.',
        standings: []
      });
    }
    
    res.json({
      tournament_name: tournament.name,
      status: tournament.status,
      standings: tournament.results
    });
  } catch (error) {
    console.error('Error retrieving tournament standings:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving tournament standings.'
    });
  }
};

// Get tournament statistics
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findByPk(id);
    
    if (!tournament) {
      return res.status(404).json({
        message: `Tournament with id ${id} not found.`
      });
    }
    
    const stats = {
      basic_info: {
        name: tournament.name,
        status: tournament.status,
        region: tournament.region,
        type: tournament.type,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        prize_pool: tournament.prize_pool,
        currency: tournament.currency
      },
      format: tournament.format,
      participants: tournament.participants,
      statistics: tournament.statistics,
      results: tournament.results
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error retrieving tournament stats:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving tournament stats.'
    });
  }
}; 