// __tests__/routes/admin.routes.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { samplePlayers, sampleTeams } = require('../helpers/test-data');
const { clearDatabase } = require('../helpers/teardown');

// Mock the scheduler service
jest.mock('../../src/services/scheduler.service', () => ({
  init: jest.fn(),
  getQueueStatus: jest.fn().mockReturnValue({
    queue_length: 5,
    active_requests: 1,
    is_running: true,
    priority_distribution: { '10': 2, '8': 3 }
  }),
  updatePlayerDetails: jest.fn().mockResolvedValue({ success: true, message: 'Player update scheduled' }),
  triggerFullRefresh: jest.fn().mockResolvedValue({ 
    success: true, 
    message: 'Full data refresh scheduled (5 pages, detailed: true)' 
  })
}));

// Mock the liquipedia service
jest.mock('../../src/services/liquipedia.service', () => ({
  queueEarningsUpdates: jest.fn().mockResolvedValue({
    success: true,
    queued_players: 5,
    divisions: ['T1', 'T2']
  }),
  processPlayerEarnings: jest.fn().mockResolvedValue({
    success: true,
    player_name: 'TestPlayer1',
    total_earnings: 50000,
    tournaments_count: 10
  })
}));

describe('Admin API Endpoints', () => {
  beforeAll(async () => {
    // Sync the model with the database
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear database and add sample data before each test
    await clearDatabase();
    await db.Team.bulkCreate(sampleTeams);
    await db.Player.bulkCreate(samplePlayers);
  });

  afterAll(async () => {
    // Clean up after all tests
    await clearDatabase();
  });

  describe('GET /api/admin/scraper/status', () => {
    it('should return queue status', async () => {
      const res = await request(app).get('/api/admin/scraper/status');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('queue_length');
      expect(res.body).toHaveProperty('active_requests');
      expect(res.body).toHaveProperty('is_running');
      expect(res.body).toHaveProperty('priority_distribution');
    });
  });

  describe('POST /api/admin/scraper/player/:id', () => {
    it('should trigger player detail update', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app).post(`/api/admin/scraper/player/${playerId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Player update scheduled');
    });
  });

  describe('POST /api/admin/scraper/refresh', () => {
    it('should trigger full data refresh', async () => {
      const res = await request(app)
        .post('/api/admin/scraper/refresh')
        .send({ pages: 5, detailed: true });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Full data refresh scheduled (5 pages, detailed: true)');
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return database stats', async () => {
      const res = await request(app).get('/api/admin/stats');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('players');
      expect(res.body).toHaveProperty('teams');
      expect(res.body).toHaveProperty('last_updated');
      expect(res.body.players).toHaveProperty('total');
      expect(res.body.players).toHaveProperty('free_agents');
      expect(res.body.players).toHaveProperty('divisions');
    });
  });

  describe('POST /api/admin/scraper/earnings', () => {
    it('should queue earnings updates', async () => {
      const res = await request(app)
        .post('/api/admin/scraper/earnings')
        .send({ 
          limit: 50, 
          divisions: ['T1', 'T2'], 
          minDaysSinceUpdate: 30 
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('queued_players');
      expect(res.body).toHaveProperty('divisions');
    });
  });

  describe('GET /api/admin/players/:id/earnings', () => {
    it('should get player earnings', async () => {
      const playerId = samplePlayers[0].id;
      
      // Mock the player's earnings data
      await db.Player.update({
        total_earnings: 50000,
        earnings_by_year: JSON.stringify({ "2023": 30000, "2024": 20000 }),
        tournament_earnings: JSON.stringify([
          { tournament: "VCT 2023", prize: 25000 },
          { tournament: "Masters 2024", prize: 15000 }
        ]),
        earnings_last_updated: new Date()
      }, {
        where: { id: playerId }
      });
      
      const res = await request(app).get(`/api/admin/players/${playerId}/earnings`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', playerId);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('total_earnings');
      expect(res.body).toHaveProperty('earnings_by_year');
      expect(res.body).toHaveProperty('tournament_earnings');
      expect(res.body).toHaveProperty('earnings_last_updated');
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app).get('/api/admin/players/non-existent-id/earnings');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/admin/players/:id/earnings', () => {
    it('should manually update player earnings', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app).post(`/api/admin/players/${playerId}/earnings`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('player_name');
      expect(res.body).toHaveProperty('total_earnings');
      expect(res.body).toHaveProperty('tournaments_count');
    });
  });
});