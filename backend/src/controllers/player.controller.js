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
      offset = 0,
      order = [['rating', 'DESC']] // Default sorting
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

    // Parse order parameter if it's a string
    let orderArray = order;
    if (typeof order === 'string') {
      try {
        orderArray = JSON.parse(order);
      } catch (e) {
        console.warn('Invalid order parameter:', order);
        orderArray = [['rating', 'DESC']];
      }
    }

    console.log('Query conditions:', condition);
    console.log('Order:', orderArray);

    // Fetch players with pagination
    const players = await Player.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderArray
    });

    console.log(`Found ${players.count} players`);

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
      is_free_agent,
      region,
      country_code,
      division
    } = req.query;
    
    console.log('Received query parameters:', { stat, limit, is_free_agent, region, country_code, division });
    
    // Define region-country mappings
    const regionCountries = {
      NA: ['US', 'CA', 'MX'],
      EU: ['GB', 'DE', 'FR', 'ES', 'IT', 'SE', 'DK', 'NO', 'FI', 'PL', 'NL', 'BE', 'CH', 'AT', 'PT', 'IE', 'GR', 'HU', 'CZ', 'SK', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'LU', 'MT'],
      APAC: ['KR', 'JP', 'CN', 'TW', 'HK', 'SG', 'AU', 'NZ', 'ID', 'MY', 'PH', 'TH', 'VN', 'IN', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA'],
      BR: ['BR'],
      LATAM: ['AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'CR', 'PA', 'DO', 'GT', 'SV', 'HN', 'NI', 'PR'],
      MENA: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'IL', 'TR', 'IR', 'IQ', 'SY', 'JO', 'LB', 'PS', 'YE'],
      SA: ['ZA', 'NG', 'EG', 'MA', 'TN', 'DZ', 'KE', 'GH', 'CI', 'SN', 'CM', 'UG', 'RW', 'ET', 'ZA']
    };
    
    // Validate the stat parameter
    const allowedStats = ['rating', 'acs', 'kd_ratio', 'adr', 'kpr', 'apr', 'fk_pr', 'hs_pct'];
    if (!allowedStats.includes(stat)) {
      return res.status(400).json({
        message: `Invalid stat parameter. Allowed values: ${allowedStats.join(', ')}`
      });
    }
    
    // Build filter conditions
    const condition = {};
    
    // Always include is_free_agent filter if specified
    if (is_free_agent !== undefined) {
      // Convert string 'true'/'false' to boolean
      condition.is_free_agent = is_free_agent === 'true' || is_free_agent === true;
      console.log('Added free agent filter:', condition.is_free_agent);
    }
    
    // Handle region/country filtering
    if (country_code && country_code !== 'all') {
      condition.country_code = country_code;
      console.log('Added country code filter:', country_code);
    } else if (region && region !== 'all') {
      // If region is specified, filter by country codes in that region
      const countryCodes = regionCountries[region] || [];
      if (countryCodes.length > 0) {
        condition.country_code = { [Op.in]: countryCodes };
        console.log('Added region filter:', region, 'with country codes:', countryCodes);
      } else {
        console.log('No country codes found for region:', region);
      }
    }
    
    // Add division filter if specified
    if (division && division !== 'all') {
      condition.division = division;
      console.log('Added division filter:', division);
    }
    
    // Ensure the stat is not null
    condition[stat] = { [Op.not]: null };
    
    console.log('Final filter conditions:', JSON.stringify(condition, null, 2));
    
    // Execute the query
    const players = await Player.findAll({
      where: condition,
      order: [[stat, 'DESC']],
      limit: parseInt(limit)
    });
    
    // Log the results
    console.log(`Found ${players.length} players matching the criteria`);
    if (players.length > 0) {
      console.log('First player data:', JSON.stringify(players[0].toJSON(), null, 2));
      console.log('First player region:', players[0].country_code);
    }
    
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
      offset = 0,
      order = [['rating', 'DESC']]
    } = req.query;

    // Build filter conditions
    const condition = {
      is_free_agent: true
    };

    if (min_rating) {
      condition.rating = { [Op.gte]: parseFloat(min_rating) };
    }

    // Parse order parameter if it's a string
    let orderArray = order;
    if (typeof order === 'string') {
      try {
        orderArray = JSON.parse(order);
      } catch (e) {
        console.warn('Invalid order parameter:', order);
        orderArray = [['rating', 'DESC']];
      }
    }

    // Fetch free agents with pagination
    const players = await Player.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderArray
    });

    console.log(`Found ${players.count} free agents`);

    res.json({
      total: players.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: players.rows
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