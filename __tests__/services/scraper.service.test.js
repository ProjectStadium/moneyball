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

describe('ValorantScraper Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test makeRequest method
  test('makeRequest should call axios with correct parameters', async () => {
    // Setup
    const mockResponse = { data: 'mock html content' };
    axios.get.mockResolvedValue(mockResponse);
    
    // Execute
    const result = await scraperService.makeRequest('https://www.vlr.gg/test');
    
    // Verify
    expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/test', expect.objectContaining({
      headers: expect.objectContaining({
        'User-Agent': expect.any(String)
      })
    }));
    expect(result).toBe('mock html content');
  });

  // Test makeRequest error handling
  test('makeRequest should handle errors properly', async () => {
    // Setup
    axios.get.mockRejectedValue(new Error('Network Error'));
    
    // Execute & Verify
    await expect(scraperService.makeRequest('https://www.vlr.gg/error')).rejects.toThrow('Network Error');
  });

  // Test scrapePlayerList method
  test('scrapePlayerList should parse player data correctly', async () => {
    // Setup - Mock the HTML response with player data
    const mockHtml = `
      <div class="wf-card">
        <div class="mod-player"><a href="/player/123">TestPlayer</a><img src="/img/player.jpg"></div>
        <div class="mod-team">Test Team</div>
        <div class="stats-player-country">Test Country</div>
        <div class="mod-flag mod-US"></div>
        <div class="stats-center">250</div>
        <div class="stats-center">1.2</div>
        <div class="stats-center">150</div>
        <div class="stats-center">0.8</div>
        <div class="stats-center">0.6</div>
        <div class="stats-center">0.15</div>
        <div class="stats-center">0.12</div>
        <div class="stats-center">25%</div>
      </div>
    `;
    
    axios.get.mockResolvedValue({ data: mockHtml });
    
    // Execute
    const players = await scraperService.scrapePlayerList(1);
    
    // Verify
    expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/stats/players?page=1', expect.anything());
    expect(players).toHaveLength(1);
    expect(players[0]).toHaveProperty('name', 'TestPlayer');
    expect(players[0]).toHaveProperty('vlr_url', '/player/123');
  });

  // Test extractPlayerFromStatsPage method
  test('extractPlayerFromStatsPage should extract player details correctly', () => {
    // Setup
    const html = `
      <div>
        <div class="mod-player"><a href="/player/123">TestPlayer</a><img src="/img/player.jpg"></div>
        <div class="mod-team">Test Team</div>
        <div class="stats-player-country">Test Country</div>
        <div class="mod-flag mod-US"></div>
        <div class="stats-center">250</div>
        <div class="stats-center">1.2</div>
        <div class="stats-center">150</div>
        <div class="stats-center">0.8</div>
        <div class="stats-center">0.6</div>
        <div class="stats-center">0.15</div>
        <div class="stats-center">0.12</div>
        <div class="stats-center">25%</div>
      </div>
    `;
    const $ = cheerio.load(html);
    const element = $('div').first();
    
    // Execute
    const player = scraperService.extractPlayerFromStatsPage($, element);
    
    // Verify
    expect(player).toHaveProperty('name', 'TestPlayer');
    expect(player).toHaveProperty('team_name', 'Test Team');
    expect(player).toHaveProperty('country_name', 'Test Country');
    expect(player).toHaveProperty('acs', 250);
    expect(player).toHaveProperty('kd_ratio', 1.2);
    expect(player).toHaveProperty('adr', 150);
    expect(player).toHaveProperty('hs_pct', 25);
  });

  // Test calculateRating method
  test('calculateRating should compute player rating correctly', () => {
    // Execute
    const rating = scraperService.calculateRating(250, 1.2, 150);
    
    // Verify - Check that result is a number with reasonable value
    expect(typeof rating).toBe('number');
    expect(rating).toBeGreaterThan(0);
    expect(rating).toBeLessThan(3); // Assuming ratings are typically between 0-2
  });

  // Test estimatePlayerValue method
  test('estimatePlayerValue should calculate player value based on stats', () => {
    // Execute
    const value = scraperService.estimatePlayerValue(250, 1.2, 150, 0.8, 0.6, 0.15, 0.12, 25);
    
    // Verify
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThan(0);
  });

  // Test scrapePlayerDetail method
  test('scrapePlayerDetail should extract detailed player information', async () => {
    // Setup - Mock HTML for a player profile page
    const mockHtml = `
      <div class="agent-stats-list">
        <tr>
          <th>Agent</th>
          <th>Time</th>
          <th>Rounds</th>
          <th>Win %</th>
          <th>ACS</th>
          <th>K:D</th>
          <th>ADR</th>
        </tr>
        <tr>
          <td>Jett</td>
          <td>10:30:45</td>
          <td>50</td>
          <td>60%</td>
          <td>250</td>
          <td>1.3</td>
          <td>160</td>
        </tr>
      </div>
      <div class="wf-card">
        <div class="mod-overview">
          <span class="event-name">VCT Champions</span>
        </div>
      </div>
    `;
    
    axios.get.mockResolvedValue({ data: mockHtml });
    
    // Execute
    const playerDetails = await scraperService.scrapePlayerDetail('/player/123');
    
    // Verify
    expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/player/123', expect.anything());
    expect(playerDetails).toHaveProperty('agent_usage');
    expect(playerDetails.agent_usage).toHaveProperty('Jett');
    expect(playerDetails).toHaveProperty('division');
    expect(playerDetails).toHaveProperty('tournament_history');
    expect(playerDetails.tournament_history).toContain('VCT Champions');
  });

  // Test determinePlaystylesFromAgents method
  test('determinePlaystylesFromAgents should analyze agent usage correctly', () => {
    // Setup - Create mock agent usage data
    const agentUsage = {
      'Jett': { playCount: 80, winRate: '60%', acs: 250 },
      'Reyna': { playCount: 20, winRate: '50%', acs: 230 }
    };
    
    // Execute
    const playstyleInfo = scraperService.determinePlaystylesFromAgents(agentUsage);
    
    // Verify
    expect(playstyleInfo).toHaveProperty('primary_roles');
    expect(playstyleInfo).toHaveProperty('traits');
    expect(playstyleInfo).toHaveProperty('role_percentages');
    expect(playstyleInfo.role_percentages).toHaveProperty('Duelist');
    // Duelist role should be dominant since both Jett and Reyna are duelists
    expect(playstyleInfo.role_percentages.Duelist).toBeGreaterThan(80);
  });

  // Test determinePlayerDivision method
  test('determinePlayerDivision should classify player tier correctly', () => {
    // Execute with different tournament histories
    const t1Division = scraperService.determinePlayerDivision(['VCT Masters', 'Some Other Tournament']);
    const t2Division = scraperService.determinePlayerDivision(['Challengers Ascension', 'Some Local Tournament']);
    const t3Division = scraperService.determinePlayerDivision(['Game Changers', 'College Tournament']);
    const unrankedDivision = scraperService.determinePlayerDivision(['Unknown Tournament']);
    
    // Verify
    expect(t1Division).toBe('T1');
    expect(t2Division).toBe('T2');
    expect(t3Division).toBe('T3');
    expect(unrankedDivision).toBe('Unranked');
  });

  // Test scrapeAndSavePlayerDetails method
  test('scrapeAndSavePlayerDetails should save player details to database', async () => {
    // Setup
    const mockPlayerDetails = {
      agent_usage: { 'Jett': { playCount: 50 } },
      playstyle: { primary_roles: ['Duelist (80%)'] },
      division: 'T1',
      tournament_history: ['VCT Champions']
    };
    
    // Mock the scrapePlayerDetail method to return our test data
    jest.spyOn(scraperService, 'scrapePlayerDetail').mockResolvedValue(mockPlayerDetails);
    
    // Execute
    const result = await scraperService.scrapeAndSavePlayerDetails('test-id', '/player/123');
    
    // Verify
    expect(scraperService.scrapePlayerDetail).toHaveBeenCalledWith('/player/123');
    expect(db.Player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_usage: expect.any(String),
        playstyle: expect.any(String),
        division: 'T1',
        tournament_history: expect.any(String)
      }),
      expect.objectContaining({
        where: { id: 'test-id' }
      })
    );
    expect(result).toBe(true);
  });

  // Test scrapeAllPlayers method - basic functionality
  test('scrapeAllPlayers should scrape player list and save to database', async () => {
    // Setup
    const mockPlayer = { 
      id: 'player-id', 
      name: 'TestPlayer', 
      vlr_url: '/player/123'
    };
    
    // Mock scrapePlayerList to return our test player
    jest.spyOn(scraperService, 'scrapePlayerList').mockResolvedValue([mockPlayer]);
    
    // Mock scrapeAndSavePlayerDetails to succeed
    jest.spyOn(scraperService, 'scrapeAndSavePlayerDetails').mockResolvedValue(true);
    
    // Execute - scrape 1 page with detailed info
    const result = await scraperService.scrapeAllPlayers(1, true);
    
    // Verify
    expect(scraperService.scrapePlayerList).toHaveBeenCalledWith(1);
    expect(db.Player.bulkCreate).toHaveBeenCalled();
    expect(scraperService.scrapeAndSavePlayerDetails).toHaveBeenCalledWith(
      mockPlayer.id, 
      mockPlayer.vlr_url
    );
    expect(result).toBe(1); // Should return count of players scraped
  });
});