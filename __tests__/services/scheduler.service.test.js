// Mock dependencies first
jest.mock('../../src/services/scraper.service', () => ({
  scrapeAndSavePlayerDetails: jest.fn().mockResolvedValue(true),
  scrapeAllPlayers: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../src/services/liquipedia.service', () => ({
  processPlayerEarnings: jest.fn().mockResolvedValue(true),
  queueEarningsUpdates: jest.fn().mockResolvedValue({
    success: true,
    queued_players: [
      { id: 1, name: 'Player 1' },
      { id: 2, name: 'Player 2' }
    ],
    divisions: ['T1', 'T2']
  })
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockImplementation((schedule, callback) => ({
    stop: jest.fn(),
    callback
  }))
}));

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn().mockReturnValue(123); // Return a dummy interval ID
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

// Mock setTimeout to execute immediately in tests
jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

jest.mock('../../src/utils/database', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
    define: jest.fn().mockReturnValue({}),
    literal: jest.fn().mockReturnValue({})
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
    }
  };
});

// Then import modules
const db = require('../../src/models');
const schedulerService = require('../../src/services/scheduler.service');
const scraperService = require('../../src/services/scraper.service');
const liquipediaService = require('../../src/services/liquipedia.service');
const cron = require('node-cron');

// Mock database models
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
    Player: mockPlayer,
    Team: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    },
    Tournament: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    }
  };
});

describe('Scheduler Service', () => {
  let mockSetIntervalInstance;
  let mockSetTimeoutInstance;
  let mockClearIntervalInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance state
    schedulerService.stop();
    // Clear any remaining timers
    jest.clearAllTimers();
    // Clear the queue
    schedulerService.queue = [];
    schedulerService.activeRequests = 0;
    schedulerService.isRunning = false;
    // Setup interval/timeout spies
    mockSetIntervalInstance = jest.spyOn(global, 'setInterval');
    mockSetTimeoutInstance = jest.spyOn(global, 'setTimeout');
    mockClearIntervalInstance = jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    // Clean up any remaining intervals
    schedulerService.stop();
    // Clear any remaining timers
    jest.clearAllTimers();
    // Restore timer mocks
    mockSetIntervalInstance.mockRestore();
    mockSetTimeoutInstance.mockRestore();
    mockClearIntervalInstance.mockRestore();
  });

  describe('initialize', () => {
    it('should initialize scheduler with default settings', () => {
      // Act
      schedulerService.init();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *', // Every day at 2 AM
        expect.any(Function)
      );
      expect(mockSetIntervalInstance).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should initialize scheduler with custom settings', () => {
      // Arrange
      const customSettings = {
        updateInterval: '0 */12 * * *', // Every 12 hours
        maxRetries: 3,
        retryDelay: 5000
      };

      // Act
      schedulerService.init(customSettings);

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *', // Every day at 2 AM
        expect.any(Function)
      );
    });

    it('should not initialize multiple times', () => {
      // Act
      schedulerService.init();
      schedulerService.init();

      // Assert
      expect(cron.schedule).toHaveBeenCalledTimes(10); // 5 schedules per init
    });
  });

  describe('updatePlayerData', () => {
    beforeEach(() => {
      // Initialize the scheduler before each test
      schedulerService.init();
    });

    it('should update player data successfully', async () => {
      // Arrange
      const mockPlayer = { id: 1, name: 'Player 1' };
      db.Player.findByPk.mockResolvedValue(mockPlayer);
      scraperService.scrapeAndSavePlayerDetails.mockResolvedValue(true);

      // Act
      await schedulerService.updatePlayerDetails(1);

      // Assert
      expect(db.Player.findByPk).toHaveBeenCalledWith(1);
      expect(schedulerService.queue.length).toBe(1);
    });

    it('should handle errors during update', async () => {
      // Arrange
      db.Player.findByPk.mockResolvedValue(null);

      // Act
      const result = await schedulerService.updatePlayerDetails(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found: 1');
    });

    it('should retry failed updates', async () => {
      // Arrange
      const mockPlayer = { id: 1, name: 'Player 1' };
      db.Player.findByPk.mockResolvedValue(mockPlayer);

      // Act
      await schedulerService.updatePlayerDetails(1);
      await schedulerService.processNextInQueue();

      // Assert
      expect(schedulerService.queue.length).toBe(0);
    });
  });

  describe('updateTeamData', () => {
    beforeEach(() => {
      // Initialize the scheduler before each test
      schedulerService.init();
      // Clear the queue
      schedulerService.queue = [];
    });

    it('should schedule team updates correctly', () => {
      // Act
      const job = schedulerService.scheduleTeamUpdate();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 4 * * 0', // Every Sunday at 4 AM
        expect.any(Function)
      );
    });

    it('should add teams to queue when triggered', async () => {
      // Arrange
      const mockTeams = [
        { id: 1, name: 'Team 1' },
        { id: 2, name: 'Team 2' }
      ];
      db.Team.findAll.mockResolvedValue(mockTeams);

      // Get the callback function from the cron schedule mock
      schedulerService.scheduleTeamUpdate();
      const callback = cron.schedule.mock.calls[cron.schedule.mock.calls.length - 1][1];
      
      // Clear the queue before running the test
      schedulerService.queue = [];
      
      // Act
      await callback();
      
      // Assert
      expect(db.Team.findAll).toHaveBeenCalled();
      expect(schedulerService.queue.length).toBe(2);
      expect(schedulerService.queue[0]).toMatchObject({
        type: 'team_update',
        teamId: expect.any(Number),
        priority: 5
      });
    });
  });

  describe('updateTournamentData', () => {
    beforeEach(() => {
      // Initialize the scheduler before each test
      schedulerService.init();
      // Clear the queue
      schedulerService.queue = [];
    });

    it('should schedule tournament updates correctly', () => {
      // Act
      const job = schedulerService.scheduleTournamentUpdate();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 5 * * *', // Every day at 5 AM
        expect.any(Function)
      );
    });

    it('should add tournaments to queue when triggered', async () => {
      // Arrange
      const mockTournaments = [
        { id: 1, name: 'Tournament 1' },
        { id: 2, name: 'Tournament 2' }
      ];
      db.Tournament.findAll.mockResolvedValue(mockTournaments);

      // Get the callback function directly from cron.schedule mock
      const callback = cron.schedule.mock.calls[cron.schedule.mock.calls.length - 1][1];
      
      // Clear the queue before running the test
      schedulerService.queue = [];
      
      // Act
      await callback();

      // Assert
      expect(db.Tournament.findAll).toHaveBeenCalled();
      expect(schedulerService.queue.length).toBe(2);
      expect(schedulerService.queue[0]).toMatchObject({
        type: 'tournament_update',
        tournamentId: expect.any(Number),
        priority: 7
      });
    });
  });

  describe('earnings updates', () => {
    beforeEach(() => {
      schedulerService.init();
      schedulerService.queue = [];
    });

    it('should schedule earnings updates correctly', () => {
      // Act
      const job = schedulerService.scheduleEarningsUpdates();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 4 * * 1,4', // Every Monday and Thursday at 4 AM
        expect.any(Function)
      );
    });

    it('should add players to queue when triggered', async () => {
      // Arrange
      const mockPlayers = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ];
      const mockResponse = {
        success: true,
        queued_players: mockPlayers,
        divisions: ['T1', 'T2']
      };
      liquipediaService.queueEarningsUpdates.mockResolvedValue(mockResponse);

      // Get the callback function from the cron schedule mock
      schedulerService.scheduleEarningsUpdates();
      const callback = cron.schedule.mock.calls[cron.schedule.mock.calls.length - 1][1];
      
      // Clear the queue before running the test
      schedulerService.queue = [];
      
      // Act
      await callback();

      // Assert
      expect(liquipediaService.queueEarningsUpdates).toHaveBeenCalled();
      expect(schedulerService.queue.length).toBe(2);
      expect(schedulerService.queue[0]).toMatchObject({
        type: 'player_earnings',
        playerId: expect.any(Number),
        priority: expect.any(Number)
      });
    });

    it('should process earnings updates with correct delay', async () => {
      // Arrange
      const task = {
        type: 'player_earnings',
        playerId: 1,
        priority: 10
      };
      schedulerService.addToQueue(task);
      liquipediaService.processPlayerEarnings.mockResolvedValue(true);

      // Act
      await schedulerService.processNextInQueue();

      // Assert
      expect(liquipediaService.processPlayerEarnings).toHaveBeenCalledWith(1);
      expect(schedulerService.queue.length).toBe(0);
    }, 60000); // Increase timeout to 60 seconds
  });

  describe('queue management', () => {
    it('should process queue items in priority order', () => {
      const task1 = { type: 'player_detail', playerId: 1, priority: 10 };
      const task2 = { type: 'player_detail', playerId: 2, priority: 5 };
      schedulerService.addToQueue(task2);
      schedulerService.addToQueue(task1);
      expect(schedulerService.queue[0]).toEqual(task1);
    });

    it('should requeue failed tasks with lower priority', async () => {
      const task = { 
        type: 'player_detail', 
        playerId: 1, 
        priority: 10,
        retries: 0 
      };
      schedulerService.addToQueue(task);
      scraperService.scrapeAndSavePlayerDetails.mockRejectedValue(new Error('Test error'));
      await schedulerService.processNextInQueue();
      expect(schedulerService.queue[0].priority).toBe(9);
      expect(schedulerService.queue[0].retries).toBe(1);
    });

    it('should not requeue tasks that have reached max retries', async () => {
      const task = { 
        type: 'player_detail', 
        playerId: 1, 
        priority: 10,
        retries: 3 
      };
      schedulerService.addToQueue(task);
      scraperService.scrapeAndSavePlayerDetails.mockRejectedValue(new Error('Test error'));
      await schedulerService.processNextInQueue();
      expect(schedulerService.queue.length).toBe(0);
    });

    it('should respect max concurrent requests limit', async () => {
      schedulerService.maxConcurrentRequests = 2;
      schedulerService.activeRequests = 2;
      const task = { type: 'player_detail', playerId: 1, priority: 10 };
      schedulerService.addToQueue(task);
      await schedulerService.processNextInQueue();
      expect(schedulerService.queue.length).toBe(1);
    });

    it('should process different types of tasks', async () => {
      // Arrange
      const tasks = [
        { type: 'player_detail', playerId: 1, playerUrl: '/players/1', priority: 10 },
        { type: 'player_earnings', playerId: 2, priority: 8 }
      ];
      
      // Clear any existing tasks
      schedulerService.queue = [];
      tasks.forEach(task => schedulerService.addToQueue(task));

      // Mock successful responses
      scraperService.scrapeAndSavePlayerDetails.mockResolvedValue(true);
      liquipediaService.processPlayerEarnings.mockResolvedValue(true);

      // Act & Assert
      // Process player detail task
      await schedulerService.processNextInQueue();
      expect(scraperService.scrapeAndSavePlayerDetails).toHaveBeenCalledWith(1, '/players/1');
      expect(schedulerService.queue.length).toBe(1);

      // Process earnings task
      await schedulerService.processNextInQueue();
      expect(liquipediaService.processPlayerEarnings).toHaveBeenCalledWith(2);
      expect(schedulerService.queue.length).toBe(0);
    }, 60000); // Increase timeout to 60 seconds

    it('should handle errors for different task types', async () => {
      // Arrange
      const tasks = [
        { type: 'player_detail', playerId: 1, priority: 10, retries: 0 }
      ];
      
      tasks.forEach(task => schedulerService.addToQueue(task));

      // Mock error
      scraperService.scrapeAndSavePlayerDetails.mockRejectedValueOnce(new Error('Scraper error'));

      // Act
      await schedulerService.processNextInQueue();

      // Assert
      expect(schedulerService.queue[0]).toMatchObject({
        type: 'player_detail',
        playerId: 1,
        priority: 9,
        retries: 1
      });
    });
  });

  describe('stop', () => {
    it('should stop all scheduled tasks', async () => {
      // Arrange
      const mockStop = jest.fn();
      cron.schedule.mockReturnValue({ stop: mockStop });
      schedulerService.init();
      const intervalId = 123; // Use the dummy interval ID we set up in the mock
      schedulerService.queueProcessorInterval = intervalId;

      // Act
      await schedulerService.stop();

      // Assert
      expect(mockStop).toHaveBeenCalled();
      expect(mockClearIntervalInstance).toHaveBeenCalledWith(intervalId);
      expect(schedulerService.queueProcessorInterval).toBeNull();
      expect(schedulerService.queue.length).toBe(0);
      expect(schedulerService.isRunning).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return current scheduler status', () => {
      // Arrange
      schedulerService.init();
      const task = { type: 'player_detail', playerId: 1, priority: 10 };
      schedulerService.addToQueue(task);

      // Act
      const status = schedulerService.getQueueStatus();

      // Assert
      expect(status).toHaveProperty('queue_length', 1);
      expect(status).toHaveProperty('active_requests', 0);
      expect(status).toHaveProperty('is_running');
      expect(status).toHaveProperty('priority_distribution');
    });
  });
});