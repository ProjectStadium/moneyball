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
      limit: parseInt(limit),
      attributes: [
        'id', 'team_abbreviation', 'full_team_name', 'tag', 'region',
        'country', 'country_code', 'rank', 'score', 'record',
        'earnings', 'founded_year', 'game', 'logo_url'
      ]
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Error retrieving top teams:', error);
    res.status(500).send({
      message: error.message || 'An error occurred while retrieving top teams.'
    });
  }
};

// Create a new team
exports.create = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while creating the team.'
    });
  }
};

// Get a single team by id
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByPk(id, {
      include: [{
        model: Player,
        attributes: ['id', 'name', 'rating', 'acs', 'kd_ratio', 'is_free_agent']
      }]
    });
    
    if (!team) {
      return res.status(404).json({
        message: `Team with id ${id} not found.`
      });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error retrieving team:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving the team.'
    });
  }
};

// Update a team
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Team.update(req.body, {
      where: { id }
    });
    
    if (updated) {
      const team = await Team.findByPk(id);
      res.json(team);
    } else {
      res.status(404).json({
        message: `Team with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(400).json({
      message: error.message || 'An error occurred while updating the team.'
    });
  }
};

// Delete a team
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Team.destroy({
      where: { id }
    });
    
    if (deleted) {
      res.json({
        message: `Team with id ${id} was deleted successfully.`
      });
    } else {
      res.status(404).json({
        message: `Team with id ${id} not found.`
      });
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while deleting the team.'
    });
  }
};

// Get team statistics
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByPk(id, {
      include: [{
        model: Player,
        attributes: ['id', 'name', 'rating', 'acs', 'kd_ratio', 'adr', 'kpr', 'apr']
      }]
    });
    
    if (!team) {
      return res.status(404).json({
        message: `Team with id ${id} not found.`
      });
    }
    
    // Calculate team statistics
    const players = team.Players;
    const stats = {
      roster_size: players.length,
      average_rating: players.reduce((acc, p) => acc + (p.rating || 0), 0) / players.length,
      average_acs: players.reduce((acc, p) => acc + (p.acs || 0), 0) / players.length,
      average_kd: players.reduce((acc, p) => acc + (p.kd_ratio || 0), 0) / players.length,
      average_adr: players.reduce((acc, p) => acc + (p.adr || 0), 0) / players.length,
      average_kpr: players.reduce((acc, p) => acc + (p.kpr || 0), 0) / players.length,
      average_apr: players.reduce((acc, p) => acc + (p.apr || 0), 0) / players.length,
      player_roles: players.reduce((acc, p) => {
        const roles = p.playstyle?.role_percentages || {};
        Object.entries(roles).forEach(([role, percentage]) => {
          acc[role] = (acc[role] || 0) + percentage;
        });
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error retrieving team stats:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving team stats.'
    });
  }
};