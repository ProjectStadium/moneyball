// At the top of the file:
jest.mock('../../src/services/scraper.service', () => 
  require('../mocks/scraper.service.mock')
);

jest.mock('../../src/services/liquipedia.service', () => 
  require('../mocks/liquipedia.service.mock')
);

// __tests__/services/scheduler.service.test.js
const db = require('../../src/models');
const schedulerService = require('../../src/services/scheduler.service');
const scraperService = require('../../src/services/scraper.service');
const liquipediaService = require('../../src/services/liquipedia.service');
const nodeCron = require('node-cron');

// Mock dependencies
jest.mock('../../src/models', () => {
  const mockSequelize = {
    define: jest.fn().mockReturnValue({}),
    literal: jest.fn().mockReturnValue({})
  };
  
  const mockPlayer = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
  };
  
  return {
    sequelize: mockSequelize,
    Sequelize: {
      Op: {
        ne: 'ne',
        gt: 'gt',
        lt: 'lt',
        gte: 'gte',
        lte: 'lte',
        in: 'in',
        notIn: 'notIn',
        or: 'or'
      }
    },
    Player: mockPlayer
  };
});

jest.mock('../../src/services/scraper.service', () => ({
  scrapeAndSavePlayerDetails: jest.fn().mockResolvedValue(true),
  scrapeAllPlayers: jest.fn().mockResolvedValue(5)
}));

jest.mock('../../src/services/liquipedia.service', () => ({
  processPlayerEarnings: jest.fn().mockResolvedValue({ success: true }),
  queueEarningsUpdates: jest.fn().mockResolvedValue({ queued_players: 5, success: true })
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

// Mock setTimeout to execute immediately in tests
jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

describe('ScraperScheduler Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the scheduler queue for each test
    schedulerService.queue = [];
    schedulerService.activeRequests = 0;
    schedulerService.isRunning = false;
  });

  describe('Queue Management', () => {
    test('addToQueue should add task and sort by priority', () => {
      // Execute - add tasks with different priorities
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'player1',
        priority: 5,
        timestamp: Date.now()
      });
      
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'player2',
        priority: 10, // Higher priority
        timestamp: Date.now()
      });
      
      // Verify
      expect(schedulerService.queue).toHaveLength(2);
      expect(schedulerService.queue[0].playerId).toBe('player2'); // Higher priority should be first
      expect(schedulerService.queue[1].playerId).toBe('player1');
    });

    test('processNextInQueue should process player_detail task correctly', async () => {
      // Setup - add a task to the queue
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'test-player-id',
        playerUrl: '/players/test-player-id',
        priority: 5,
        timestamp: Date.now()
      });
      
      // Execute
      await schedulerService.processNextInQueue();
      
      // Verify
      expect(scraperService.scrapeAndSavePlayerDetails).toHaveBeenCalledWith(
        'test-player-id',
        '/players/test-player-id'
      );
      expect(schedulerService.queue).toHaveLength(0); // Queue should be empty
      expect(schedulerService.activeRequests).toBe(0); // Should reset after processing
    });

    test('processNextInQueue should requeue tasks on failure with incremented retries', async () => {
      // Setup - add a task to the queue that will fail
      scraperService.scrapeAndSavePlayerDetails.mockRejectedValueOnce(new Error('Test error'));
      
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'error-player-id',
        playerUrl: '/players/error-player-id',
        priority: 5,
        timestamp: Date.now(),
        retries: 0
      });
      
      // Execute
      await schedulerService.processNextInQueue();
      
      // Verify
      expect(scraperService.scrapeAndSavePlayerDetails).toHaveBeenCalledWith(
        'error-player-id',
        '/players/error-player-id'
      );
      
      // The task should be requeued with increased retry count and lower priority
      expect(schedulerService.queue).toHaveLength(1);
      expect(schedulerService.queue[0].playerId).toBe('error-player-id');
      expect(schedulerService.queue[0].retries).toBe(1);
      expect(schedulerService.queue[0].priority).toBe(4); // Priority decremented
    });

    test('processNextInQueue should discard tasks exceeding max retries', async () => {
      // Setup - add a task with max retries that will fail
      scraperService.scrapeAndSavePlayerDetails.mockRejectedValueOnce(new Error('Test error'));
      
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'max-retry-player-id',
        playerUrl: '/players/max-retry-player-id',
        priority: 5,
        timestamp: Date.now(),
        retries: 3 // Max retries
      });
      
      // Execute
      await schedulerService.processNextInQueue();
      
      // Verify
      expect(scraperService.scrapeAndSavePlayerDetails).toHaveBeenCalledWith(
        'max-retry-player-id',
        '/players/max-retry-player-id'
      );
      
      // The task should not be requeued
      expect(schedulerService.queue).toHaveLength(0);
    });
  });

  describe('Scheduling', () => {
    test('init should set up cron jobs correctly', () => {
      // Execute
      schedulerService.init();
      
      // Verify that schedule was called three times (for the three scheduled jobs)
      expect(nodeCron.schedule).toHaveBeenCalledTimes(3);
      
      // Verify specific cron schedules
      expect(nodeCron.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function)); // Basic data update
      expect(nodeCron.schedule).toHaveBeenCalledWith('0 3 * * 0', expect.any(Function)); // Detailed player update
      expect(nodeCron.schedule).toHaveBeenCalledWith('0 4 * * 1,4', expect.any(Function)); // Earnings updates
    });

    test('scheduleDetailedPlayerUpdate should query outdated players and queue them', async () => {
      // Setup - mock database call to return outdated players
      const mockPlayers = [
        { id: 'outdated1', division: 'T1' },
        { id: 'outdated2', division: 'T2' }
      ];
      
      db.Player.findAll.mockResolvedValue(mockPlayers);
      
      // Execute - call directly the function that would be passed to cron.schedule
      await schedulerService.scheduleDetailedPlayerUpdate();
      
      // Verify
      expect(db.Player.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything()
      }));
      
      // Should have added the outdated players to the queue
      expect(schedulerService.queue).toHaveLength(2);
    });
  });

  describe('Specific Methods', () => {
    test('updatePlayerDetails should add a high-priority task to the queue', async () => {
      // Setup
      db.Player.findByPk.mockResolvedValue({ id: 'test-id' });
      
      // Execute
      const result = await schedulerService.updatePlayerDetails('test-id');
      
      // Verify
      expect(db.Player.findByPk).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({ success: true, message: 'Player update scheduled' });
      expect(schedulerService.queue).toHaveLength(1);
      expect(schedulerService.queue[0].priority).toBe(999); // Highest priority
      expect(schedulerService.queue[0].playerId).toBe('test-id');
    });

    test('triggerFullRefresh should schedule a full data refresh', async () => {
      // Execute
      const result = await schedulerService.triggerFullRefresh({ pages: 3, detailed: true });
      
      // Verify
      expect(result).toEqual({ 
        success: true, 
        message: 'Full data refresh scheduled (3 pages, detailed: true)' 
      });
      
      // Scraper should be called via setTimeout
      expect(scraperService.scrapeAllPlayers).toHaveBeenCalledWith(3, true);
    });
  });

  describe('Utility Methods', () => {
    test('getQueueStatus should return the current state of the queue', () => {
      // Setup - add some tasks to the queue
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'player1',
        priority: 5
      });
      
      schedulerService.addToQueue({
        type: 'player_detail',
        playerId: 'player2',
        priority: 5
      });
      
      schedulerService.activeRequests = 1;
      
      // Execute
      const status = schedulerService.getQueueStatus();
      
      // Verify
      expect(status).toEqual({
        queue_length: 2,
        active_requests: 1,
        is_running: false,
        priority_distribution: { '5': 2 }
      });
    });
  });
});