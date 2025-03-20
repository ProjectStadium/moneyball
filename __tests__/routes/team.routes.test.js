// __tests__/routes/team.routes.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { sampleTeams, samplePlayers } = require('../helpers/test-data');
const { clearDatabase } = require('../helpers/teardown');

describe('Team API Endpoints', () => {
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

  describe('GET /api/teams', () => {
    it('should return all teams', async () => {
      const res = await request(app).get('/api/teams');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toEqual(sampleTeams.length);
      expect(res.body).toHaveProperty('total', sampleTeams.length);
    });

    it('should filter teams by name', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ name: 'Test Team 2' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].full_team_name).toContain('Test Team 2');
    });

    it('should filter teams by region', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ region: 'EU' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].region).toEqual('EU');
    });

    it('should filter teams by country code', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ country_code: 'de' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].country_code).toEqual('de');
    });

    it('should filter teams by rank range', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ min_rank: 150, max_rank: 250 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(team => team.rank >= 150 && team.rank <= 250)).toBeTruthy();
    });

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ limit: 1, offset: 1 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body).toHaveProperty('total', sampleTeams.length);
      expect(res.body).toHaveProperty('limit', 1);
      expect(res.body).toHaveProperty('offset', 1);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const res = await request(app)
        .get('/api/teams')
        .query({ min_rank: 'invalid' });
      
      expect(res.statusCode).toEqual(500); // Your error handler returns 500 for this
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return a single team by ID', async () => {
      const teamId = sampleTeams[0].id;
      const res = await request(app).get(`/api/teams/${teamId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', teamId);
      expect(res.body).toHaveProperty('team_abbreviation', sampleTeams[0].team_abbreviation);
    });

    it('should return a single team by abbreviation', async () => {
      const teamAbbr = sampleTeams[0].team_abbreviation;
      const res = await request(app).get(`/api/teams/${teamAbbr}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('team_abbreviation', teamAbbr);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app).get('/api/teams/non-existent-id');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/teams/:id/roster', () => {
    it('should return roster by team ID', async () => {
      const teamId = sampleTeams[0].id;
      const res = await request(app).get(`/api/teams/${teamId}/roster`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      const testPlayer = samplePlayers.find(p => p.team_abbreviation === sampleTeams[0].team_abbreviation);
      expect(res.body.some(player => player.id === testPlayer.id)).toBeTruthy();
    });

    it('should return roster by team abbreviation', async () => {
      const teamAbbr = sampleTeams[0].team_abbreviation;
      const res = await request(app).get(`/api/teams/${teamAbbr}/roster`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.every(player => player.team_abbreviation === teamAbbr)).toBeTruthy();
    });

    it('should return empty array for non-existent team', async () => {
      const res = await request(app).get('/api/teams/NONEXIST/roster');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(0);
    });
  });

  describe('GET /api/teams/region/:region', () => {
    it('should return teams by region', async () => {
      const res = await request(app).get('/api/teams/region/EU');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.every(team => team.region === 'EU')).toBeTruthy();
    });

    it('should return empty array for non-existent region', async () => {
      const res = await request(app).get('/api/teams/region/NONEXIST');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(0);
    });
  });

  describe('GET /api/teams/top', () => {
    it('should return top teams by rank', async () => {
      const res = await request(app)
        .get('/api/teams/top')
        .query({ limit: 1 });
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1);
      
      // Teams should be ordered by rank ASC (lower rank = better team)
      const orderedTeams = [...sampleTeams].sort((a, b) => a.rank - b.rank);
      expect(res.body[0].id).toEqual(orderedTeams[0].id);
    });

    it('should limit results correctly', async () => {
      const res = await request(app)
        .get('/api/teams/top')
        .query({ limit: 2 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
    });
  });
});