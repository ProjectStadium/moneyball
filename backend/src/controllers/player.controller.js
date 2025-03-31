// src/controllers/player.controller.js
const db = require('../models');
const Player = db.Player;
const PlayerMatch = db.PlayerMatch;
const Match = db.Match;
const Tournament = db.Tournament;
const { Op } = require('sequelize');
const RolePerformanceService = require('../services/rolePerformance.service');
const LiquipediaService = require('../services/liquipedia.service');
const DataEnrichmentService = require('../services/dataEnrichment.service');

// Initialize services
const rolePerformanceService = new RolePerformanceService();
const liquipediaService = new LiquipediaService();
const dataEnrichmentService = new DataEnrichmentService();

// Get all players with optional filtering
exports.findAll = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      name, 
      team_abbreviation, 
      country_code,
      country_codes,
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
    if (country_codes) {
      // Handle both single country code and array of country codes
      const codes = Array.isArray(country_codes) ? country_codes : [country_codes];
      condition.country_code = { [Op.in]: codes };
    }
    if (is_free_agent !== undefined) condition.is_free_agent = is_free_agent === 'true';
    if (min_rating) condition.rating = { ...condition.rating, [Op.gte]: parseFloat(min_rating) };
    if (max_rating) condition.rating = { ...condition.rating, [Op.lte]: parseFloat(max_rating) };
    if (min_acs) condition.acs = { ...condition.acs, [Op.gte]: parseFloat(min_acs) };
    if (max_acs) condition.acs = { ...condition.acs, [Op.lte]: parseFloat(max_acs) };

    // Fetch players with pagination and related data
    const players = await Player.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: order,
      include: [
        {
          model: PlayerMatch,
          as: 'player_matches',
          attributes: [
            'id', 'player_id', 'match_id', 'kills', 'deaths', 'assists', 'score',
            'first_bloods', 'first_deaths', 'first_touches', 'plants', 'defuses',
            'smokes', 'flashes', 'recon', 'traps', 'post_plant_kills',
            'match_date', 'map_name', 'agent', 'role'
          ],
          include: [
            {
              model: Match,
              include: [
                {
                  model: Tournament,
                  attributes: ['name', 'tier', 'start_date']
                }
              ]
            }
          ]
        }
      ]
    });

    // Calculate RPS and SDIFF for each player
    const enrichedPlayers = await Promise.all(players.rows.map(async (player) => {
      try {
        // Get player's agent usage and determine role
        const agentUsage = player.agent_usage || {};
        
        console.log(`\n========== Player ${player.name} (${player.id}) ==========`);
        console.log('Raw Agent Usage:', JSON.stringify(agentUsage, null, 2));
        console.log('Agent Usage Type:', typeof agentUsage);
        
        // Convert agent usage to the expected format
        const formattedAgentUsage = {};
        
        // Handle case where agent_usage is a JSON string
        let parsedAgentUsage = agentUsage;
        if (typeof agentUsage === 'string') {
          try {
            parsedAgentUsage = JSON.parse(agentUsage);
            console.log('Parsed JSON string agent usage:', parsedAgentUsage);
          } catch (error) {
            console.error('Error parsing agent usage JSON:', error);
            parsedAgentUsage = {};
          }
        }

        if (Array.isArray(parsedAgentUsage)) {
          console.log('Processing array format agent usage');
          parsedAgentUsage.forEach(agent => {
            if (agent && typeof agent === 'string') {
              formattedAgentUsage[agent.toLowerCase()] = {
                playCount: 1
              };
              console.log(`Added agent ${agent} with count 1`);
            } else {
              console.log(`Skipped invalid agent:`, agent);
            }
          });
        } else if (typeof parsedAgentUsage === 'object') {
          console.log('Processing object format agent usage');
          Object.entries(parsedAgentUsage).forEach(([agent, data]) => {
            if (agent && typeof agent === 'string') {
              const count = typeof data === 'number' ? data : 
                          typeof data === 'object' && data.playCount ? data.playCount :
                          typeof data === 'object' && data.percentage ? data.percentage : 1;
              formattedAgentUsage[agent.toLowerCase()] = {
                playCount: count
              };
              console.log(`Added agent ${agent} with count ${count}`);
            } else {
              console.log(`Skipped invalid agent:`, agent);
            }
          });
        } else {
          console.log('Invalid agent usage format:', typeof parsedAgentUsage);
        }
        
        console.log('Formatted Agent Usage:', JSON.stringify(formattedAgentUsage, null, 2));
        
        // Calculate playstyle based on agent usage
        const playstyle = dataEnrichmentService.determinePlaystylesFromAgents(
          formattedAgentUsage,
          player.source || 'vlr',  // Use player's source or default to 'vlr'
          player.name  // Pass player name for better logging
        );
        
        // Calculate RPS and SDIFF with the determined role
        const rps = await rolePerformanceService.calculateRPS({
          id: player.id,
          name: player.name,
          role: playstyle.primary_roles[0] || 'Unknown',
          puuid: player.puuid,
          // Add raw KDA for RPS calculation
          kills_per_map: player.kills_per_map || 0,
          deaths_per_map: player.deaths_per_map || 0,
          assists_per_map: player.assists_per_map || 0
        });
        const sdiff = await rolePerformanceService.calculateSDIFF(player.id);
        
        // Format player data according to frontend expectations
        return {
          id: player.id,
          name: player.name,
          team: player.team_abbreviation,
          region: player.country_code,
          role: playstyle.primary_roles[0] || 'Unknown',
          experience: {
            yearsActive: player.years_active || 0,
            isRookie: player.is_rookie || false,
            totalEarnings: player.total_earnings || 0
          },
          stats: {
            kda: player.kda || 0,  // Use KDA from VLR
            acs: player.acs || 0,
            kd: player.kd_ratio || 0,
            dpr: player.deaths_per_map || 0,
            rps: rps?.score || 0,
            sdiff: sdiff || 0,
            impact: player.rating || 0
          },
          recentPerformance: {
            lastNMatches: player.player_matches?.length || 0,
            averageStats: {
              kda: player.kda || 0,  // Use KDA from VLR
              acs: player.acs || 0,
              kd: player.kd_ratio || 0,
              dpr: player.deaths_per_map || 0,
              rps: rps?.score || 0,
              sdiff: sdiff || 0,
              impact: player.rating || 0
            },
            trend: 'stable' // TODO: Calculate actual trend
          },
          liquipediaUrl: player.liquipedia_url,
          imageUrl: player.image_url
        };
      } catch (error) {
        console.error(`Error enriching player ${player.name}:`, error);
        return {
          id: player.id,
          name: player.name,
          team: player.team_abbreviation,
          region: player.country_code,
          role: 'Unknown',
          experience: {
            yearsActive: player.years_active || 0,
            isRookie: player.is_rookie || false,
            totalEarnings: player.total_earnings || 0
          },
          stats: {
            kda: 0,
            acs: 0,
            kd: 0,
            dpr: 0,
            rps: 0,
            sdiff: 0,
            impact: 0
          },
          recentPerformance: {
            lastNMatches: 0,
            averageStats: {
              kda: 0,
              acs: 0,
              kd: 0,
              dpr: 0,
              rps: 0,
              sdiff: 0,
              impact: 0
            },
            trend: 'stable'
          }
        };
      }
    }));

    // Return the response immediately
    res.json({
      data: enrichedPlayers,
      total: players.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error in findAll:', error);
    res.status(500).json({ 
      message: 'Error fetching players',
      error: error.message
    });
  }
};

// Get a single player by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch player with related data
    const player = await Player.findByPk(id, {
      include: [
        {
          model: PlayerMatch,
          as: 'player_matches',
          include: [
            {
              model: Match,
              include: [
                {
                  model: Tournament,
                  attributes: ['name', 'tier', 'start_date']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!player) {
      return res.status(404).json({
        message: `Player with id ${id} not found.`
      });
    }

    // Calculate role performance
    const rolePerformance = await rolePerformanceService.calculateRPS(player);
    
    // Get Liquipedia data if available
    let liquipediaData = null;
    if (player.liquipedia_url) {
      try {
        liquipediaData = await liquipediaService.getPlayerPage(player.name);
        if (liquipediaData) {
          // Update player's Liquipedia stats
          player.liquipedia_stats = {
            ...liquipediaData,
            last_updated: new Date()
          };
          await player.save();
        }
      } catch (error) {
        console.error(`Error fetching Liquipedia data for player ${player.name}:`, error);
      }
    }

    res.json({
      ...player.toJSON(),
      role_performance: rolePerformance || {
        rps: 50,
        sdiff: 0,
        confidence: { level: 'low', score: 0.4, issues: 1 }
      },
      liquipedia_data: liquipediaData
    });
  } catch (error) {
    console.error('Error retrieving player:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while retrieving the player.'
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

// Search for player on Liquipedia and update their data
exports.searchAndUpdateLiquipedia = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Search for player on Liquipedia
    const searchResults = await liquipediaService.searchPlayer(name);
    
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ error: 'Player not found on Liquipedia' });
    }

    // Get the first result
    const liquipediaPlayer = searchResults[0];
    
    // Get or create player in our database
    let player = await Player.findOne({ where: { name } });
    if (!player) {
      player = await Player.create({ name });
    }

    // Update player's Liquipedia URL
    player.liquipedia_url = liquipediaPlayer.url;
    await player.save();

    // Get detailed player data from Liquipedia
    const liquipediaData = await liquipediaService.getPlayerPage(liquipediaPlayer.title);
    
    if (liquipediaData) {
      // Update player's Liquipedia stats
      player.liquipedia_stats = {
        ...liquipediaData,
        last_updated: new Date()
      };
      await player.save();
    }

    return res.json({
      player,
      liquipedia_data: liquipediaData
    });
  } catch (error) {
    console.error('Error searching and updating Liquipedia data:', error);
    return res.status(500).json({ error: 'Failed to search and update Liquipedia data' });
  }
};

// Get league leaders by role
exports.getLeagueLeaders = async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ message: 'Role parameter is required' });
    }

    // Get players with their recent matches and role performance
    const players = await Player.findAll({
      include: [
        {
          model: PlayerMatch,
          as: 'player_matches',
          include: [
            {
              model: Match,
              include: [
                {
                  model: Tournament,
                  attributes: ['name', 'tier', 'start_date']
                }
              ]
            }
          ]
        }
      ]
    });

    // Calculate role performance for each player
    const playersWithPerformance = await Promise.all(
      players.map(async (player) => {
        const rolePerformance = await rolePerformanceService.calculateRPS(player);
        return {
          ...player.toJSON(),
          rolePerformance
        };
      })
    );

    // Filter players by role and sort by performance
    const leaders = playersWithPerformance
      .filter(player => {
        const recentMatch = player.player_matches?.[0];
        return recentMatch?.role === role;
      })
      .sort((a, b) => b.rolePerformance - a.rolePerformance)
      .slice(0, 10); // Get top 10 players

    res.json(leaders);
  } catch (error) {
    console.error('Error getting league leaders:', error);
    res.status(500).json({ message: 'Error getting league leaders', error: error.message });
  }
};