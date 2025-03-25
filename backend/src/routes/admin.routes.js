// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const scheduler = require('../services/scheduler.service');
const db = require('../models');

// Get queue status
router.get('/scraper/status', (req, res) => {
  try {
    console.log('Received request for scraper status');
    const status = scheduler.getQueueStatus();
    console.log('Current status:', status);
    res.json(status);
  } catch (error) {
    console.error('Error getting scraper status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack 
    });
  }
});

// Trigger player detail update
router.post('/scraper/player/:id', async (req, res) => {
  const { id } = req.params;
  const result = await scheduler.updatePlayerDetails(id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// Trigger full data refresh
router.post('/scraper/refresh', async (req, res) => {
  try {
    console.log('Received request to trigger data collection');
    console.log('Current scheduler status:', scheduler.getQueueStatus());
    
    const result = await scheduler.triggerImmediateDataCollection();
    console.log('Data collection result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error triggering data refresh:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack 
    });
  }
});

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const playerCount = await db.Player.count();
    const teamCount = await db.Team.count();
    const freeAgentCount = await db.Player.count({ where: { is_free_agent: true } });
    
    // Get counts by division
    const t1Count = await db.Player.count({ where: { division: 'T1' } });
    const t2Count = await db.Player.count({ where: { division: 'T2' } });
    const t3Count = await db.Player.count({ where: { division: 'T3' } });
    const t4Count = await db.Player.count({ where: { division: 'T4' } });
    
    res.json({
      players: {
        total: playerCount,
        free_agents: freeAgentCount,
        divisions: {
          T1: t1Count,
          T2: t2Count,
          T3: t3Count,
          T4: t4Count,
          Unranked: playerCount - (t1Count + t2Count + t3Count + t4Count)
        }
      },
      teams: {
        total: teamCount
      },
      last_updated: new Date()
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch database stats',
      details: error.message 
    });
  }
});

// Add to src/routes/admin.routes.js

// Queue earnings updates
router.post('/scraper/earnings', async (req, res) => {
  try {
    const { limit, divisions, minDaysSinceUpdate } = req.body;
    const liquipediaService = require('../services/liquipedia.service');
    
    const result = await liquipediaService.queueEarningsUpdates({
      limit, divisions, minDaysSinceUpdate
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error queuing earnings updates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get player earnings
router.get('/players/:id/earnings', async (req, res) => {
  try {
    const { id } = req.params;
    const player = await db.Player.findByPk(id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: `Player not found: ${id}`
      });
    }
    
    res.json({
      id: player.id,
      name: player.name,
      total_earnings: player.total_earnings,
      earnings_by_year: player.earnings_by_year,
      tournament_earnings: player.tournament_earnings,
      earnings_last_updated: player.earnings_last_updated
    });
  } catch (error) {
    console.error(`Error getting player earnings for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually update a player's earnings
router.post('/players/:id/earnings', async (req, res) => {
  try {
    const { id } = req.params;
    const liquipediaService = require('../services/liquipedia.service');
    
    const result = await liquipediaService.processPlayerEarnings(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(`Error updating player earnings for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test vlr.gg accessibility
router.get('/scraper/test', async (req, res) => {
  try {
    console.log('Testing vlr.gg accessibility...');
    const scraper = require('../services/scraper.service');
    
    // Test both players and teams endpoints
    console.log('Testing players endpoint...');
    const playersHtml = await scraper.makeRequest(`${scraper.baseUrl}/stats/players?page=1`);
    console.log('Players endpoint response length:', playersHtml.length);
    
    console.log('Testing teams endpoint...');
    const teamsHtml = await scraper.makeRequest(`${scraper.baseUrl}/stats/teams?page=1`);
    console.log('Teams endpoint response length:', teamsHtml.length);
    
    // Parse both responses
    const $ = require('cheerio').load(teamsHtml);
    const teamElements = $('.stats-table tbody tr');
    const teamCount = teamElements.length;
    
    const $players = require('cheerio').load(playersHtml);
    const playerElements = $players('.stats-table tbody tr');
    const playerCount = playerElements.length;
    
    console.log('Found team elements:', teamCount);
    console.log('Found player elements:', playerCount);
    
    // Log sample of HTML for debugging
    console.log('First 500 chars of teams HTML:', teamsHtml.substring(0, 500));
    console.log('First 500 chars of players HTML:', playersHtml.substring(0, 500));
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to vlr.gg',
      teams: {
        contentLength: teamsHtml.length,
        teamCount: teamCount
      },
      players: {
        contentLength: playersHtml.length,
        playerCount: playerCount
      }
    });
  } catch (error) {
    console.error('Error testing vlr.gg accessibility:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;