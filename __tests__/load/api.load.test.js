// __tests__/load/api.load.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');

// Set test timeouts higher for load tests
jest.setTimeout(30000);

describe('API Load Tests', () => {
  // Sample test data
  const sampleTeams = [];
  const samplePlayers = [];
  
  // Setup sample data for load testing
  beforeAll(async () => {
    // Create test database and sync models
    await db.sequelize.sync({ force: true });
    
    // Generate test teams
    for (let i = 1; i <= 10; i++) {
      sampleTeams.push({
        id: `team-id-${i}`,
        team_abbreviation: `TE${i}`,
        full_team_name: `Test Team ${i}`,
        region: i % 2 === 0 ? 'NA' : 'EMEA',
        country: i % 2 === 0 ? 'USA' : 'UK',
        rank: i
      });
    }
    
    // Generate test players (100 players)
    for (let i = 1; i <= 100; i++) {
      const teamIndex = i % 10;
      const isFreeAgent = i > 80; // 20 free agents
      
      samplePlayers.push({
        id: `player-id-${i}`,
        name: `Player${i}`,
        team_abbreviation: isFreeAgent ? null : sampleTeams[teamIndex].team_abbreviation,
        is_free_agent: isFreeAgent,
        rating: 0.8 + (Math.random() * 0.7), // Rating between 0.8 and 1.5
        acs: 200 + (Math.random() * 100), // ACS between 200 and 300
        kd_ratio: 0.8 + (Math.random() * 0.7), // K/D between 0.8 and 1.5
        adr: 120 + (Math.random() * 60), // ADR between 120 and 180
        division: i % 4 === 0 ? 'T1' : i % 4 === 1 ? 'T2' : i % 4 === 2 ? 'T3' : 'T4',
        estimated_value: 1000 + (Math.floor(Math.random() * 4000)),
        playstyle: JSON.stringify({
          role_percentages: {
            'Duelist': i % 4 === 0 ? 80 : 20,
            'Controller': i % 4 === 1 ? 80 : 20,
            'Sentinel': i % 4 === 2 ? 80 : 20,
            'Initiator': i % 4 === 3 ? 80 : 20
          }
        })
      });
    }
    
    // Populate the database
    await db.Team.bulkCreate(sampleTeams);
    await db.Player.bulkCreate(samplePlayers);
  });
  
  // Clean up after testing
  afterAll(async () => {
    await db.sequelize.close();
  });
  
  // Helper function to measure response time
  const measureResponseTime = async (endpoint) => {
    const start = Date.now();
    await request(app).get(endpoint);
    return Date.now() - start;
  };
  
  // Test concurrent requests to player endpoint
  test('should handle multiple concurrent requests to player endpoint', async () => {
    // Create 10 concurrent requests
    const concurrentRequests = Array(10).fill()
      .map(() => request(app).get('/api/players'));
    
    // Execute all requests
    const responses = await Promise.all(concurrentRequests);
    
    // Verify all responses were successful
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
  
  // Test response time for various endpoints
  test('should respond to requests within acceptable time limits', async () => {
    // Define acceptable time limits in milliseconds
    const acceptableResponseTimes = {
      playersEndpoint: 300,
      teamsEndpoint: 200,
      playerDetailEndpoint: 150,
      freeAgentsEndpoint: 250,
      analysisEndpoint: 500
    };
    
    // Test players endpoint
    const playersTime = await measureResponseTime('/api/players');
    console.log(`/api/players response time: ${playersTime}ms`);
    expect(playersTime).toBeLessThan(acceptableResponseTimes.playersEndpoint);
    
    // Test teams endpoint
    const teamsTime = await measureResponseTime('/api/teams');
    console.log(`/api/teams response time: ${teamsTime}ms`);
    expect(teamsTime).toBeLessThan(acceptableResponseTimes.teamsEndpoint);
    
    // Test player detail endpoint
    const playerDetailTime = await measureResponseTime('/api/players/player-id-1');
    console.log(`/api/players/player-id-1 response time: ${playerDetailTime}ms`);
    expect(playerDetailTime).toBeLessThan(acceptableResponseTimes.playerDetailEndpoint);
    
    // Test free agents endpoint
    const freeAgentsTime = await measureResponseTime('/api/players/free-agents');
    console.log(`/api/players/free-agents response time: ${freeAgentsTime}ms`);
    expect(freeAgentsTime).toBeLessThan(acceptableResponseTimes.freeAgentsEndpoint);
    
    // Test analysis endpoint
    const analysisTime = await measureResponseTime('/api/analysis/market/free-agents');
    console.log(`/api/analysis/market/free-agents response time: ${analysisTime}ms`);
    expect(analysisTime).toBeLessThan(acceptableResponseTimes.analysisEndpoint);
  });
  
  // Test pagination performance
  test('should efficiently handle paginated requests', async () => {
    // Test with different page sizes
    const pageSizes = [10, 20, 50];
    
    for (const limit of pageSizes) {
      for (let page = 0; page < 3; page++) {
        const offset = page * limit;
        const response = await request(app)
          .get(`/api/players?limit=${limit}&offset=${offset}`)
          .expect(200);
          
        expect(response.body.data.length).toBeLessThanOrEqual(limit);
        expect(response.body.limit).toBe(limit);
        expect(response.body.offset).toBe(offset);
      }
    }
  });
  
  // Test filter performance
  test('should efficiently handle filtered requests', async () => {
    // Define filters to test
    const filters = [
      { endpoint: '/api/players?is_free_agent=true', expectedCount: 20 },
      { endpoint: '/api/players?team_abbreviation=TE1', expectedCount: 10 },
      { endpoint: '/api/players?min_rating=1.2', expectedCount: expect.any(Number) },
      { endpoint: '/api/teams?region=NA', expectedCount: 5 }
    ];
    
    // Test each filter
    for (const filter of filters) {
      const response = await request(app)
        .get(filter.endpoint)
        .expect(200);
        
      if (typeof filter.expectedCount === 'number') {
        expect(response.body.total).toBe(filter.expectedCount);
      } else {
        expect(response.body.total).toBeGreaterThan(0);
      }
    }
  });
  
  // Test analysis endpoint performance under load
  test('should handle complex analysis requests efficiently', async () => {
    // Test roster generation with various constraints
    const rosterConfigurations = [
      { budget: 5000, min_rating: 0.9 },
      { budget: 10000, min_rating: 1.0 },
      { budget: 15000, min_rating: 1.1 },
      { budget: 20000, min_rating: 1.2 }
    ];
    
    // Make the requests sequentially to avoid overwhelming the server
    for (const config of rosterConfigurations) {
      const start = Date.now();
      
      const response = await request(app)
        .get(`/api/analysis/roster/generate?budget=${config.budget}&min_rating=${config.min_rating}`)
        .expect(200);
        
      const elapsed = Date.now() - start;
      
      expect(response.body).toHaveProperty('roster');
      expect(response.body.roster.length).toBeGreaterThan(0);
      expect(response.body.total_cost).toBeLessThanOrEqual(config.budget);
      
      // Complex analysis should complete in under 1 second
      expect(elapsed).toBeLessThan(1000);
      console.log(`Roster generation with budget ${config.budget} completed in ${elapsed}ms`);
    }
  });
  
  // Test performance consistency over multiple requests
  test('should maintain consistent performance over multiple requests', async () => {
    const endpoint = '/api/players?limit=20';
    const iterations = 5;
    const responseTimes = [];
    
    // Make the same request multiple times
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await request(app).get(endpoint).expect(200);
      responseTimes.push(Date.now() - start);
    }
    
    // Calculate average and standard deviation
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / iterations;
    const stdDev = Math.sqrt(variance);
    
    console.log(`Average response time: ${average}ms, Standard Deviation: ${stdDev}ms`);
    
    // Standard deviation should be less than 30% of the average (indicates consistency)
    expect(stdDev).toBeLessThan(average * 0.3);
  });
});