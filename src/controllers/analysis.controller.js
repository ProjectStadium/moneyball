import { Op } from 'sequelize';
import { db } from '../models/index.js';

const Player = db.Player;
const Team = db.Team;

// Find players similar to a specified player based on stats and playstyle
export const findSimilarPlayers = async (req, res) => {
  try {
    const { player_id } = req.params;
    const { limit = 5, free_agents_only = false } = req.query;

    const targetPlayer = await Player.findByPk(player_id);

    if (!targetPlayer) {
      return res.status(404).json({ message: `Player with id ${player_id} not found.` });
    }

    const whereClause = { id: { [Op.ne]: player_id } };
    if (free_agents_only === 'true') whereClause.is_free_agent = true;

    const allPlayers = await Player.findAll({ where: whereClause });

    const playersWithSimilarity = allPlayers.map((player) => {
      const acsSimilarity = calculateStatSimilarity(player.acs, targetPlayer.acs);
      const kdrSimilarity = calculateStatSimilarity(player.kd_ratio, targetPlayer.kd_ratio);
      const adrSimilarity = calculateStatSimilarity(player.adr, targetPlayer.adr);
      const hsPercentSimilarity = calculateStatSimilarity(player.hs_pct, targetPlayer.hs_pct);
      const playstyleSimilarity = calculatePlaystyleSimilarity(player.playstyle, targetPlayer.playstyle);

      const similarityScore =
        acsSimilarity * 0.25 +
        kdrSimilarity * 0.25 +
        adrSimilarity * 0.2 +
        hsPercentSimilarity * 0.1 +
        playstyleSimilarity * 0.2;

      return {
        id: player.id,
        name: player.name,
        team_abbreviation: player.team_abbreviation,
        is_free_agent: player.is_free_agent,
        country_code: player.country_code,
        rating: player.rating,
        estimated_value: player.estimated_value,
        division: player.division,
        playstyle: player.playstyle,
        stats: {
          acs: player.acs,
          kd_ratio: player.kd_ratio,
          adr: player.adr,
          hs_pct: player.hs_pct,
        },
        similarity: {
          overall: parseFloat((similarityScore * 100).toFixed(1)),
          stats: {
            acs: parseFloat((acsSimilarity * 100).toFixed(1)),
            kd_ratio: parseFloat((kdrSimilarity * 100).toFixed(1)),
            adr: parseFloat((adrSimilarity * 100).toFixed(1)),
            hs_pct: parseFloat((hsPercentSimilarity * 100).toFixed(1)),
          },
          playstyle: parseFloat((playstyleSimilarity * 100).toFixed(1)),
        },
      };
    });

    const sortedPlayers = playersWithSimilarity
      .sort((a, b) => b.similarity.overall - a.similarity.overall)
      .slice(0, parseInt(limit));

    res.json({
      target_player: {
        id: targetPlayer.id,
        name: targetPlayer.name,
        team_abbreviation: targetPlayer.team_abbreviation,
        is_free_agent: targetPlayer.is_free_agent,
        stats: {
          acs: targetPlayer.acs,
          kd_ratio: targetPlayer.kd_ratio,
          adr: targetPlayer.adr,
          hs_pct: targetPlayer.hs_pct,
        },
        playstyle: targetPlayer.playstyle,
      },
      similar_players: sortedPlayers,
    });
  } catch (error) {
    console.error('Error finding similar players:', error);
    res.status(500).json({ message: error.message || 'An error occurred while finding similar players.' });
  }
};

// Other functions (getFreeAgentMarketAnalysis, generateOptimalRoster, etc.) remain unchanged
// Export them individually as ES Modules
export const getFreeAgentMarketAnalysis = async (req, res) => {
  try {
    const { role, region, division, min_rating } = req.query;
    
    // Build filter conditions
    const whereClause = { is_free_agent: true };
    
    if (region) whereClause.country_code = region;
    if (division) whereClause.division = division;
    if (min_rating) whereClause.rating = { [Op.gte]: parseFloat(min_rating) };
    
    // Get all free agents matching the criteria
    const freeAgents = await Player.findAll({
      where: whereClause,
      order: [['rating', 'DESC']]
    });
    
    // Filter by role if specified
    let filteredByRole = freeAgents;
    if (role) {
      filteredByRole = freeAgents.filter(player => 
        player.playstyle && 
        player.playstyle.role_percentages && 
        player.playstyle.role_percentages[role] >= 30
      );
    }
    
    // Calculate market statistics
    const valuableAgents = filteredByRole.filter(p => p.estimated_value > 0);
    const averageValue = valuableAgents.length ? 
      Math.round(valuableAgents.reduce((sum, p) => sum + p.estimated_value, 0) / valuableAgents.length) : 0;
    
    // Create market analysis
    const analysis = {
      total_free_agents: filteredByRole.length,
      market_stats: {
        average_value: averageValue,
        min_value: valuableAgents.length ? 
          Math.min(...valuableAgents.map(p => p.estimated_value)) : 0,
        max_value: valuableAgents.length ? 
          Math.max(...valuableAgents.map(p => p.estimated_value)) : 0
      },
      talent_distribution: {
        elite: filteredByRole.filter(p => p.rating >= 1.3).length,
        above_average: filteredByRole.filter(p => p.rating >= 1.1 && p.rating < 1.3).length,
        average: filteredByRole.filter(p => p.rating >= 0.9 && p.rating < 1.1).length,
        below_average: filteredByRole.filter(p => p.rating < 0.9 && p.rating > 0).length
      },
      role_distribution: countPlayersByRole(filteredByRole),
      division_distribution: countPlayersByDivision(filteredByRole),
      region_distribution: countPlayersByRegion(filteredByRole),
      top_prospects: filteredByRole.slice(0, 10).map(player => ({
        id: player.id,
        name: player.name,
        country_code: player.country_code,
        rating: player.rating,
        estimated_value: player.estimated_value,
        playstyle: player.playstyle,
        division: player.division,
        stats: {
          acs: player.acs,
          kd_ratio: player.kd_ratio,
          adr: player.adr
        }
      }))
    };
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing free agent market:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while analyzing the free agent market.'
    });
  }
};

export const generateOptimalRoster = async (req, res) => {
  try {
    const { 
      region,
      budget = 15000, // Default $15k/month budget
      min_rating = 0.8, // Minimum player rating to consider
      optimize_for = 'balanced' // balanced, firepower, tactical, value
    } = req.query;
    
    // Get available free agents matching basic criteria
    const whereClause = { 
      is_free_agent: true,
      rating: { [Op.gte]: parseFloat(min_rating) }
    };
    
    if (region) whereClause.country_code = region;
    
    const availablePlayers = await Player.findAll({
      where: whereClause,
      order: [['rating', 'DESC']]
    });
    
    // Define the roles we need to fill
    const requiredRoles = ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'Flex'];
    
    // Generate roster based on optimization strategy
    const roster = generateRoster(availablePlayers, requiredRoles, parseFloat(budget), optimize_for);
    
    // Calculate team stats
    const teamStats = calculateTeamStats(roster);
    
    res.json({
      roster: roster,
      team_stats: teamStats,
      total_cost: roster.reduce((sum, player) => sum + (player.estimated_value || 0), 0),
      budget_remaining: parseFloat(budget) - roster.reduce((sum, player) => sum + (player.estimated_value || 0), 0)
    });
  } catch (error) {
    console.error('Error generating optimal roster:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while generating the optimal roster.'
    });
  }
};

export const comparePlayers = async (req, res) => {
  try {
    const { player_ids } = req.query;
    
    if (!player_ids) {
      return res.status(400).json({
        message: 'Please provide player_ids as a comma-separated list'
      });
    }
    
    const ids = player_ids.split(',');
    
    // Get all requested players
    const players = await Player.findAll({
      where: {
        id: { [Op.in]: ids }
      }
    });
    
    if (players.length === 0) {
      return res.status(404).json({
        message: 'No players found with the provided IDs'
      });
    }
    
    // Prepare comparison data
    const comparisonData = players.map(player => ({
      id: player.id,
      name: player.name,
      team_abbreviation: player.team_abbreviation,
      is_free_agent: player.is_free_agent,
      division: player.division,
      estimated_value: player.estimated_value,
      rating: player.rating,
      playstyle: player.playstyle,
      stats: {
        acs: player.acs,
        kd_ratio: player.kd_ratio,
        adr: player.adr,
        kpr: player.kpr,
        apr: player.apr,
        fk_pr: player.fk_pr,
        fd_pr: player.fd_pr,
        hs_pct: player.hs_pct
      },
      agent_usage: player.agent_usage
    }));
    
    // Add comparison metrics
    const comparisonMetrics = calculateComparisonMetrics(comparisonData);
    
    res.json({
      players: comparisonData,
      metrics: comparisonMetrics
    });
  } catch (error) {
    console.error('Error comparing players:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while comparing players.'
    });
  }
};

export const getPlayerValuation = async (req, res) => {
  try {
    const { player_id } = req.params;
    
    // Get the player
    const player = await Player.findByPk(player_id);
    
    if (!player) {
      return res.status(404).json({
        message: `Player with id ${player_id} not found.`
      });
    }
    
    // Get comparable players for valuation context
    const comparables = await Player.findAll({
      where: {
        id: { [Op.ne]: player_id },
        is_free_agent: false, // Players with contracts
        rating: { 
          [Op.between]: [
            Math.max(0, player.rating - 0.2),
            player.rating + 0.2
          ]
        }
      },
      limit: 5,
      order: [
        [db.sequelize.literal(`ABS(rating - ${player.rating})`), 'ASC']
      ]
    });
    
    // Calculate valuation factors
    const valuationFactors = calculateValuationFactors(player);
    
    // Build valuation response
    const valuation = {
      player: {
        id: player.id,
        name: player.name,
        rating: player.rating,
        estimated_value: player.estimated_value,
        division: player.division,
        playstyle: player.playstyle
      },
      comparable_players: comparables.map(comp => ({
        id: comp.id,
        name: comp.name,
        team_abbreviation: comp.team_abbreviation,
        rating: comp.rating,
        estimated_value: comp.estimated_value
      })),
      valuation_factors: valuationFactors,
      market_context: {
        division_premium: getDivisionPremium(player.division),
        role_demand: getRoleDemand(player.playstyle),
        experience_value: getExperienceValue(player)
      }
    };
    
    res.json(valuation);
  } catch (error) {
    console.error('Error getting player valuation:', error);
    res.status(500).json({
      message: error.message || 'An error occurred while calculating player valuation.'
    });
  }
};

// ======== Helper Functions ========

/**
 * Calculate similarity between two statistical values
 */
function calculateStatSimilarity(stat1, stat2) {
  if (stat1 === null || stat2 === null) return 0;
  if (stat1 === 0 && stat2 === 0) return 1;
  
  const max = Math.max(stat1, stat2);
  const min = Math.min(stat1, stat2);
  
  if (max === 0) return 0;
  
  // Calculate how similar the values are (1 - difference percentage)
  return 1 - ((max - min) / max);
}

/**
 * Calculate similarity between playstyles
 */
function calculatePlaystyleSimilarity(playstyle1, playstyle2) {
  if (!playstyle1 || !playstyle2) return 0;
  if (!playstyle1.role_percentages || !playstyle2.role_percentages) return 0;
  
  const roles = ['Duelist', 'Controller', 'Initiator', 'Sentinel'];
  let totalDifference = 0;
  
  // Calculate total percentage difference across all roles
  roles.forEach(role => {
    const pct1 = playstyle1.role_percentages[role] || 0;
    const pct2 = playstyle2.role_percentages[role] || 0;
    totalDifference += Math.abs(pct1 - pct2);
  });
  
  // Convert to similarity (0-1)
  // Max possible difference would be 200 (100% different in all roles)
  return 1 - (totalDifference / 200);
}

/**
 * Count players by primary role
 */
function countPlayersByRole(players) {
  const roleCounts = {
    'Duelist': 0,
    'Controller': 0,
    'Initiator': 0,
    'Sentinel': 0,
    'Flex': 0
  };
  
  players.forEach(player => {
    if (!player.playstyle || !player.playstyle.role_percentages) {
      roleCounts['Unknown'] = (roleCounts['Unknown'] || 0) + 1;
      return;
    }
    
    const percentages = player.playstyle.role_percentages;
    const highestRole = Object.entries(percentages)
      .sort((a, b) => b[1] - a[1])[0];
    
    // If the highest role is less than 40%, consider them a flex player
    if (highestRole && highestRole[1] < 40) {
      roleCounts['Flex'] += 1;
    } else if (highestRole) {
      roleCounts[highestRole[0]] = (roleCounts[highestRole[0]] || 0) + 1;
    } else {
      roleCounts['Unknown'] = (roleCounts['Unknown'] || 0) + 1;
    }
  });
  
  return roleCounts;
}

/**
 * Count players by division
 */
function countPlayersByDivision(players) {
  const divisionCounts = {
    'T1': 0,
    'T2': 0,
    'T3': 0,
    'T4': 0,
    'Unranked': 0
  };
  
  players.forEach(player => {
    divisionCounts[player.division || 'Unranked'] += 1;
  });
  
  return divisionCounts;
}

/**
 * Count players by region
 */
function countPlayersByRegion(players) {
  const regionCounts = {};
  
  players.forEach(player => {
    if (player.country_code) {
      regionCounts[player.country_code] = (regionCounts[player.country_code] || 0) + 1;
    }
  });
  
  return regionCounts;
}

/**
 * Generate optimal roster based on available players and constraints
 */
function generateRoster(players, requiredRoles, budget, optimizationStrategy) {
  // Filter players with playstyle data and within budget
  const eligiblePlayers = players.filter(p => 
    p.playstyle && 
    p.playstyle.role_percentages && 
    (p.estimated_value || 0) <= budget
  );
  
  // Create a map of role to sorted players for that role
  const playersByRole = {};
  requiredRoles.forEach(role => {
    if (role === 'Flex') {
      // For flex role, find players with balanced role usage
      playersByRole[role] = eligiblePlayers
        .filter(p => {
          const percentages = Object.values(p.playstyle.role_percentages);
          const highestPct = Math.max(...percentages);
          return highestPct < 40; // No dominant role = flex player
        })
        .sort((a, b) => {
          // Sort based on optimization strategy
          if (optimizationStrategy === 'value') {
            return (a.rating / (a.estimated_value || 1)) - (b.rating / (b.estimated_value || 1));
          }
          return b.rating - a.rating;
        });
    } else {
      playersByRole[role] = eligiblePlayers
        .filter(p => {
          // For specific roles, find players where this is their primary or secondary role
          const rolePercentage = p.playstyle.role_percentages[role] || 0;
          return rolePercentage >= 30;
        })
        .sort((a, b) => {
          // Sort based on optimization strategy
          if (optimizationStrategy === 'firepower' && role === 'Duelist') {
            // For firepower, prioritize high KD ratio duelists
            return b.kd_ratio - a.kd_ratio;
          } else if (optimizationStrategy === 'tactical' && (role === 'Controller' || role === 'Sentinel')) {
            // For tactical, prioritize supportive roles
            return b.rating - a.rating;
          } else if (optimizationStrategy === 'value') {
            // For value, prioritize bang-for-buck
            return (b.rating / (b.estimated_value || 1)) - (a.rating / (a.estimated_value || 1));
          }
          // Default: sort by rating
          return b.rating - a.rating;
        });
    }
  });
  
  // Build roster, selecting best available player for each role
  const roster = [];
  let remainingBudget = budget;
  
  // First pass: fill required roles
  for (const role of requiredRoles) {
    // Get eligible players for this role that we can afford
    const affordablePlayers = playersByRole[role]
      .filter(p => !roster.includes(p) && (p.estimated_value || 0) <= remainingBudget);
    
    if (affordablePlayers.length > 0) {
      const selectedPlayer = affordablePlayers[0];
      roster.push(selectedPlayer);
      remainingBudget -= (selectedPlayer.estimated_value || 0);
    }
  }
  
  // If we couldn't fill all roles, use best available approach
  while (roster.length < 5 && remainingBudget > 0) {
    // Get all affordable players not already in roster
    const affordablePlayers = eligiblePlayers
      .filter(p => !roster.includes(p) && (p.estimated_value || 0) <= remainingBudget)
      .sort((a, b) => b.rating - a.rating);
    
    if (affordablePlayers.length > 0) {
      const selectedPlayer = affordablePlayers[0];
      roster.push(selectedPlayer);
      remainingBudget -= (selectedPlayer.estimated_value || 0);
    } else {
      break; // No more affordable players
    }
  }
  
  return roster.map(player => ({
    id: player.id,
    name: player.name,
    rating: player.rating,
    estimated_value: player.estimated_value,
    playstyle: player.playstyle,
    suggested_role: getSuggestedRole(player.playstyle),
    stats: {
      acs: player.acs,
      kd_ratio: player.kd_ratio,
      adr: player.adr
    }
  }));
}

/**
 * Calculate team statistics based on roster
 */
function calculateTeamStats(roster) {
  if (!roster.length) return {};
  
  // Calculate averages
  const averageRating = roster.reduce((sum, p) => sum + (p.rating || 0), 0) / roster.length;
  const averageACS = roster.reduce((sum, p) => sum + (p.stats.acs || 0), 0) / roster.length;
  const averageKD = roster.reduce((sum, p) => sum + (p.stats.kd_ratio || 0), 0) / roster.length;
  const averageADR = roster.reduce((sum, p) => sum + (p.stats.adr || 0), 0) / roster.length;
  
  // Calculate role coverage
  const roleCoverage = {
    'Duelist': 0,
    'Controller': 0,
    'Initiator': 0,
    'Sentinel': 0
  };
  
  roster.forEach(player => {
    if (player.playstyle && player.playstyle.role_percentages) {
      Object.entries(player.playstyle.role_percentages).forEach(([role, percentage]) => {
        roleCoverage[role] = (roleCoverage[role] || 0) + percentage / 100;
      });
    }
  });
  
  return {
    average_rating: parseFloat(averageRating.toFixed(2)),
    average_acs: parseFloat(averageACS.toFixed(2)),
    average_kd: parseFloat(averageKD.toFixed(2)),
    average_adr: parseFloat(averageADR.toFixed(2)),
    role_coverage: Object.entries(roleCoverage).map(([role, value]) => ({
      role,
      coverage: parseFloat(value.toFixed(2))
    })),
    team_cost: roster.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
  };
}

/**
 * Get suggested role based on playstyle
 */
function getSuggestedRole(playstyle) {
  if (!playstyle || !playstyle.role_percentages) return 'Flex';
  
  const percentages = playstyle.role_percentages;
  const primaryRole = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (primaryRole && primaryRole[1] >= 40) {
    return primaryRole[0];
  }
  
  return 'Flex';
}

/**
 * Calculate comparison metrics for multiple players
 */
function calculateComparisonMetrics(players) {
  if (players.length < 2) return {};
  
  // Find the best in each category
  const bestACS = Math.max(...players.map(p => p.stats.acs || 0));
  const bestKD = Math.max(...players.map(p => p.stats.kd_ratio || 0));
  const bestADR = Math.max(...players.map(p => p.stats.adr || 0));
  const bestRating = Math.max(...players.map(p => p.rating || 0));
  
  // Add relative performance metrics
  return players.map(player => ({
    id: player.id,
    name: player.name,
    relative_metrics: {
      acs_percent: bestACS ? parseFloat(((player.stats.acs || 0) / bestACS * 100).toFixed(1)) : 0,
      kd_percent: bestKD ? parseFloat(((player.stats.kd_ratio || 0) / bestKD * 100).toFixed(1)) : 0,
      adr_percent: bestADR ? parseFloat(((player.stats.adr || 0) / bestADR * 100).toFixed(1)) : 0,
      rating_percent: bestRating ? parseFloat(((player.rating || 0) / bestRating * 100).toFixed(1)) : 0
    }
  }));
}

/**
 * Calculate valuation factors for a player
 */
function calculateValuationFactors(player) {
  return {
    performance: {
      rating_factor: player.rating >= 1.3 ? 'Elite' : 
                    (player.rating >= 1.1 ? 'Above Average' : 
                    (player.rating >= 0.9 ? 'Average' : 'Below Average')),
      impact_score: Math.round((player.acs || 0) / 2 + (player.adr || 0) / 2)
    },
    role_value: player.playstyle ? {
      primary_role: getSuggestedRole(player.playstyle),
      flexibility: Object.values(player.playstyle.role_percentages || {}).filter(pct => pct >= 20).length
    } : null,
    market_value: player.estimated_value || 'Unknown'
  };
}

/**
 * Get division premium factor
 */
function getDivisionPremium(division) {
  const premiums = {
    'T1': { factor: 1.5, description: 'Top tier competition experience commands a significant premium' },
    'T2': { factor: 1.2, description: 'Strong competitive experience adds substantial value' },
    'T3': { factor: 1.0, description: 'Standard competitive level' },
    'T4': { factor: 0.8, description: 'Developing talent with room to grow' },
    'Unranked': { factor: 0.7, description: 'Unproven at competitive level' }
  };
  
  return premiums[division || 'Unranked'];
}

/**
 * Get role demand factor
 */
function getRoleDemand(playstyle) {
  if (!playstyle || !playstyle.role_percentages) {
    return { factor: 1.0, description: 'Unknown role demand' };
  }
  
  const roleFactors = {
    'Controller': { factor: 1.3, description: 'In-game leaders and controllers are in high demand' },
    'Sentinel': { factor: 1.1, description: 'Support players provide essential team stability' },
    'Initiator': { factor: 1.1, description: 'Information gathering is highly valued' },
    'Duelist': { factor: 1.0, description: 'Standard demand for fraggers' }
  };
  
  const primaryRole = getSuggestedRole(playstyle);
  
  return roleFactors[primaryRole] || { factor: 1.0, description: 'Balanced role demand' };
}

/**
 * Get experience value factor
 */
function getExperienceValue(player) {
  // This would ideally use tournament history to assess experience
  if (!player.tournament_history) {
    return { factor: 1.0, description: 'Standard experience level' };
  }
  
  const tournamentCount = player.tournament_history.length;
  
  if (tournamentCount > 10) {
    return { factor: 1.3, description: 'Extensive competitive experience adds significant value' };
  } else if (tournamentCount > 5) {
    return { factor: 1.15, description: 'Good competitive experience adds value' };
  } else if (tournamentCount > 2) {
    return { factor: 1.05, description: 'Some competitive experience' };
  } else {
    return { factor: 0.9, description: 'Limited competitive experience' };
  }
}