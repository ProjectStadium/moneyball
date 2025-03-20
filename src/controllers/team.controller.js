// src/controllers/team.controller.js
const db = require('../models');
const Team = db.Team;
const Player = db.Player;
const { Op } = require('sequelize');

// Get all teams with optional filtering
exports.findAll = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      name, 
      region, 
      country_code,
      min_rank,
      max_rank,
      limit = 100,
      offset = 0
    } = req.query;
    
    // Build filter conditions
    const condition = {};
    
    if (name) {
      condition[Op.or] = [
        { team_abbreviation: { [Op.iLike]: `%${name}%` } },
        { full_team_name: { [Op.iLike]: `%${name}%` } },
        { tag: { [Op.iLike]: `%${name}%` } }
      ];
    }
    if (region) condition.region = region;
    if (country_code) condition.country_code = country_code;
    if (min_rank) condition.rank = { ...condition.rank, [Op.gte]: parseInt(min_rank) };
    if (max_rank) condition.rank = { ...condition.rank, [Op.lte]: parseInt(max_rank) };

    // Fetch teams with pagination
    const teams = await Team.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rank', 'ASC']]
    });

    res.json({
      total: teams.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: teams.rows
    });
  } catch (error) {
    console.error('Error retrieving teams:', error);
    res.status(500).send({
      message: error.message || 'An error occurred while retrieving teams.'
    });
  }
};

// Get a single team by id or abbreviation
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by UUID first
    let team = null;
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      team = await Team.findByPk(id);
    } else {
      // Otherwise, treat as team abbreviation
      team = await Team.findOne({
        where: { team_abbreviation: id }
      });
    }
    
    if (!team) {
      return res.status(404).send({
        message: `Team with id/abbreviation ${id} not found.`
      });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error retrieving team:', error);
    res.status(500).send({
      message: `Error retrieving team with id/abbreviation ${req.params.id}`
    });
  }
};

// Get team roster
exports.getTeamRoster = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Determine if id is a UUID or team abbreviation
    let team_abbreviation;
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const team = await Team.findByPk(id);
      if (!team) {
        return res.status(404).send({
          message: `Team with id ${id} not found.`
        });
      }
      team_abbreviation = team.team_abbreviation;
    } else {
      team_abbreviation = id;
    }
    
    // Get all players for the team
    const players = await Player.findAll({
      where: { team_abbreviation },
      order: [['rating', 'DESC']]
    });
    
    res.json(players);
  } catch (error) {
    console.error('Error retrieving team roster:', error);
    res.status(500).send({
      message: error.message || 'An error occurred while retrieving team roster.'
    });
  }
};

// Get teams by region
exports.getTeamsByRegion = async (req, res) => {
  try {
    const { region } = req.params;
    
    const teams = await Team.findAll({
      where: { region },
      order: [['rank', 'ASC']]
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Error retrieving teams by region:', error);
    res.status(500).send({
      message: error.message || 'An error occurred while retrieving teams by region.'
    });
  }
};

// Get top teams
exports.getTopTeams = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const teams = await Team.findAll({
      order: [['rank', 'ASC']],
      limit: parseInt(limit)
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Error retrieving top teams:', error);
    res.status(500).send({
      message: error.message || 'An error occurred while retrieving top teams.'
    });
  }
};