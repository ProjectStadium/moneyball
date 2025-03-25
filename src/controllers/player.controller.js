// src/controllers/player.controller.js
const db = require('../models');
const Player = db.Player;
const { Op } = require('sequelize');

// Get all players with optional filtering
exports.findAll = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      name, 
      team_abbreviation, 
      country_code, 
      is_free_agent,
      min_rating,
      max_rating,
      min_acs,
      max_acs,
      limit = 100,
      offset = 0
    } = req.query;
    
    // Build filter conditions
    const condition = {};
    
    if (name) condition.name = { [Op.iLike]: `%${name}%` };
    if (team_abbreviation) condition.team_abbreviation = team_abbreviation;
    if (country_code) condition.country_code = country_code;
    if (is_free_agent !== undefined) condition.is_free_agent = is_free_agent === 'true';
    if (min_rating) condition.rating = { ...condition.rating, [Op.gte]: parseFloat(min_rating) };
    if (max_rating) condition.rating = { ...condition.rating, [Op.lte]: parseFloat(max_rating) };
    if (min_acs) condition.acs = { ...condition.acs, [Op.gte]: parseFloat(min_acs) };
    if (max_acs) condition.acs = { ...condition.acs, [Op.lte]: parseFloat(max_acs) };

    // Fetch players with pagination
    const players = await Player.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC']]
    });

    res.json({
      total: players.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: players.rows
    });
  } catch (error) {
    console.error('Error retrieving players:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving players.'
    });
  }
};

// Get a single player by id
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const player = await Player.findByPk(id);
    
    if (!player) {
      return res.status(404).json({
        message: `Player with id ${id} not found.`
      });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error retrieving player:', error);
    res.status(500).json({
      message: `Error retrieving player with id ${req.params.id}`
    });
  }
};

// Get top players by specific stat
exports.getTopPlayers = async (req, res) => {
  try {
    const { 
      stat = 'rating', 
      limit = 10,
      is_free_agent
    } = req.query;
    
    // Validate the stat parameter
    const allowedStats = ['rating', 'acs', 'kd_ratio', 'adr', 'kpr', 'apr', 'fk_pr', 'hs_pct'];
    if (!allowedStats.includes(stat)) {
      return res.status(400).json({
        message: `Invalid stat parameter. Allowed values: ${allowedStats.join(', ')}`
      });
    }
    
    // Build filter conditions
    const condition = {};
    if (is_free_agent !== undefined) {
      condition.is_free_agent = is_free_agent === 'true';
    }
    
    // Fetch top players for the specified stat
    const players = await Player.findAll({
      where: {
        ...condition,
        [stat]: { [Op.not]: null } // Ensure the stat is not null
      },
      order: [[stat, 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json(players);
  } catch (error) {
    console.error('Error retrieving top players:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving top players.'
    });
  }
};

// Get players by team
exports.getPlayersByTeam = async (req, res) => {
  try {
    const { team_abbreviation } = req.params;
    
    const players = await Player.findAll({
      where: { team_abbreviation },
      order: [['rating', 'DESC']]
    });
    
    res.json(players);
  } catch (error) {
    console.error('Error retrieving team players:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving team players.'
    });
  }
};

// Get free agents
exports.getFreeAgents = async (req, res) => {
  try {
    const { 
      min_rating = 0,
      limit = 100,
      offset = 0
    } = req.query;
    
    const freeAgents = await Player.findAndCountAll({
      where: { 
        is_free_agent: true,
        rating: { [Op.gte]: parseFloat(min_rating) }
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC']]
    });
    
    res.json({
      total: freeAgents.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: freeAgents.rows
    });
  } catch (error) {
    console.error('Error retrieving free agents:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving free agents.'
    });
  }
};

// Create a new player
exports.create = async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while creating the player.'
    });
  }
};

// Update a player
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Player.update(req.body, {
      where: { id }
    });
    
    if (updated) {
      const player = await Player.findByPk(id);
      res.json(player);
    } else {
      res.status(404).json({
        message: `Player with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while updating the player.'
    });
  }
};

// Delete a player
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Player.destroy({
      where: { id }
    });
    
    if (deleted) {
      res.json({
        message: `Player with id ${id} was deleted successfully.`
      });
    } else {
      res.status(404).json({
        message: `Player with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while deleting the player.'
    });
  }
};

// Get player statistics
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.findByPk(id);
    
    if (!player) {
      return res.status(404).json({
        message: `Player with id ${id} not found.`
      });
    }
    
    const stats = {
      performance: {
        acs: player.acs,
        kd_ratio: player.kd_ratio,
        adr: player.adr,
        kpr: player.kpr,
        apr: player.apr,
        fk_pr: player.fk_pr,
        fd_pr: player.fd_pr,
        hs_pct: player.hs_pct,
        rating: player.rating
      },
      agent_usage: player.agent_usage,
      playstyle: player.playstyle,
      earnings: {
        total: player.total_earnings,
        by_year: player.earnings_by_year,
        tournament_earnings: player.tournament_earnings,
        last_updated: player.earnings_last_updated
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error retrieving player stats:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving player stats.'
    });
  }
};