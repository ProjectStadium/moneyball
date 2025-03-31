const express = require('express');
const router = express.Router();
const RolePerformanceService = require('../services/rolePerformance.service');
const rolePerformanceService = new RolePerformanceService();

// Test endpoint for RPS calculation
router.post('/test', async (req, res) => {
  try {
    const { player, tournamentName } = req.body;

    // Validate required fields
    if (!player || !player.role || !player.puuid || !tournamentName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['player.role', 'player.puuid', 'tournamentName']
      });
    }

    // Calculate RPS
    const rps = await rolePerformanceService.calculateRPS(player, tournamentName);

    // Return detailed breakdown
    res.json({
      success: true,
      data: {
        player: {
          name: player.name,
          role: player.role,
          puuid: player.puuid
        },
        tournament: tournamentName,
        rps: rps.score,
        breakdown: {
          baseStats: rps.details.baseStats,
          normalizedMetrics: rps.details.normalizedMetrics,
          weights: rps.details.weights,
          adjustments: rps.details.adjustments,
          utilityData: rps.details.utilityData
        }
      }
    });
  } catch (error) {
    console.error('Error in RPS test endpoint:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// New endpoint for validating role performance with real tournament data
router.post('/validate', async (req, res) => {
  try {
    const { player, tournamentName, tournamentStage } = req.body;

    // Validate required fields
    if (!player || !player.role || !player.puuid || !tournamentName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['player.role', 'player.puuid', 'tournamentName']
      });
    }

    // Get all matches from the specific tournament
    const matches = await rolePerformanceService.getTournamentMatches(player.puuid, tournamentName);
    
    // Group matches by stage if tournamentStage is provided
    const stageMatches = tournamentStage 
      ? matches.filter(match => rolePerformanceService.getTournamentStage(match) === tournamentStage)
      : matches;

    // Calculate RPS with tournament context
    const rps = await rolePerformanceService.calculateRPS(player, tournamentName, {
      matches: stageMatches,
      tournamentStage,
      weightRecentMatches: true
    });

    // Calculate stage-specific metrics
    const stageMetrics = {
      groupStage: matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'group_stage').length,
      playoffs: matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'playoffs').length,
      finals: matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'finals').length
    };

    // Return detailed validation results
    res.json({
      success: true,
      data: {
        player: {
          name: player.name,
          role: player.role,
          puuid: player.puuid
        },
        tournament: {
          name: tournamentName,
          stage: tournamentStage || 'all',
          matches: {
            total: matches.length,
            byStage: stageMetrics
          }
        },
        rps: rps.score,
        breakdown: {
          baseStats: rps.details.baseStats,
          normalizedMetrics: rps.details.normalizedMetrics,
          weights: rps.details.weights,
          adjustments: rps.details.adjustments,
          utilityData: rps.details.utilityData,
          recentMatchesWeight: rps.details.recentMatchesWeight
        },
        validation: {
          matchCount: matches.length,
          stageDistribution: stageMetrics,
          recentMatchesImpact: rps.details.recentMatchesImpact
        }
      }
    });
  } catch (error) {
    console.error('Error in RPS validation endpoint:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Calculate RPS for a player in a specific tournament
router.get('/player/:puuid/tournament/:tournamentName', async (req, res) => {
  try {
    const { puuid, tournamentName } = req.params;
    const { role } = req.query; // Get role from query params

    if (!role) {
      return res.status(400).json({ error: 'Player role is required' });
    }

    const player = { puuid, role };
    const rps = await rolePerformanceService.calculateRPS(player, tournamentName, {
      weightRecentMatches: true,
      applyStageWeights: true
    });

    // Return the expected metrics structure
    res.json({
      score: rps.score,
      metrics: {
        baseStats: rps.details.baseStats,
        normalizedMetrics: rps.details.normalizedMetrics,
        weights: rps.details.weights,
        adjustments: rps.details.adjustments,
        utilityData: rps.details.utilityData,
        recentMatchesWeight: rps.details.recentMatchesWeight,
        recentMatchesImpact: rps.details.recentMatchesImpact
      },
      stageWeights: rps.details.stageWeights,
      recentWeights: rps.details.recentWeights
    });
  } catch (error) {
    console.error('Error calculating RPS:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 