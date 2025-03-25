// src/services/scheduler.service.js
const cron = require('node-cron');
const scraper = require('./scraper.service');
const db = require('../models');
const { Op } = require('sequelize');

class ScraperScheduler {
  constructor() {
    this.isRunning = false;
    this.queue = [];
    this.maxConcurrentRequests = 1;
    this.activeRequests = 0;
    this.generalDelay = 2000; // 2 seconds between general requests
    this.parseDelay = 30000;  // 30 seconds between parse actions
    this.priorityLevels = {
      T1: 10,
      T2: 8,
      T3: 5,
      T4: 3,
      'Unranked': 1,
    };
    this.cronJobs = [];
    this.queueProcessorInterval = null;
  }

  /**
   * Initialize the scheduler
   */
  init() {
    // Schedule regular data updates
    this.cronJobs.push(this.scheduleBasicDataUpdate());
    this.cronJobs.push(this.scheduleDetailedPlayerUpdate());
    this.cronJobs.push(this.scheduleEarningsUpdates());
    this.cronJobs.push(this.scheduleTeamUpdate());
    this.cronJobs.push(this.scheduleTournamentUpdate());
    
    // Process queue continuously
    this.startQueueProcessor();
    
    console.log('Scraper scheduler initialized');
  }

  /**
   * Schedule basic player and team data updates (daily)
   */
  scheduleBasicDataUpdate() {
    // Run at 2:00 AM every day
    return cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled basic data update...');
      try {
        // Basic player data scraping (first 3 pages)
        await scraper.scrapeAllPlayers(3, false);
        
        // Could also add team data scraping here
        
        console.log('Scheduled basic data update completed');
      } catch (error) {
        console.error('Error in scheduled basic data update:', error);
      }
    });
  }

  /**
   * Schedule detailed player updates (weekly, in batches)
   */
  scheduleDetailedPlayerUpdate() {
    // Run at 3:00 AM every Sunday
    return cron.schedule('0 3 * * 0', async () => {
      console.log('Scheduling detailed player updates...');
      try {
        // Get all players that haven't been updated in the last week
        // or have never been updated with detailed info
        const outdatedPlayers = await db.Player.findAll({
          where: {
            [Op.or]: [
              { updatedAt: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
              { agent_usage: null },
              { playstyle: null },
              { division: null }
            ]
          }
        });
        
        console.log(`Found ${outdatedPlayers.length} players needing detailed updates`);
        
        // Prioritize and add to queue
        this.prioritizeAndQueuePlayers(outdatedPlayers);
      } catch (error) {
        console.error('Error scheduling detailed player updates:', error);
      }
    });
  }

  /**
   * Schedule team updates (weekly)
   */
  scheduleTeamUpdate() {
    // Run at 4:00 AM every Sunday
    return cron.schedule('0 4 * * 0', async () => {
      console.log('Scheduling team updates...');
      try {
        // Get all teams that haven't been updated in the last week
        const outdatedTeams = await db.Team.findAll({
          where: {
            updatedAt: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        });
        
        console.log(`Found ${outdatedTeams.length} teams needing updates`);
        
        // Add teams to queue
        outdatedTeams.forEach(team => {
          this.addToQueue({
            type: 'team_update',
            teamId: team.id,
            priority: 5, // Medium priority
            timestamp: Date.now()
          });
        });
      } catch (error) {
        console.error('Error scheduling team updates:', error);
      }
    });
  }

  /**
   * Schedule tournament updates (daily)
   */
  scheduleTournamentUpdate() {
    // Run at 5:00 AM every day
    return cron.schedule('0 5 * * *', async () => {
      console.log('Scheduling tournament updates...');
      try {
        // Get all tournaments that haven't been updated in the last day
        const outdatedTournaments = await db.Tournament.findAll({
          where: {
            updatedAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        });
        
        console.log(`Found ${outdatedTournaments.length} tournaments needing updates`);
        
        // Add tournaments to queue
        outdatedTournaments.forEach(tournament => {
          this.addToQueue({
            type: 'tournament_update',
            tournamentId: tournament.id,
            priority: 7, // High priority
            timestamp: Date.now()
          });
        });
      } catch (error) {
        console.error('Error scheduling tournament updates:', error);
      }
    });
  }

  /**
   * Schedule earnings updates for priority players
   */
  scheduleEarningsUpdates() {
    // Run at 4:00 AM every Monday and Thursday
    return cron.schedule('0 4 * * 1,4', async () => {
      console.log('Scheduling player earnings updates...');
      try {
        const liquipediaService = require('./liquipedia.service');
        
        // Queue T1 and T2 players for earnings updates
        const result = await liquipediaService.queueEarningsUpdates({
          limit: 50,  // Process 50 players at a time
          divisions: ['T1', 'T2'],
          minDaysSinceUpdate: 30  // Update monthly
        });
        
        console.log(`Queued ${result.queued_players} players for earnings updates`);
      } catch (error) {
        console.error('Error scheduling earnings updates:', error);
      }
    });
  }

  /**
   * Prioritize players based on division and queue them
   */
  prioritizeAndQueuePlayers(players) {
    // Sort players by priority
    const prioritizedPlayers = players.sort((a, b) => {
      const aPriority = this.priorityLevels[a.division || 'Unranked'] || 0;
      const bPriority = this.priorityLevels[b.division || 'Unranked'] || 0;
      return bPriority - aPriority;
    });
    
    // Add to queue with metadata
    prioritizedPlayers.forEach(player => {
      this.addToQueue({
        type: 'player_detail',
        playerId: player.id,
        playerUrl: `/players/${player.id}`,
        priority: this.priorityLevels[player.division || 'Unranked'] || 0,
        timestamp: Date.now()
      });
    });
    
    console.log(`Added ${prioritizedPlayers.length} players to the update queue`);
  }

  /**
   * Add a scraping task to the queue
   */
  addToQueue(task) {
    this.queue.push(task);
    
    // Sort queue by priority
    this.queue.sort((a, b) => b.priority - a.priority);
    
    console.log(`Task added to queue. Current queue length: ${this.queue.length}`);
  }

  /**
   * Start the queue processor
   */
  startQueueProcessor() {
    // Process queue every 5 seconds
    this.queueProcessorInterval = setInterval(() => {
      this.processNextInQueue();
    }, 5000);
    
    console.log('Queue processor started');
  }

  /**
   * Process the next item in the queue
   */
  async processNextInQueue() {
    // If already at max concurrent requests or no items in queue, skip
    if (this.activeRequests >= this.maxConcurrentRequests || this.queue.length === 0) {
      return;
    }
    
    // Get next task
    const task = this.queue.shift();
    this.activeRequests++;
    
    console.log(`Processing task: ${task.type} for ID: ${task.playerId || task.teamId}`);
    
    let taskRequeued = false;
    
    try {
      if (task.type === 'player_detail') {
        // Process player detail task
        await scraper.scrapeAndSavePlayerDetails(task.playerId, task.playerUrl);
      } else if (task.type === 'player_earnings') {
        // Process player earnings task
        const liquipediaService = require('./liquipedia.service');
        await liquipediaService.processPlayerEarnings(task.playerId);
      }
      
      console.log(`Task completed: ${task.type} for ID: ${task.playerId || task.teamId}`);
    } catch (error) {
      console.error(`Error processing task: ${task.type}`, error);
      
      // Requeue with lower priority if needed
      if (task.retries < 3) {
        console.log(`Requeuing task with retry ${task.retries + 1}`);
        this.addToQueue({
          ...task,
          priority: task.priority - 1,
          retries: (task.retries || 0) + 1,
          timestamp: Date.now()
        });
        taskRequeued = true;
      }
    } finally {
      this.activeRequests--;
      
      // Wait before processing next only if the task was not requeued
      if (!taskRequeued) {
        const delay = task.type.includes('earnings') ? this.parseDelay : this.generalDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Manually trigger a player detail update
   */
  async updatePlayerDetails(playerId) {
    try {
      const player = await db.Player.findByPk(playerId);
      
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }
      
      // Add to front of queue with high priority
      this.addToQueue({
        type: 'player_detail',
        playerId: player.id,
        playerUrl: `/players/${player.id}`,
        priority: 999, // Highest priority
        timestamp: Date.now(),
        retries: 0
      });
      
      return { success: true, message: 'Player update scheduled' };
    } catch (error) {
      console.error('Error scheduling player update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manually trigger a full data refresh
   */
  async triggerFullRefresh(options = {}) {
    const { pages = 5, detailed = true } = options;
    
    try {
      console.log(`Triggering full data refresh (${pages} pages, detailed: ${detailed})`);
      
      // Schedule the refresh as a background task
      setTimeout(async () => {
        try {
          await scraper.scrapeAllPlayers(pages, detailed);
          console.log('Full data refresh completed');
        } catch (error) {
          console.error('Error in full data refresh:', error);
        }
      }, 0);
      
      return { 
        success: true, 
        message: `Full data refresh scheduled (${pages} pages, detailed: ${detailed})` 
      };
    } catch (error) {
      console.error('Error scheduling full refresh:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      queue_length: this.queue.length,
      active_requests: this.activeRequests,
      is_running: this.isRunning,
      priority_distribution: this.getPriorityDistribution()
    };
  }

  /**
   * Get distribution of tasks by priority
   */
  getPriorityDistribution() {
    const distribution = {};
    
    this.queue.forEach(task => {
      const priority = task.priority;
      distribution[priority] = (distribution[priority] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    // Clear queue processor interval first
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
    }
    
    // Stop all cron jobs
    if (this.cronJobs) {
      this.cronJobs.forEach(job => {
        if (job && typeof job.stop === 'function') {
          job.stop();
        }
      });
    }
    this.cronJobs = [];
    
    // Clear queue
    this.queue = [];
    this.activeRequests = 0;
    this.isRunning = false;
    
    console.log('Scheduler stopped');
  }
}

module.exports = new ScraperScheduler();