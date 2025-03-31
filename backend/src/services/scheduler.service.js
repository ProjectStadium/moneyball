// src/services/scheduler.service.js
const cron = require('node-cron');
const vlrScraper = require('./vlrScraper.service');
const db = require('../models');
const { Op } = require('sequelize');
const liquipediaService = require('./liquipedia.service');
const { v4: uuidv4 } = require('uuid');
const { Worker } = require('worker_threads');
const path = require('path');

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
    this.isProcessing = false;
    this.scraper = new vlrScraper(db);
    this.db = db;
    this.maxWorkers = 5;
    this.workers = [];
  }

  /**
   * Initialize the scheduler
   */
  init() {
    // Only start cron jobs in production
    if (process.env.NODE_ENV === 'production') {
      // Schedule regular data updates
      this.cronJobs.push(this.scheduleBasicDataUpdate());
      this.cronJobs.push(this.scheduleDetailedPlayerUpdate());
      this.cronJobs.push(this.scheduleEarningsUpdates());
      this.cronJobs.push(this.scheduleTeamUpdate());
      this.cronJobs.push(this.scheduleTournamentUpdate());
      
      // Process queue continuously
      this.startQueueProcessor();
    }
    
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
        await this.scraper.scrapeAllPlayers(3, false);
        
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
        const outdatedPlayers = await this.db.Player.findAll({
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
        const outdatedTeams = await this.db.Team.findAll({
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
        const outdatedTournaments = await this.db.Tournament.findAll({
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
  async addToQueue(task) {
    // Ensure task has required fields
    if (!task.type) {
      console.error('[Scheduler] Cannot add task to queue: missing type');
      return;
    }

    // Set default values
    task.priority = task.priority || 0;
    task.timestamp = task.timestamp || Date.now();
    task.retries = task.retries || 0;

    // Add task to queue
    this.queue.push(task);
    
    // Sort queue by priority (highest first)
    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
    
    console.log(`[Scheduler] Task added to queue: ${task.type} (priority: ${task.priority}, retries: ${task.retries})`);
    console.log(`[Scheduler] Current queue length: ${this.queue.length}`);
    
    // Log queue distribution by type
    const typeDistribution = {};
    this.queue.forEach(t => {
      typeDistribution[t.type] = (typeDistribution[t.type] || 0) + 1;
    });
    console.log('[Scheduler] Queue distribution by type:', typeDistribution);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Start the queue processor
   */
  startQueueProcessor() {
    // Process queue every 5 seconds
    this.queueProcessorInterval = setInterval(() => {
      this.processQueue();
    }, 5000);
    
    console.log('Queue processor started');
  }

  /**
   * Process the next item in the queue
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const task = this.queue.shift();
    await this.processTask(task);
    this.isProcessing = false;

    if (this.queue.length > 0) {
      await this.processQueue();
    }
  }

  /**
   * Process a task from the queue
   */
  async processTask(task) {
    try {
      console.log(`[Scheduler] Processing task: ${task.type}`);
      
      switch (task.type) {
        case 'player_data': {
          const url = `${this.scraper.baseUrl}/stats/players?page=${task.data?.page || 1}`;
          const players = await this.scraper.scrapePlayerList(url);
          
          if (players.length > 0) {
            // Process players in parallel using worker threads
            const workerPromises = players.map(player => {
              return new Promise((resolve, reject) => {
                const worker = new Worker(path.join(__dirname, '../workers/playerScraper.worker.js'), {
                  workerData: { playerUrl: player.player_url }
                });

                worker.on('message', (result) => {
                  if (result.success) {
                    resolve({ ...player, ...result.data });
                  } else {
                    console.error(`Error in worker for ${player.player_name}:`, result.error);
                    resolve(player); // Resolve with original data on error
                  }
                });

                worker.on('error', (error) => {
                  console.error(`Worker error for ${player.player_name}:`, error);
                  resolve(player); // Resolve with original data on error
                });
              });
            });

            const playersWithDetails = await Promise.all(workerPromises);
            await this.scraper.savePlayersBatch(playersWithDetails);
          }
          break;
        }

        case 'team_data': {
          const teams = await this.scraper.scrapeTeamList();
          if (teams.length > 0) {
            await this.scraper.saveTeamsBatch(teams);
          }
          break;
        }

        case 'tournament_data': {
          const tournaments = await this.scraper.scrapeTournamentList();
          if (tournaments.length > 0) {
            await this.scraper.saveTournamentsBatch(tournaments);
          }
          break;
        }

        case 'tournament_update': {
          try {
            const tournament = await this.db.Tournament.findByPk(task.data.tournamentId);
            if (tournament) {
              const updatedData = await this.scraper.scrapeTournamentDetails(tournament.url);
              if (updatedData) {
                await tournament.update(updatedData);
                console.log(`[Scheduler] Updated tournament: ${tournament.name}`);
              }
            }
          } catch (error) {
            console.error(`[Scheduler] Error updating tournament: ${error.message}`);
            if (task.retries < 3) {
              await this.addToQueue({
                ...task,
                priority: task.priority - 1,
                retries: (task.retries || 0) + 1
              });
            }
          }
          break;
        }

        case 'player_detail': {
          try {
            const player = await this.db.Player.findByPk(task.data.playerId);
            if (player) {
              const updatedData = await this.scraper.scrapePlayerDetails(player.url);
              if (updatedData) {
                await player.update(updatedData);
                console.log(`[Scheduler] Updated player details: ${player.name}`);
              }
            }
          } catch (error) {
            console.error(`[Scheduler] Error updating player details: ${error.message}`);
            if (task.retries < 3) {
              await this.addToQueue({
                ...task,
                priority: task.priority - 1,
                retries: (task.retries || 0) + 1
              });
            }
          }
          break;
        }

        case 'player_earnings': {
          try {
            const player = await this.db.Player.findByPk(task.data.playerId);
            if (player) {
              const earnings = await this.scraper.scrapePlayerEarnings(player.url);
              if (earnings) {
                await player.update({ earnings });
                console.log(`[Scheduler] Updated player earnings: ${player.name}`);
              }
            }
          } catch (error) {
            console.error(`[Scheduler] Error updating player earnings: ${error.message}`);
            if (task.retries < 3) {
              await this.addToQueue({
                ...task,
                priority: task.priority - 1,
                retries: (task.retries || 0) + 1
              });
            }
          }
          break;
        }

        default:
          console.warn(`[Scheduler] Unknown task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`[Scheduler] Error processing task: ${error.message}`);
      if (task.retries < 3) {
        await this.addToQueue({
          ...task,
          priority: task.priority - 1,
          retries: (task.retries || 0) + 1
        });
      }
    }
  }

  getDelayForTaskType(taskType) {
    switch (taskType) {
      case 'player_data':
      case 'team_data':
        return 5000; // 5 seconds between list pages
      case 'tournament_data':
        return 3000; // 3 seconds between tournament list updates
      case 'tournament_update':
      case 'player_detail':
      case 'player_earnings':
        return 10000; // 10 seconds between detailed scrapes
      default:
        return 5000; // Default 5 second delay
    }
  }

  /**
   * Manually trigger a player detail update
   */
  async updatePlayerDetails(playerId) {
    try {
      const player = await this.db.Player.findByPk(playerId);
      
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
          await this.scraper.scrapeAllPlayers(pages, detailed);
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
   * Trigger immediate data collection
   */
  async triggerImmediateDataCollection() {
    if (this.isRunning) {
      console.log('[Scheduler] Data collection is already running');
      return { success: false, message: 'Data collection is already running' };
    }

    try {
      this.isRunning = true;
      console.log('[Scheduler] Starting immediate data collection...');

      // Step 1: Queue basic player data collection
      console.log('[Scheduler] Step 1: Queuing basic player data collection...');
      this.addToQueue({
        type: 'player_data',
        priority: 999,
        timestamp: Date.now(),
        retries: 0,
        pages: 5,
        detailed: false
      });

      // Step 2: Queue team data collection
      console.log('[Scheduler] Step 2: Queuing team data collection...');
      this.addToQueue({
        type: 'team_data',
        priority: 998,
        timestamp: Date.now(),
        retries: 0,
        pages: 3
      });

      // Step 3: Queue tournament data collection
      console.log('[Scheduler] Step 3: Queuing tournament data collection...');
      this.addToQueue({
        type: 'tournament_data',
        priority: 997,
        timestamp: Date.now(),
        retries: 0,
        limit: 50,
        status: 'upcoming'
      });

      this.isRunning = false;
      console.log('[Scheduler] Data collection tasks queued successfully');
      return {
        success: true,
        message: 'Full data refresh scheduled (5 pages, detailed: true)',
        queueLength: this.queue.length
      };
    } catch (error) {
      console.error('[Scheduler] Error queuing data collection tasks:', error);
      console.error('[Scheduler] Error stack:', error.stack);
      this.isRunning = false;
      return { 
        success: false, 
        message: error.message
      };
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      isRunning: this.isRunning,
      queueLength: this.queue.length,
      activeRequests: this.activeRequests
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