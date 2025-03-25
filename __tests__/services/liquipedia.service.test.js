// At the top of the file:
jest.mock('../../src/services/scheduler.service', () => 
  require('../mocks/scheduler.service.mock')
);

// __tests__/services/liquipedia.service.test.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../../src/models');
const LiquipediaService = require('../../src/services/liquipedia.service');
const scheduler = require('../../src/services/scheduler.service');

// Mock dependencies
jest.mock('axios');
jest.mock('cheerio');
jest.mock('../../src/models', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  },
  Sequelize: {
    Op: {
      in: Symbol.for('in'),
      lt: Symbol.for('lt'),
      or: Symbol.for('or')
    },
    literal: jest.fn().mockReturnValue('mocked-literal')
  },
  Player: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn().mockResolvedValue([1])
  }
}));

jest.mock('../../src/services/scheduler.service', () => ({
  addToQueue: jest.fn()
}));

describe('LiquipediaService', () => {
  let service;
  let mock$;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LiquipediaService();
    
    // Setup cheerio mock
    mock$ = {
      find: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnValue('Test Text'),
      attr: jest.fn().mockReturnValue('Test URL'),
      each: jest.fn().mockImplementation((callback) => {
        callback(0, {});
      })
    };
    cheerio.load.mockReturnValue(mock$);
  });

  describe('Rate Limiting', () => {
    test('respectRateLimit should enforce rate limits based on last request time', async () => {
      const startTime = Date.now();
      await service.respectRateLimit();
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('API Interaction', () => {
    test('makeRequest should send a GET request with the correct headers', async () => {
      const mockResponse = { data: '<html>Test data</html>' };
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await service.makeRequest('https://liquipedia.net/test');
      
      expect(axios.get).toHaveBeenCalledWith('https://liquipedia.net/test', {
        headers: expect.objectContaining({
          'User-Agent': expect.any(String)
        })
      });
      expect(result).toBe(mockResponse.data);
    });

    test('searchPlayer should find and return player results', async () => {
      const mockHtml = '<html><div class="results">Test Player</div></html>';
      axios.get.mockResolvedValue({ data: mockHtml });
      
      const results = await service.searchPlayer('Test Player');
      
      expect(results).toEqual([
        expect.objectContaining({
          title: 'Test Player',
          url: expect.stringContaining('liquipedia.net')
        })
      ]);
    });
  });

  describe('Earnings Data', () => {
    test('getPlayerEarnings should extract earnings data from a player page', async () => {
      const mockHtml = `
        <html>
          <div class="infobox">
            <div class="prizepool">$50,000</div>
            <div class="tournament">Test Tournament 2023</div>
            <div class="tournament">Test Tournament 2024</div>
          </div>
        </html>
      `;
      axios.get.mockResolvedValue({ data: mockHtml });
      
      mock$.find.mockImplementation((selector) => {
        if (selector === '.prizepool') {
          return { text: () => '$50,000' };
        }
        if (selector === '.tournament') {
          return {
            each: (callback) => {
              callback(0, { text: () => 'Test Tournament 2023' });
              callback(1, { text: () => 'Test Tournament 2024' });
            }
          };
        }
        return { text: () => '' };
      });
      
      const earnings = await service.getPlayerEarnings('https://liquipedia.net/valorant/TestPlayer');
      
      expect(earnings).toHaveProperty('total', 50000);
      expect(earnings).toHaveProperty('by_year');
      expect(earnings.by_year).toHaveProperty('2023', 30000);
      expect(earnings.by_year).toHaveProperty('2024', 20000);
    });

    test('updatePlayerEarnings should save earnings data to the database', async () => {
      const playerId = 'test-id';
      const earnings = {
        total: 50000,
        by_year: { '2023': 30000, '2024': 20000 }
      };
      
      db.Player.findByPk.mockResolvedValue({ id: playerId });
      
      const result = await service.updatePlayerEarnings(playerId, earnings);
      
      expect(db.Player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          earnings_total: 50000,
          earnings_by_year: earnings.by_year,
          earnings_last_updated: expect.any(Date)
        }),
        expect.objectContaining({
          where: { id: playerId }
        })
      );
      expect(result).toBe(true);
    });

    test('processPlayerEarnings should search for player, get earnings, and update database', async () => {
      const playerId = 'test-id';
      const mockPlayer = { id: playerId, name: 'Test Player' };
      const mockEarnings = { total: 50000, by_year: { '2023': 50000 } };
      
      db.Player.findByPk.mockResolvedValue(mockPlayer);
      service.searchPlayer = jest.fn().mockResolvedValue([{ url: 'https://liquipedia.net/valorant/TestPlayer' }]);
      service.getPlayerEarnings = jest.fn().mockResolvedValue(mockEarnings);
      service.updatePlayerEarnings = jest.fn().mockResolvedValue(true);
      
      const result = await service.processPlayerEarnings(playerId);
      
      expect(result).toEqual({
        success: true,
        player: mockPlayer,
        earnings: mockEarnings
      });
    });
  });

  describe('Queue Management', () => {
    test('queueEarningsUpdates should find players and add them to the queue', async () => {
      const mockPlayers = [
        { id: '1', division: 'T1' },
        { id: '2', division: 'T2' }
      ];
      
      db.Player.findAll.mockResolvedValue(mockPlayers);
      
      await service.queueEarningsUpdates();
      
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            division: { [db.Sequelize.Op.in]: ['T1', 'T2'] }
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('processPlayerEarnings should handle player not found', async () => {
      db.Player.findByPk.mockResolvedValue(null);
      
      const result = await service.processPlayerEarnings('non-existent-id');
      
      expect(result).toEqual({
        success: false,
        error: 'Player not found: non-existent-id'
      });
    });

    test('searchPlayer should handle search failure gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Search failed'));
      
      const results = await service.searchPlayer('Non-existent Player');
      
      expect(results).toEqual([]);
    });

    test('updatePlayerEarnings should handle database errors', async () => {
      const playerId = 'test-id';
      const earnings = { total: 50000 };
      
      db.Player.findByPk.mockResolvedValue({ id: playerId });
      db.Player.update.mockRejectedValue(new Error('Database error'));
      
      const result = await service.updatePlayerEarnings(playerId, earnings);
      
      expect(result).toBe(false);
    });
  });
});