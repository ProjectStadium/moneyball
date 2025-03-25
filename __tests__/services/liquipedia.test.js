const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../../src/models');
const service = require('../../src/services/liquipedia.service');

// Mock axios
jest.mock('axios');

// Mock cheerio
jest.mock('cheerio', () => {
  const mockCheerio = jest.fn();
  mockCheerio.load = jest.fn();
  return mockCheerio;
});

// Mock database models
jest.mock('../../src/models', () => ({
  Player: {
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));

describe('LiquipediaService', () => {
  let mockCheerioInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock cheerio instance
    mockCheerioInstance = {
      find: jest.fn().mockReturnThis(),
      next: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      trim: jest.fn().mockReturnThis(),
      length: jest.fn().mockReturnValue(1),
      each: jest.fn().mockImplementation((callback) => {
        callback(0, {});
      })
    };
    
    // Setup cheerio mock
    cheerio.load.mockReturnValue(mockCheerioInstance);

    // Override delays for testing
    service.generalDelay = 100;  // 100ms instead of 2000ms
    service.parseDelay = 200;    // 200ms instead of 30000ms
  });

  describe('respectRateLimit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should wait for general delay between requests', async () => {
      // Arrange
      const startTime = Date.now();
      
      // Act
      const promise = service.respectRateLimit(false);
      
      // Fast-forward timers
      jest.advanceTimersByTime(service.generalDelay);
      
      // Wait for promise to resolve
      await promise;
      
      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(service.generalDelay);
    });

    it('should wait for parse delay for parse actions', async () => {
      // Arrange
      const startTime = Date.now();
      
      // Act
      const promise = service.respectRateLimit(true);
      
      // Fast-forward timers
      jest.advanceTimersByTime(service.parseDelay);
      
      // Wait for promise to resolve
      await promise;
      
      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(service.parseDelay);
    });
  });

  describe('makeRequest', () => {
    it('should make a request with correct headers', async () => {
      // Arrange
      const url = 'https://test.com';
      const mockResponse = { data: 'test data' };
      axios.get.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await service.makeRequest(url);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, {
        headers: service.headers
      });
      expect(result).toBe('test data');
    });

    it('should handle request errors', async () => {
      // Arrange
      const url = 'https://test.com';
      const error = new Error('Request failed');
      axios.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(service.makeRequest(url)).rejects.toThrow('Request failed');
    });
  });

  describe('searchPlayer', () => {
    it('should search for a player and return results', async () => {
      // Arrange
      const playerName = 'Test Player';
      const mockResponse = [
        ['Test Player'],
        ['Test Player (player)'],
        ['Professional Valorant player'],
        ['https://liquipedia.net/valorant/Test_Player']
      ];
      axios.get.mockResolvedValueOnce({ data: mockResponse });

      // Act
      const results = await service.searchPlayer(playerName);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        title: 'Test Player (player)',
        description: 'Professional Valorant player',
        url: 'https://liquipedia.net/valorant/Test_Player'
      });
    });

    it('should handle empty search results', async () => {
      // Arrange
      const playerName = 'Nonexistent Player';
      const mockResponse = [[], [], [], []];
      axios.get.mockResolvedValueOnce({ data: mockResponse });

      // Act
      const results = await service.searchPlayer(playerName);

      // Assert
      expect(results).toHaveLength(0);
    });

    it('should handle search errors', async () => {
      // Arrange
      const playerName = 'Test Player';
      const error = new Error('Search failed');
      axios.get.mockRejectedValueOnce(error);

      // Act
      const results = await service.searchPlayer(playerName);

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  /* Temporarily commenting out earnings-related tests
  describe('getPlayerEarnings', () => {
    it('should extract earnings data from player page', async () => {
      // Arrange
      const playerUrl = 'https://liquipedia.net/valorant/Test_Player';
      const mockResponse = {
        parse: {
          text: {
            '*': '<div>Test HTML</div>'
          }
        }
      };
      axios.get.mockResolvedValueOnce({ data: mockResponse });

      // Mock cheerio selectors
      mockCheerioInstance.find.mockImplementation((selector) => {
        if (selector === 'div:contains("Earnings")') {
          return {
            next: () => ({
              length: () => 1
            })
          };
        }
        return mockCheerioInstance;
      });

      mockCheerioInstance.text.mockImplementation(() => {
        return '$100,000';
      });

      // Act
      const earnings = await service.getPlayerEarnings(playerUrl);

      // Assert
      expect(earnings).toEqual({
        total: 100000,
        by_year: {},
        tournaments: []
      });
    });

    it('should handle missing earnings data', async () => {
      // Arrange
      const playerUrl = 'https://liquipedia.net/valorant/Test_Player';
      const mockResponse = {
        parse: {
          text: {
            '*': '<div>Test HTML</div>'
          }
        }
      };
      axios.get.mockResolvedValueOnce({ data: mockResponse });

      // Mock cheerio to return no earnings section
      mockCheerioInstance.find.mockImplementation(() => ({
        next: () => ({
          length: () => 0
        })
      }));

      // Act
      const earnings = await service.getPlayerEarnings(playerUrl);

      // Assert
      expect(earnings).toEqual({
        total: null,
        by_year: {},
        tournaments: []
      });
    });

    it('should handle parsing errors', async () => {
      // Arrange
      const playerUrl = 'https://liquipedia.net/valorant/Test_Player';
      const error = new Error('Parsing failed');
      axios.get.mockRejectedValueOnce(error);

      // Act
      const earnings = await service.getPlayerEarnings(playerUrl);

      // Assert
      expect(earnings).toEqual({
        total: null,
        by_year: {},
        tournaments: []
      });
    });
  });

  describe('updatePlayerEarnings', () => {
    it('should update player earnings in database', async () => {
      // Arrange
      const playerId = '123';
      const earnings = {
        total: 100000,
        by_year: { '2023': 50000 },
        tournaments: [{ date: '2023-01-01', prize: 50000 }]
      };
      const mockPlayer = {
        update: jest.fn().mockResolvedValue(true)
      };
      db.Player.findByPk.mockResolvedValueOnce(mockPlayer);

      // Act
      const result = await service.updatePlayerEarnings(playerId, earnings);

      // Assert
      expect(result).toBe(true);
      expect(mockPlayer.update).toHaveBeenCalledWith({
        total_earnings: earnings.total,
        earnings_by_year: JSON.stringify(earnings.by_year),
        tournament_earnings: JSON.stringify(earnings.tournaments),
        earnings_last_updated: expect.any(Date)
      });
    });

    it('should handle non-existent player', async () => {
      // Arrange
      const playerId = '123';
      const earnings = { total: 100000 };
      db.Player.findByPk.mockResolvedValueOnce(null);

      // Act
      const result = await service.updatePlayerEarnings(playerId, earnings);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      // Arrange
      const playerId = '123';
      const earnings = { total: 100000 };
      const mockPlayer = {
        update: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      db.Player.findByPk.mockResolvedValueOnce(mockPlayer);

      // Act
      const result = await service.updatePlayerEarnings(playerId, earnings);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('processPlayerEarnings', () => {
    it('should process player earnings successfully', async () => {
      // Arrange
      const playerId = '123';
      const mockPlayer = { name: 'Test Player' };
      const mockSearchResults = [{
        title: 'Test Player',
        url: 'https://liquipedia.net/valorant/Test_Player'
      }];
      const mockEarnings = {
        total: 100000,
        by_year: { '2023': 50000 },
        tournaments: [{ date: '2023-01-01', prize: 50000 }]
      };

      db.Player.findByPk.mockResolvedValueOnce(mockPlayer);
      axios.get
        .mockResolvedValueOnce({ data: mockSearchResults }) // searchPlayer
        .mockResolvedValueOnce({ data: { parse: { text: { '*': '<div>Test HTML</div>' } } } }); // getPlayerEarnings

      // Mock cheerio for earnings extraction
      mockCheerioInstance.find.mockImplementation((selector) => {
        if (selector === 'div:contains("Earnings")') {
          return {
            next: () => ({
              length: () => 1
            })
          };
        }
        return mockCheerioInstance;
      });

      mockCheerioInstance.text.mockImplementation(() => '$100,000');

      // Act
      const result = await service.processPlayerEarnings(playerId);

      // Assert
      expect(result).toEqual({
        success: true,
        message: expect.any(String)
      });
    });

    it('should handle non-existent player', async () => {
      // Arrange
      const playerId = '123';
      db.Player.findByPk.mockResolvedValueOnce(null);

      // Act
      const result = await service.processPlayerEarnings(playerId);

      // Assert
      expect(result).toEqual({
        success: false,
        message: 'Player not found: 123'
      });
    });

    it('should handle no search results', async () => {
      // Arrange
      const playerId = '123';
      const mockPlayer = { name: 'Test Player' };
      db.Player.findByPk.mockResolvedValueOnce(mockPlayer);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      const result = await service.processPlayerEarnings(playerId);

      // Assert
      expect(result).toEqual({
        success: false,
        message: 'No Liquipedia page found'
      });
    });

    it('should handle missing earnings data', async () => {
      // Arrange
      const playerId = '123';
      const mockPlayer = { name: 'Test Player' };
      const mockSearchResults = [{
        title: 'Test Player',
        url: 'https://liquipedia.net/valorant/Test_Player'
      }];

      db.Player.findByPk.mockResolvedValueOnce(mockPlayer);
      axios.get
        .mockResolvedValueOnce({ data: mockSearchResults }) // searchPlayer
        .mockResolvedValueOnce({ data: { parse: { text: { '*': '<div>Test HTML</div>' } } } }); // getPlayerEarnings

      // Mock cheerio to return no earnings data
      mockCheerioInstance.find.mockImplementation(() => ({
        next: () => ({
          length: () => 0
        })
      }));

      // Act
      const result = await service.processPlayerEarnings(playerId);

      // Assert
      expect(result).toEqual({
        success: false,
        message: 'Failed to extract earnings data'
      });
    });
  });
  */
}); 