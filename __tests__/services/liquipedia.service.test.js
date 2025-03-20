// At the top of the file:
jest.mock('../../src/services/scheduler.service', () => 
  require('../mocks/scheduler.service.mock')
);

// __tests__/services/liquipedia.service.test.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../../src/models');
const liquipediaService = require('../../src/services/liquipedia.service');
const scheduler = require('../../src/services/scheduler.service');

// Mock dependencies
jest.mock('axios');
jest.mock('cheerio', () => ({
  load: jest.fn().mockReturnValue({
    text: jest.fn().mockReturnValue('MockText'),
    next: jest.fn().mockReturnValue({ text: jest.fn().mockReturnValue('$50,000') }),
    find: jest.fn().mockReturnValue({
      next: jest.fn().mockReturnValue({ text: jest.fn().mockReturnValue('$50,000') }),
      text: jest.fn().mockReturnValue('MockText'),
      each: jest.fn().mockImplementation((callback) => {
        callback(0, { find: jest.fn().mockReturnValue({ text: jest.fn().mockReturnValue('2023') }) });
        callback(1, { find: jest.fn().mockReturnValue({ text: jest.fn().mockReturnValue('2024') }) });
      }),
      first: jest.fn().mockReturnValue({ text: jest.fn().mockReturnValue('Tournament Name') })
    })
  })
}));

jest.mock('../../src/models', () => ({
  Player: { findByPk: jest.fn(), findAll: jest.fn(), update: jest.fn() },
  sequelize: { literal: jest.fn().mockReturnValue('mocked-literal') },
  Sequelize: { Op: { in: 'in', notIn: 'notIn' } }
}));

jest.mock('../../src/services/scheduler.service', () => ({
  addToQueue: jest.fn()
}));

describe('LiquipediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    liquipediaService.lastRequestTime = 0;
  });

  describe('Rate Limiting', () => {
    test('respectRateLimit should enforce rate limits based on last request time', async () => {
      // Setup - mock current time and setTimeout
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // First call
        .mockReturnValueOnce(now + 3000); // Second call, after "waiting"
      
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((cb, ms) => cb());
      
      // Execute - check with regular delay
      await liquipediaService.respectRateLimit(false);
      
      // Verify
      expect(global.setTimeout).not.toHaveBeenCalled(); // Should not need to wait
      
      // Setup - set last request time to now
      liquipediaService.lastRequestTime = now;
      
      // Execute - check with regular delay but need to wait
      await liquipediaService.respectRateLimit(false);
      
      // Verify
      expect(global.setTimeout).toHaveBeenCalled();
      
      // Restore original implementation
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('API Interaction', () => {
    test('makeRequest should send a GET request with the correct headers', async () => {
      // Setup
      const mockResponse = { data: 'mock data' };
      axios.get.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await liquipediaService.makeRequest('https://liquipedia.net/valorant/test');
      
      // Verify
      expect(axios.get).toHaveBeenCalledWith('https://liquipedia.net/valorant/test', {
        headers: expect.objectContaining({
          'User-Agent': expect.any(String)
        })
      });
      expect(result).toBe('mock data');
    });

    test('searchPlayer should find and return player results', async () => {
      // Setup - mock API response for player search
      const mockSearchResponse = [
        'SearchTerm',
        ['TenZ', 'Shroud'],
        ['', ''],
        ['https://liquipedia.net/valorant/TenZ', 'https://liquipedia.net/valorant/Shroud']
      ];
      
      axios.get.mockResolvedValue({ data: mockSearchResponse });
      
      // Execute
      const results = await liquipediaService.searchPlayer('TenZ');
      
      // Verify
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('action=opensearch&search=TenZ'),
        expect.anything()
      );
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('title', 'TenZ');
      expect(results[0]).toHaveProperty('url', 'https://liquipedia.net/valorant/TenZ');
    });
  });

  describe('Earnings Data', () => {
    test('getPlayerEarnings should extract earnings data from a player page', async () => {
      // Setup - mock API response for player page
      const mockApiResponse = {
        parse: {
          text: {
            '*': '<html><div class="infobox-cell-2">Approx. Total Earnings:</div><div>$50,000</div>' +
                 '<h3>Earnings By Year</h3><div class="table-responsive"><tbody><tr><td>2023</td><td>$30,000</td></tr>' +
                 '<tr><td>2024</td><td>$20,000</td></tr></tbody></div>' +
                 '<h3>Achievements</h3><div class="table-responsive"><tbody><tr>' +
                 '<td>2023-05-01</td><td>1st</td><td><a>VCT Americas</a></td><td>$10,000</td><td>Team X</td>' +
                 '</tr></tbody></div></html>'
          }
        }
      };
      
      axios.get.mockResolvedValue({ data: mockApiResponse });
      
      // Execute
      const earnings = await liquipediaService.getPlayerEarnings('https://liquipedia.net/valorant/TenZ');
      
      // Verify
      expect(axios.get).toHaveBeenCalled();
      expect(earnings).toHaveProperty('total', 50000);
      expect(earnings).toHaveProperty('by_year');
      expect(earnings.by_year).toHaveProperty('2023', 30000);
      expect(earnings.by_year).toHaveProperty('2024', 20000);
      expect(earnings).toHaveProperty('tournaments');
      expect(earnings.tournaments).toHaveLength(1);
    });

    test('updatePlayerEarnings should save earnings data to the database', async () => {
      // Setup
      const mockPlayer = {
        update: jest.fn().mockResolvedValue(true)
      };
      
      db.Player.findByPk.mockResolvedValue(mockPlayer);
      
      const earningsData = {
        total: 50000,
        by_year: { '2023': 30000, '2024': 20000 },
        tournaments: [
          { tournament: 'VCT Americas', prize: 10000, placement: '1st' }
        ]
      };
      
      // Execute
      const result = await liquipediaService.updatePlayerEarnings('player-id', earningsData);
      
      // Verify
      expect(db.Player.findByPk).toHaveBeenCalledWith('player-id');
      expect(mockPlayer.update).toHaveBeenCalledWith({
        total_earnings: 50000,
        earnings_by_year: JSON.stringify({ '2023': 30000, '2024': 20000 }),
        tournament_earnings: JSON.stringify([
          { tournament: 'VCT Americas', prize: 10000, placement: '1st' }
        ]),
        earnings_last_updated: expect.any(Date)
      });
      expect(result).toBe(true);
    });

    test('processPlayerEarnings should search for player, get earnings, and update database', async () => {
      // Setup
      const mockPlayer = { id: 'player-id', name: 'TenZ' };
      db.Player.findByPk.mockResolvedValue(mockPlayer);
      
      const mockSearchResults = [
        { title: 'TenZ', url: 'https://liquipedia.net/valorant/TenZ' }
      ];
      
      const mockEarnings = {
        total: 50000,
        by_year: { '2023': 30000, '2024': 20000 },
        tournaments: [{ tournament: 'VCT', prize: 10000 }]
      };
      
      // Mock the service methods
      jest.spyOn(liquipediaService, 'searchPlayer').mockResolvedValue(mockSearchResults);
      jest.spyOn(liquipediaService, 'getPlayerEarnings').mockResolvedValue(mockEarnings);
      jest.spyOn(liquipediaService, 'updatePlayerEarnings').mockResolvedValue(true);
      
      // Execute
      const result = await liquipediaService.processPlayerEarnings('player-id');
      
      // Verify
      expect(db.Player.findByPk).toHaveBeenCalledWith('player-id');
      expect(liquipediaService.searchPlayer).toHaveBeenCalledWith('TenZ');
      expect(liquipediaService.getPlayerEarnings).toHaveBeenCalledWith('https://liquipedia.net/valorant/TenZ');
      expect(liquipediaService.updatePlayerEarnings).toHaveBeenCalledWith('player-id', mockEarnings);
      expect(result).toEqual({
        success: true,
        player_name: 'TenZ',
        total_earnings: 50000,
        tournaments_count: 1
      });
    });
  });

  describe('Queue Management', () => {
    test('queueEarningsUpdates should find players and add them to the queue', async () => {
      // Setup
      const mockPlayers = [
        { id: 'player1', name: 'Player1', division: 'T1', rating: 1.5 },
        { id: 'player2', name: 'Player2', division: 'T2', rating: 1.3 }
      ];
      
      db.Player.findAll.mockResolvedValue(mockPlayers);
      
      // Execute
      const result = await liquipediaService.queueEarningsUpdates({
        limit: 10,
        divisions: ['T1', 'T2'],
        minDaysSinceUpdate: 30
      });
      
      // Verify
      expect(db.Player.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          division: { [db.Sequelize.Op.in]: ['T1', 'T2'] }
        }),
        limit: 10
      }));
      
      // Should have added tasks to scheduler queue
      expect(scheduler.addToQueue).toHaveBeenCalledTimes(2);
      expect(scheduler.addToQueue).toHaveBeenCalledWith(expect.objectContaining({
        type: 'player_earnings',
        playerId: 'player1'
      }));
      expect(scheduler.addToQueue).toHaveBeenCalledWith(expect.objectContaining({
        type: 'player_earnings',
        playerId: 'player2'
      }));
      
      expect(result).toEqual({
        success: true,
        queued_players: 2,
        divisions: ['T1', 'T2']
      });
    });
  });

  describe('Error Handling', () => {
    test('processPlayerEarnings should handle player not found', async () => {
      // Setup - player not found
      db.Player.findByPk.mockResolvedValue(null);
      
      // Execute
      const result = await liquipediaService.processPlayerEarnings('non-existent-id');
      
      // Verify
      expect(result).toEqual({
        success: false,
        error: 'Player not found: non-existent-id'
      });
    });

    test('searchPlayer should handle search failure gracefully', async () => {
      // Setup - API error
      axios.get.mockRejectedValue(new Error('API Error'));
      
      // Execute
      const results = await liquipediaService.searchPlayer('ErrorPlayer');
      
      // Verify
      expect(results).toEqual([]);
    });

    test('updatePlayerEarnings should handle database errors', async () => {
      // Setup - database error
      db.Player.findByPk.mockResolvedValue(null);
      
      // Execute
      const result = await liquipediaService.updatePlayerEarnings('player-id', {});
      
      // Verify
      expect(result).toBe(false);
    });
  });
});