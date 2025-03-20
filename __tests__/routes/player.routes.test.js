// __tests__/routes/player.routes.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { samplePlayers, sampleTeams } = require('../helpers/test-data');
const { clearDatabase } = require('../helpers/teardown');

describe('Player API Endpoints', () => {
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

  describe('GET /api/players', () => {
    it('should return all players', async () => {
      const res = await request(app).get('/api/players');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toEqual(samplePlayers.length);
      expect(res.body).toHaveProperty('total', samplePlayers.length);
    });

    it('should filter players by name', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ name: 'FreeAgent' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].name).toContain('FreeAgent');
    });

    it('should filter players by team_abbreviation', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ team_abbreviation: 'TST' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].team_abbreviation).toEqual('TST');
    });

    it('should filter players by free agent status', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ is_free_agent: 'true' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(player => player.is_free_agent === true)).toBeTruthy();
    });

    it('should filter players by rating range', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ min_rating: 1.2, max_rating: 1.3 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(player => player.rating >= 1.2 && player.rating <= 1.3)).toBeTruthy();
    });

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ limit: 1, offset: 1 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body).toHaveProperty('total', samplePlayers.length);
      expect(res.body).toHaveProperty('limit', 1);
      expect(res.body).toHaveProperty('offset', 1);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ min_rating: 'invalid' });
      
      expect(res.statusCode).toEqual(500); // Your error handler returns 500 for this
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/players/:id', () => {
    it('should return a single player by ID', async () => {
      const playerId = samplePlayers[0].id;
      const res = await request(app).get(`/api/players/${playerId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', playerId);
      expect(res.body).toHaveProperty('name', samplePlayers[0].name);
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app).get('/api/players/non-existent-id');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/players/top', () => {
    it('should return top players by rating', async () => {
      const res = await request(app)
        .get('/api/players/top')
        .query({ stat: 'rating', limit: 2 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      // Check that players are sorted by rating in descending order
      expect(res.body[0].rating).toBeGreaterThanOrEqual(res.body[1].rating);
    });

    it('should return top players by ACS', async () => {
      const res = await request(app)
        .get('/api/players/top')
        .query({ stat: 'acs', limit: 2 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      // Check that players are sorted by ACS in descending order
      expect(res.body[0].acs).toBeGreaterThanOrEqual(res.body[1].acs);
    });

    it('should return 400 for invalid stat parameter', async () => {
      const res = await request(app)
        .get('/api/players/top')
        .query({ stat: 'invalid_stat' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/players/team/:team_abbreviation', () => {
    it('should return players by team abbreviation', async () => {
      const res = await request(app).get('/api/players/team/TST');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.every(player => player.team_abbreviation === 'TST')).toBeTruthy();
    });

    it('should return empty array for non-existent team', async () => {
      const res = await request(app).get('/api/players/team/NONEXIST');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(0);
    });
  });

  describe('GET /api/players/free-agents', () => {
    it('should return all free agents', async () => {
      const res = await request(app).get('/api/players/free-agents');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.every(player => player.is_free_agent === true)).toBeTruthy();
    });

    it('should filter free agents by minimum rating', async () => {
      const res = await request(app)
        .get('/api/players/free-agents')
        .query({ min_rating: 1.15 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(player => 
        player.is_free_agent === true && player.rating >= 1.15
      )).toBeTruthy();
    });
  });
});