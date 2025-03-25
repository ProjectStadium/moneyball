// src/controllers/team.controller.js
const db = require('../models');
const Team = db.Team;
const Player = db.Player;
const { Op } = require('sequelize');
const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Get all teams with optional filtering
exports.getTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { region, game, country } = req.query;

    // Create cache key based on query parameters
    const cacheKey = `teams_${page}_${limit}_${region || 'all'}_${game || 'all'}_${country || 'all'}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build where clause
    const where = {};
    if (region) where.region = region;
    if (game) where.game = game;
    if (country) where.country = country;

    // Get teams with pagination
    const { count, rows } = await Team.findAndCountAll({
      where,
      limit,
      offset,
      order: [['rank', 'ASC']],
      attributes: [
        'id', 'team_abbreviation', 'full_team_name', 'tag', 'region',
        'country', 'country_code', 'rank', 'score', 'record',
        'earnings', 'founded_year', 'game', 'logo_url'
      ]
    });

    const data = {
      teams: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };

    // Cache the result
    cache.set(cacheKey, data);

    res.json(data);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single team by id or abbreviation
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `team_${id}`;

    // Check cache first
    const cachedTeam = cache.get(cacheKey);
    if (cachedTeam) {
      return res.json(cachedTeam);
    }

    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Cache the result
    cache.set(cacheKey, team);

    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const team = await Team.findByPk(id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get team statistics from players
    const players = await Player.findAll({
      where: { team_abbreviation: team.team_abbreviation }
    });

    const stats = {
      total_players: players.length,
      average_rating: players.reduce((acc, p) => acc + (p.rating || 0), 0) / players.length,
      average_acs: players.reduce((acc, p) => acc + (p.acs || 0), 0) / players.length,
      total_earnings: team.earnings || 0,
      win_rate: team.record ? parseFloat(team.record.split('-')[0]) / parseFloat(team.record.split('-')[1]) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting team stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search teams
exports.searchTeams = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const teams = await Team.findAll({
      where: {
        [Op.or]: [
          { full_team_name: { [Op.iLike]: `%${query}%` } },
          { team_abbreviation: { [Op.iLike]: `%${query}%` } },
          { tag: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 10
    });

    res.json(teams);
  } catch (error) {
    console.error('Error searching teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};