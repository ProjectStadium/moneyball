import express from 'express';
import scheduler from '../services/scheduler.service.js';
import { db } from '../models/index.js';
import liquipediaService from '../services/liquipedia.service.js';

const router = express.Router();

// Get queue status
router.get('/scraper/status', (req, res) => {
  const status = scheduler.getQueueStatus();
  res.json(status);
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
  const { pages, detailed } = req.body;
  const result = await scheduler.triggerFullRefresh({ pages, detailed });

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
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
          Unranked: playerCount - (t1Count + t2Count + t3Count + t4Count),
        },
      },
      teams: {
        total: teamCount,
      },
      last_updated: new Date(),
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({
      error: 'Failed to fetch database stats',
      details: error.message,
    });
  }
});

// Queue earnings updates
router.post('/scraper/earnings', async (req, res) => {
  try {
    const { limit, divisions, minDaysSinceUpdate } = req.body;

    const result = await liquipediaService.queueEarningsUpdates({
      limit,
      divisions,
      minDaysSinceUpdate,
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
      error: error.message,
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
        message: `Player not found: ${id}`,
      });
    }

    res.json({
      id: player.id,
      name: player.name,
      total_earnings: player.total_earnings,
      earnings_by_year: player.earnings_by_year,
      tournament_earnings: player.tournament_earnings,
      earnings_last_updated: player.earnings_last_updated,
    });
  } catch (error) {
    console.error(`Error getting player earnings for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manually update a player's earnings
router.post('/players/:id/earnings', async (req, res) => {
  try {
    const { id } = req.params;

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
      error: error.message,
    });
  }
});

export default router;