// __tests__/services/scraper.service.test.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../../src/models');
const scraperService = require('../../src/services/scraper.service');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/models', () => {
  const mockSequelize = {
    define: jest.fn().mockReturnValue({}),
    literal: jest.fn().mockReturnValue({})
  };
  
  const mockPlayer = {
    findByPk: jest.fn(),
    update: jest.fn().mockResolvedValue([1]),
    findAll: jest.fn(),
    bulkCreate: jest.fn().mockResolvedValue([])
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
        notIn: 'notIn'
      }
    },
    Player: mockPlayer
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

jest.mock('cheerio', () => ({
  load: jest.fn()
}));

describe('Scraper Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('makeRequest', () => {
    it('should make a successful request', async () => {
      // Arrange
      const url = 'https://example.com';
      const mockResponse = {
        data: '<html>Test data</html>',
        status: 200
      };
      axios.get.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await scraperService.makeRequest(url);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, expect.any(Object));
      expect(result).toBe(mockResponse.data);
    });

    it('should handle request errors', async () => {
      // Arrange
      const url = 'https://example.com';
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(scraperService.makeRequest(url)).rejects.toThrow('Network error');
    });
  });

  describe('scrapePlayerList', () => {
    it('should parse player list correctly', async () => {
      // Arrange
      const mockHtml = `
        <div class="player-list">
          <div class="player">
            <span class="name">Test Player</span>
            <span class="team">TST</span>
            <span class="rating">1.2</span>
          </div>
        </div>
      `;
      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          root: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              map: jest.fn().mockReturnValue([{
                name: 'Test Player',
                team: 'TST',
                rating: '1.2'
              }])
            })
          })
        })
      };
      cheerio.load.mockImplementation(mockCheerio.load);

      // Act
      const players = await scraperService.scrapePlayerList(mockHtml);

      // Assert
      expect(players).toHaveLength(1);
      expect(players[0]).toMatchObject({
        name: 'Test Player',
        team: 'TST',
        rating: '1.2'
      });
    });

    it('should handle empty player list', async () => {
      // Arrange
      const mockHtml = '<div class="player-list"></div>';
      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          root: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              map: jest.fn().mockReturnValue([])
            })
          })
        })
      };
      cheerio.load.mockImplementation(mockCheerio.load);

      // Act
      const players = await scraperService.scrapePlayerList(mockHtml);

      // Assert
      expect(players).toHaveLength(0);
    });
  });

  describe('extractPlayerFromStatsPage', () => {
    it('should extract player details correctly', async () => {
      // Arrange
      const mockElement = {
        find: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue('Test Player'),
          attr: jest.fn().mockReturnValue('https://example.com/player')
        })
      };

      // Act
      const player = await scraperService.extractPlayerFromStatsPage(mockElement);

      // Assert
      expect(player).toMatchObject({
        name: 'Test Player',
        profile_url: 'https://example.com/player'
      });
    });
  });

  describe('calculateRating', () => {
    it('should calculate rating correctly', () => {
      // Arrange
      const stats = {
        acs: 250,
        kd_ratio: 1.5,
        adr: 150,
        hs_pct: 25
      };

      // Act
      const rating = scraperService.calculateRating(stats);

      // Assert
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(2.0);
    });

    it('should handle missing stats', () => {
      // Arrange
      const stats = {
        acs: 250,
        kd_ratio: null,
        adr: 150,
        hs_pct: null
      };

      // Act
      const rating = scraperService.calculateRating(stats);

      // Assert
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(2.0);
    });
  });

  describe('estimatePlayerValue', () => {
    it('should estimate player value correctly', () => {
      // Arrange
      const player = {
        rating: 1.2,
        division: 'T2',
        is_free_agent: true
      };

      // Act
      const value = scraperService.estimatePlayerValue(player);

      // Assert
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(10000);
    });

    it('should handle different divisions', () => {
      // Arrange
      const t1Player = { rating: 1.2, division: 'T1', is_free_agent: true };
      const t2Player = { rating: 1.2, division: 'T2', is_free_agent: true };

      // Act
      const t1Value = scraperService.estimatePlayerValue(t1Player);
      const t2Value = scraperService.estimatePlayerValue(t2Player);

      // Assert
      expect(t1Value).toBeGreaterThan(t2Value);
    });
  });

  describe('scrapePlayerDetail', () => {
    it('should scrape player details correctly', async () => {
      // Arrange
      const mockHtml = `
        <div class="player-detail">
          <div class="stats">
            <span class="acs">250</span>
            <span class="kd">1.5</span>
            <span class="adr">150</span>
          </div>
          <div class="agent-usage">
            <span class="agent">Jett</span>
            <span class="usage">30%</span>
          </div>
        </div>
      `;
      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          root: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              text: jest.fn().mockReturnValue('250'),
              map: jest.fn().mockReturnValue([{
                agent: 'Jett',
                usage: '30%'
              }])
            })
          })
        })
      };
      cheerio.load.mockImplementation(mockCheerio.load);

      // Act
      const details = await scraperService.scrapePlayerDetail(mockHtml);

      // Assert
      expect(details).toMatchObject({
        acs: 250,
        kd_ratio: 1.5,
        adr: 150,
        agent_usage: expect.any(Object)
      });
    });
  });

  describe('determinePlaystylesFromAgents', () => {
    it('should determine playstyles correctly', () => {
      // Arrange
      const agentUsage = {
        'Jett': 40,
        'Sova': 30,
        'Omen': 30
      };

      // Act
      const playstyles = scraperService.determinePlaystylesFromAgents(agentUsage);

      // Assert
      expect(playstyles).toHaveProperty('primary_roles');
      expect(playstyles).toHaveProperty('role_percentages');
      expect(playstyles.primary_roles).toContain('Duelist');
    });
  });

  describe('determinePlayerDivision', () => {
    it('should determine division based on tournament history', () => {
      // Arrange
      const tournamentHistory = [
        { tournament: 'VCT', placement: 1 },
        { tournament: 'VRL', placement: 2 }
      ];

      // Act
      const division = scraperService.determinePlayerDivision(tournamentHistory);

      // Assert
      expect(division).toBe('T1');
    });

    it('should handle players with no tournament history', () => {
      // Arrange
      const tournamentHistory = [];

      // Act
      const division = scraperService.determinePlayerDivision(tournamentHistory);

      // Assert
      expect(division).toBe('Unranked');
    });
  });

  describe('scrapeAndSavePlayerDetails', () => {
    it('should scrape and save player details', async () => {
      // Arrange
      const player = {
        name: 'Test Player',
        profile_url: 'https://example.com/player'
      };
      const mockHtml = '<div class="player-detail">Test data</div>';
      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          root: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              text: jest.fn().mockReturnValue('250'),
              map: jest.fn().mockReturnValue([])
            })
          })
        })
      };
      cheerio.load.mockImplementation(mockCheerio.load);

      // Act
      const result = await scraperService.scrapeAndSavePlayerDetails(player, mockHtml);

      // Assert
      expect(result).toMatchObject({
        name: 'Test Player',
        acs: expect.any(Number),
        rating: expect.any(Number)
      });
    });
  });

  describe('scrapeAllPlayers', () => {
    it('should scrape all players from a list', async () => {
      // Arrange
      const players = [
        { name: 'Player 1', profile_url: 'https://example.com/1' },
        { name: 'Player 2', profile_url: 'https://example.com/2' }
      ];
      const mockHtml = '<div class="player-detail">Test data</div>';
      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          root: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              text: jest.fn().mockReturnValue('250'),
              map: jest.fn().mockReturnValue([])
            })
          })
        })
      };
      cheerio.load.mockImplementation(mockCheerio.load);

      // Act
      const results = await scraperService.scrapeAllPlayers(players, mockHtml);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        name: expect.any(String),
        acs: expect.any(Number),
        rating: expect.any(Number)
      });
    });
  });
});