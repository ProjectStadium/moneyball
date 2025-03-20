// __tests__/routes/analysis.routes.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { samplePlayers, sampleTeams } = require('../helpers/test-data');
const { clearDatabase } = require('../helpers/teardown');

describe('Analysis API Endpoints', () => {
  beforeAll(async () => {
    // Sync the model with the database
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear database and add sample data before each test
    await clearDatabase();
    await db.Team.bulkCreate(sampleTeams);
    await db.Player.bulkCreate(samplePlayers.map(player => ({
      ...player,
      // Convert JSON strings to objects if they were stringified
      playstyle: typeof player.playstyle === 'string' ? JSON.parse(player.playstyle) : player.playstyle,
      agent_usage: typeof player.agent_usage === 'string' ? JSON.parse(player.agent_usage) : player.agent_usage
    })));
  });

  afterAll(async () => {
    // Clean up after all tests
    await clearDatabase();
  });

  describe('GET /api/analysis/players/similar/:player_id', () => {
    it('should return similar players', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app).get(`/api/analysis/players/similar/${playerId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('target_player');
      expect(res.body).toHaveProperty('similar_players');
      expect(res.body.target_player.id).toEqual(playerId);
      expect(Array.isArray(res.body.similar_players)).toBeTruthy();
    });

    it('should filter similar players by free agent status', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app)
        .get(`/api/analysis/players/similar/${playerId}`)
        .query({ free_agents_only: true });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.similar_players.every(player => player.is_free_agent === true)).toBeTruthy();
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app).get('/api/analysis/players/similar/non-existent-id');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/analysis/market/free-agents', () => {
    it('should return free agent market analysis', async () => {
      const res = await request(app).get('/api/analysis/market/free-agents');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('total_free_agents');
      expect(res.body).toHaveProperty('market_stats');
      expect(res.body).toHaveProperty('talent_distribution');
      expect(res.body).toHaveProperty('role_distribution');
      expect(res.body).toHaveProperty('top_prospects');
    });

    it('should filter market analysis by role', async () => {
      const res = await request(app)
        .get('/api/analysis/market/free-agents')
        .query({ role: 'Initiator' });
      
      expect(res.statusCode).toEqual(200);
      // The controller filters by players who have at least 30% of their playstyle as the specified role
      // Given our sample data, we know which players should match
      expect(res.body.total_free_agents).toBeGreaterThanOrEqual(0);
    });

    it('should filter market analysis by min_rating', async () => {
      const res = await request(app)
        .get('/api/analysis/market/free-agents')
        .query({ min_rating: 1.15 });
      
      expect(res.statusCode).toEqual(200);
      // Check that all top prospects meet the rating criteria
      expect(res.body.top_prospects.every(player => player.rating >= 1.15)).toBeTruthy();
    });
  });

  describe('GET /api/analysis/roster/generate', () => {
    it('should generate an optimal roster', async () => {
      const res = await request(app).get('/api/analysis/roster/generate');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('roster');
      expect(res.body).toHaveProperty('team_stats');
      expect(res.body).toHaveProperty('total_cost');
      expect(res.body).toHaveProperty('budget_remaining');
      expect(Array.isArray(res.body.roster)).toBeTruthy();
      // Maximum of 5 players in a Valorant roster
      expect(res.body.roster.length).toBeLessThanOrEqual(5);
    });

    it('should respect budget constraints', async () => {
      const budget = 10000;
      const res = await request(app)
        .get('/api/analysis/roster/generate')
        .query({ budget });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.total_cost).toBeLessThanOrEqual(budget);
    });

    it('should optimize roster for specified strategy', async () => {
      const res = await request(app)
        .get('/api/analysis/roster/generate')
        .query({ optimize_for: 'firepower' });
      
      expect(res.statusCode).toEqual(200);
      // Hard to test optimization strategy without knowing exact algorithm details
      // But at minimum we can check that it returns a valid roster
      expect(res.body.roster.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analysis/players/compare', () => {
    it('should compare multiple players', async () => {
      const player1Id = samplePlayers[0].id;
      const player2Id = samplePlayers[1].id;
      const res = await request(app)
        .get(`/api/analysis/players/compare`)
        .query({ player_ids: `${player1Id},${player2Id}` });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('players');
      expect(res.body).toHaveProperty('metrics');
      expect(res.body.players.length).toEqual(2);
      expect(res.body.players.some(p => p.id === player1Id)).toBeTruthy();
      expect(res.body.players.some(p => p.id === player2Id)).toBeTruthy();
    });

    it('should return 400 for missing player_ids', async () => {
      const res = await request(app).get('/api/analysis/players/compare');
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent players', async () => {
      const res = await request(app)
        .get('/api/analysis/players/compare')
        .query({ player_ids: 'non-existent-id-1,non-existent-id-2' });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/analysis/players/valuation/:player_id', () => {
    it('should return player valuation details', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app).get(`/api/analysis/players/valuation/${playerId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('player');
      expect(res.body).toHaveProperty('comparable_players');
      expect(res.body).toHaveProperty('valuation_factors');
      expect(res.body).toHaveProperty('market_context');
      expect(res.body.player.id).toEqual(playerId);
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app).get('/api/analysis/players/valuation/non-existent-id');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});