// __tests__/integration/data-flow.test.js
const request = require('supertest');
const db = require('../../src/models');
const app = require('../../src/app');
const importDataUtil = require('../../src/utils/importData');
const scraperService = require('../../src/services/scraper.service');
const schedulerService = require('../../src/services/scheduler.service');

// Mock dependencies
jest.mock('../../src/utils/importData');
jest.mock('../../src/services/scraper.service');
jest.mock('../../src/services/scheduler.service');

describe('Data Flow Integration Tests', () => {
  // Sample data for testing
  const sampleTeam = {
    id: 'team-id-1',
    team_abbreviation: 'TST',
    full_team_name: 'Test Team',
    region: 'NA',
    country: 'USA',
    rank: 10
  };

  const samplePlayers = [
    {
      id: 'player-id-1',
      name: 'Player1',
      team_abbreviation: 'TST',
      is_free_agent: false,
      rating: 1.2,
      acs: 240,
      kd_ratio: 1.1
    },
    {
      id: 'player-id-2',
      name: 'Player2',
      team_abbreviation: null,
      is_free_agent: true,
      rating: 1.3,
      acs: 250,
      kd_ratio: 1.2
    }
  ];

  beforeAll(async () => {
    // Set up database with test data
    await db.sequelize.sync({ force: true });

    // Mock implementations
    importDataUtil.importAllData.mockResolvedValue({ success: true });
    scraperService.scrapeAllPlayers.mockResolvedValue(2);
    schedulerService.updatePlayerDetails.mockResolvedValue({ success: true });
  });

  // Clean up after tests
  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    // Reset database before each test
    await db.Team.destroy({ where: {}, truncate: true, cascade: true });
    await db.Player.destroy({ where: {}, truncate: true, cascade: true });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  // Test end-to-end data import and retrieval
  test('should import data and make it available through API', async () => {
    // Mock specific data for this test
    importDataUtil.importAllData.mockImplementationOnce(async () => {
      // Directly create test data in the database
      await db.Team.create(sampleTeam);
      await db.Player.bulkCreate(samplePlayers);
      return { success: true };
    });

    // Step 1: Import data
    await importDataUtil.importAllData();

    // Step 2: Verify data through the team API
    const teamResponse = await request(app)
      .get('/api/teams/TST')
      .expect(200);

    expect(teamResponse.body).toMatchObject({
      team_abbreviation: 'TST',
      full_team_name: 'Test Team'
    });

    // Step 3: Verify data through the player API
    const playersResponse = await request(app)
      .get('/api/players?team_abbreviation=TST')
      .expect(200);

    expect(playersResponse.body.total).toBe(1);
    expect(playersResponse.body.data[0]).toMatchObject({
      name: 'Player1',
      team_abbreviation: 'TST'
    });

    // Step 4: Verify free agent filter
    const freeAgentsResponse = await request(app)
      .get('/api/players/free-agents')
      .expect(200);

    expect(freeAgentsResponse.body.total).toBe(1);
    expect(freeAgentsResponse.body.data[0]).toMatchObject({
      name: 'Player2',
      is_free_agent: true
    });
  });

  // Test player analysis flow
  test('should analyze player data and provide insights', async () => {
    // Setup sample data
    await db.Team.create(sampleTeam);
    await db.Player.bulkCreate(samplePlayers);

    // Step 1: Get player by ID
    const playerResponse = await request(app)
      .get('/api/players/player-id-1')
      .expect(200);

    expect(playerResponse.body).toMatchObject({
      name: 'Player1',
      team_abbreviation: 'TST'
    });

    // Step 2: Analyze similar players
    const similarPlayersResponse = await request(app)
      .get('/api/analysis/players/similar/player-id-1')
      .expect(200);

    expect(similarPlayersResponse.body).toHaveProperty('target_player');
    expect(similarPlayersResponse.body).toHaveProperty('similar_players');

    // Step 3: Get player valuation
    const valuationResponse = await request(app)
      .get('/api/analysis/players/valuation/player-id-1')
      .expect(200);

    expect(valuationResponse.body).toHaveProperty('player');
    expect(valuationResponse.body).toHaveProperty('valuation_factors');
  });

  // Test free agent market analysis flow
  test('should provide market analysis for free agents', async () => {
    // Setup sample data with multiple free agents
    await db.Team.create(sampleTeam);
    
    // Add more varied players for analysis
    const testPlayers = [
      ...samplePlayers,
      {
        id: 'player-id-3',
        name: 'FreeAgent2',
        team_abbreviation: null,
        is_free_agent: true,
        rating: 1.1,
        acs: 230,
        kd_ratio: 1.0,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Duelist': 80, 'Controller': 10, 'Sentinel': 5, 'Initiator': 5 }
        }),
        division: 'T2'
      },
      {
        id: 'player-id-4',
        name: 'FreeAgent3',
        team_abbreviation: null,
        is_free_agent: true,
        rating: 1.0,
        acs: 220,
        kd_ratio: 0.9,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Controller': 75, 'Duelist': 5, 'Sentinel': 10, 'Initiator': 10 }
        }),
        division: 'T3'
      }
    ];
    
    await db.Player.bulkCreate(testPlayers);

    // Step 1: Get free agent market analysis
    const marketAnalysisResponse = await request(app)
      .get('/api/analysis/market/free-agents')
      .expect(200);

    expect(marketAnalysisResponse.body).toHaveProperty('total_free_agents');
    expect(marketAnalysisResponse.body).toHaveProperty('market_stats');
    expect(marketAnalysisResponse.body).toHaveProperty('talent_distribution');
    expect(marketAnalysisResponse.body).toHaveProperty('role_distribution');
    expect(marketAnalysisResponse.body).toHaveProperty('top_prospects');
    
    // Should have 3 free agents
    expect(marketAnalysisResponse.body.total_free_agents).toBe(3);

    // Step 2: Filter market analysis by role
    const roleFilteredResponse = await request(app)
      .get('/api/analysis/market/free-agents?role=Controller')
      .expect(200);

    // Should have fewer players when filtered by role
    expect(roleFilteredResponse.body.total_free_agents).toBeLessThan(3);
  });

  // Test roster generation flow
  test('should generate optimal roster based on available free agents', async () => {
    // Setup a pool of free agents with various roles
    const freeAgentPool = [
      {
        id: 'fa-1',
        name: 'Duelist1',
        is_free_agent: true,
        rating: 1.3,
        acs: 260,
        kd_ratio: 1.4,
        estimated_value: 3000,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Duelist': 90, 'Controller': 5, 'Sentinel': 0, 'Initiator': 5 }
        })
      },
      {
        id: 'fa-2',
        name: 'Controller1',
        is_free_agent: true,
        rating: 1.2,
        acs: 230,
        kd_ratio: 1.1,
        estimated_value: 2500,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Controller': 85, 'Duelist': 5, 'Sentinel': 5, 'Initiator': 5 }
        })
      },
      {
        id: 'fa-3',
        name: 'Sentinel1',
        is_free_agent: true,
        rating: 1.1,
        acs: 210,
        kd_ratio: 1.0,
        estimated_value: 2000,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Sentinel': 80, 'Duelist': 5, 'Controller': 5, 'Initiator': 10 }
        })
      },
      {
        id: 'fa-4',
        name: 'Initiator1',
        is_free_agent: true,
        rating: 1.2,
        acs: 240,
        kd_ratio: 1.2,
        estimated_value: 2700,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Initiator': 80, 'Duelist': 10, 'Controller': 5, 'Sentinel': 5 }
        })
      },
      {
        id: 'fa-5',
        name: 'Flex1',
        is_free_agent: true,
        rating: 1.1,
        acs: 220,
        kd_ratio: 1.1,
        estimated_value: 2300,
        playstyle: JSON.stringify({ 
          role_percentages: { 'Duelist': 35, 'Controller': 25, 'Sentinel': 20, 'Initiator': 20 }
        })
      }
    ];
    
    await db.Player.bulkCreate(freeAgentPool);

    // Generate a roster with budget constraint
    const rosterResponse = await request(app)
      .get('/api/analysis/roster/generate?budget=15000')
      .expect(200);

    expect(rosterResponse.body).toHaveProperty('roster');
    expect(rosterResponse.body).toHaveProperty('team_stats');
    expect(rosterResponse.body).toHaveProperty('total_cost');
    expect(rosterResponse.body).toHaveProperty('budget_remaining');
    
    // Should have 5 players in the roster
    expect(rosterResponse.body.roster.length).toBe(5);
    
    // Total cost should be within budget
    expect(rosterResponse.body.total_cost).toBeLessThanOrEqual(15000);
    
    // Should optimize for balanced roles
    expect(rosterResponse.body.team_stats.role_coverage.length).toBeGreaterThanOrEqual(4);
  });

  // Test admin endpoints for data refresh
  test('should trigger data refresh through admin endpoint', async () => {
    // Mock the scheduler response
    schedulerService.triggerFullRefresh.mockResolvedValue({
      success: true,
      message: 'Full data refresh scheduled'
    });

    // Call admin endpoint to trigger refresh
    const refreshResponse = await request(app)
      .post('/api/admin/scraper/refresh')
      .send({ pages: 3, detailed: true })
      .expect(200);

    expect(refreshResponse.body).toEqual({
      success: true,
      message: 'Full data refresh scheduled'
    });

    // Verify scheduler was called with correct parameters
    expect(schedulerService.triggerFullRefresh).toHaveBeenCalledWith({
      pages: 3,
      detailed: true
    });
  });

  // Test error handling in data flow
  test('should handle errors gracefully', async () => {
    // Mock failure in scraper service
    scraperService.scrapeAllPlayers.mockRejectedValue(new Error('Scraping error'));
    
    // Simulate error by calling non-existent endpoint
    const errorResponse = await request(app)
      .get('/api/players/non-existent-id')
      .expect(404);

    expect(errorResponse.body).toHaveProperty('message');
    
    // Scheduler should handle errors
    schedulerService.updatePlayerDetails.mockResolvedValue({
      success: false,
      error: 'Player not found'
    });
    
    const badUpdateResponse = await request(app)
      .post('/api/admin/scraper/player/non-existent')
      .expect(400);
      
    expect(badUpdateResponse.body.success).toBe(false);
  });
});