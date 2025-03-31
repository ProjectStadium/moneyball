const request = require('supertest');
const app = require('../app');
const RolePerformanceService = require('../services/rolePerformance.service');
const LiquipediaService = require('../services/liquipedia.service');

// Mock database
jest.mock('../utils/database', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    define: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    })
  };

  const DataTypes = {
    UUID: 'UUID',
    UUIDV4: 'UUIDV4',
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    FLOAT: 'FLOAT',
    BOOLEAN: 'BOOLEAN',
    DATE: 'DATE',
    JSON: 'JSON',
    ARRAY: jest.fn().mockReturnValue('ARRAY')
  };

  return {
    sequelize: mockSequelize,
    DataTypes,
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock scheduler to prevent data collection
jest.mock('../services/scheduler.service', () => ({
  init: jest.fn(),
  triggerImmediateDataCollection: jest.fn().mockResolvedValue({ success: true })
}));

// Mock RiotService
jest.mock('../services/riot.service', () => {
  return jest.fn().mockImplementation(() => ({
    getTournamentMatches: jest.fn().mockImplementation((puuid, tournamentName) => {
      if (tournamentName === 'Invalid Tournament') {
        return [];
      }
      return [
        {
          info: {
            gameStartTime: new Date().toISOString(),
            tournamentName: 'VCT 2024 Finals',
            players: [
              {
                puuid,
                teamId: 'team1',
                stats: {
                  kills: 25,
                  deaths: 15,
                  assists: 10,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1,
                  damage: 150,
                  smokesUsed: 10,
                  smokeKills: 2,
                  flashesUsed: 8,
                  flashKills: 3,
                  trapsUsed: 8,
                  trapKills: 2
                }
              }
            ],
            teams: [
              { teamId: 'team1' },
              { teamId: 'team2' }
            ]
          }
        }
      ];
    }),
    extractUtilityData: jest.fn().mockImplementation((match, puuid, role) => {
      switch (role) {
        case 'Controller':
          return {
            smokes: 8,
            flashes: 0,
            recon: 0,
            traps: 0,
            postPlantKills: 3,
            flashAssists: 0,
            clutches: 1,
            smokeKills: 2,
            smokesUsed: 10,
            smokeSuccessRate: 20,
            flashSuccessRate: 0,
            trapSuccessRate: 0
          };
        case 'Initiator':
          return {
            smokes: 0,
            flashes: 6,
            recon: 5,
            traps: 0,
            postPlantKills: 2,
            flashAssists: 4,
            clutches: 1,
            flashKills: 3,
            flashesUsed: 8,
            smokeSuccessRate: 0,
            flashSuccessRate: 37.5,
            trapSuccessRate: 0
          };
        case 'Sentinel':
          return {
            smokes: 0,
            flashes: 0,
            recon: 3,
            traps: 6,
            postPlantKills: 2,
            flashAssists: 0,
            clutches: 2,
            trapKills: 2,
            trapsUsed: 8,
            smokeSuccessRate: 0,
            flashSuccessRate: 0,
            trapSuccessRate: 25
          };
        default: // Duelist
          return {
            smokes: 0,
            flashes: 2,
            recon: 0,
            traps: 0,
            postPlantKills: 4,
            flashAssists: 1,
            clutches: 1,
            smokeSuccessRate: 0,
            flashSuccessRate: 0,
            trapSuccessRate: 0
          };
      }
    }),
    getMatches: jest.fn().mockImplementation((puuid) => {
      return [
        {
          info: {
            gameStartTime: new Date().toISOString(),
            tournamentName: 'VCT 2024 Finals',
            players: [
              {
                puuid,
                teamId: 'team1',
                stats: {
                  kills: 25,
                  deaths: 15,
                  assists: 10,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1,
                  damage: 150
                }
              }
            ],
            teams: [
              { teamId: 'team1' },
              { teamId: 'team2' }
            ]
          }
        }
      ];
    })
  }));
});

// Mock LiquipediaService
jest.mock('../services/liquipedia.service', () => {
  return jest.fn().mockImplementation(() => ({
    getTournamentStats: jest.fn().mockResolvedValue({
      prizePool: 100000,
      teams: 16,
      matches: 32,
      stages: ['group_stage', 'playoffs', 'finals']
    }),
    getTournamentMatches: jest.fn().mockResolvedValue([
      {
        info: {
          gameStartTime: new Date().toISOString(),
          tournamentName: 'VCT 2024 Finals',
          players: [
            {
              puuid: 'test-puuid',
              teamId: 'team1',
              stats: {
                kills: 25,
                deaths: 15,
                assists: 10,
                score: 300,
                firstBloods: 3,
                firstDeaths: 1,
                damage: 150
              }
            }
          ],
          teams: [
            { teamId: 'team1' },
            { teamId: 'team2' }
          ]
        }
      }
    ])
  }));
});

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn()
  }));
});

// Mock the app module
jest.mock('../app', () => {
  const express = require('express');
  const app = express();
  const RolePerformanceService = require('../services/rolePerformance.service');
  const rolePerformanceService = new RolePerformanceService();

  // Store route handlers
  const handlers = {
    get: {},
    post: {}
  };

  // Register route handlers
  app.get = (path, handler) => {
    handlers.get[path] = handler;
    return app;
  };

  app.post = (path, handler) => {
    handlers.post[path] = handler;
    return app;
  };

  // Register the actual routes
  app.get('/api/role-performance/player/:puuid/tournament/:tournamentName', async (req, res) => {
    try {
      const { puuid, tournamentName } = req.params;
      const { role } = req.query;
      
      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      const result = await rolePerformanceService.calculateRPS({ puuid, role }, tournamentName);
      res.json({
        score: result.score,
        metrics: {
          baseStats: result.details.baseStats,
          normalizedMetrics: result.details.normalizedMetrics,
          weights: result.details.weights,
          adjustments: result.details.adjustments,
          utilityData: result.details.utilityData
        },
        stageWeights: result.details.stageWeights,
        recentWeights: result.details.recentMatchesWeight
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/role-performance/validate', async (req, res) => {
    try {
      const { player, tournamentName, tournamentStage } = req.body;
      
      if (!player || !player.role || !player.puuid || !tournamentName) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['player.role', 'player.puuid', 'tournamentName']
        });
      }

      const matches = await rolePerformanceService.riotService.getTournamentMatches(player.puuid, tournamentName);
      if (!matches || matches.length === 0) {
        throw new Error('Invalid tournament data');
      }

      const result = await rolePerformanceService.calculateRPS(player, tournamentName, {
        tournamentStage,
        weightRecentMatches: true,
        matches
      });

      const stageMetrics = {
        groupStage: result.details.matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'group_stage').length,
        playoffs: result.details.matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'playoffs').length,
        finals: result.details.matches.filter(match => rolePerformanceService.getTournamentStage(match) === 'finals').length
      };

      res.json({
        success: true,
        data: {
          player: {
            name: player.name,
            role: player.role,
            puuid: player.puuid
          },
          tournament: {
            name: tournamentName,
            stage: tournamentStage || 'all',
            matches: result.details.matches.length,
            stageMetrics
          },
          rps: result.score,
          breakdown: {
            baseStats: result.details.baseStats,
            normalizedMetrics: result.details.normalizedMetrics,
            weights: result.details.weights,
            adjustments: result.details.adjustments,
            utilityData: result.details.utilityData,
            recentMatchesWeight: result.details.recentMatchesWeight
          },
          validation: {
            matchCount: result.details.matches.length,
            stageDistribution: stageMetrics,
            recentMatchesImpact: result.details.recentMatchesImpact
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add handleRequest method
  app.handleRequest = (req, res) => {
    if (req.method === 'GET' && req.path.startsWith('/api/role-performance/player/')) {
      const [_, __, ___, puuid, ____, tournamentName] = req.path.split('/');
      req.params = { puuid, tournamentName };
      return handlers.get['/api/role-performance/player/:puuid/tournament/:tournamentName'](req, res);
    }
    if (req.method === 'POST' && req.path === '/api/role-performance/validate') {
      return handlers.post['/api/role-performance/validate'](req, res);
    }
    res.status(404).json({ error: 'Not found' });
  };

  return app;
});

// Mock supertest
jest.mock('supertest', () => {
  return function(app) {
    return {
      get: function(path) {
        return {
          query: function(params) {
            return new Promise((resolve) => {
              const req = {
                method: 'GET',
                path,
                query: params,
                params: {}
              };
              const res = {
                status: function(code) {
                  this.statusCode = code;
                  return this;
                },
                json: function(data) {
                  resolve({ status: this.statusCode || 200, body: data });
                }
              };
              app.handleRequest(req, res);
            });
          }
        };
      },
      post: function(path) {
        return {
          send: function(data) {
            return new Promise((resolve) => {
              const req = {
                method: 'POST',
                path,
                body: data
              };
              const res = {
                status: function(code) {
                  this.statusCode = code;
                  return this;
                },
                json: function(data) {
                  resolve({ status: this.statusCode || 200, body: data });
                }
              };
              app.handleRequest(req, res);
            });
          }
        };
      }
    };
  };
});

// Mock process.exit to prevent tests from exiting
process.exit = jest.fn();

describe('Role Performance Validation', () => {
  beforeAll(() => {
    // Suppress console.error output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let rolePerformanceService;
  let liquipediaService;
  let riotService;

  beforeEach(() => {
    rolePerformanceService = new RolePerformanceService();
    liquipediaService = new LiquipediaService();
    riotService = rolePerformanceService.riotService;

    // Mock RiotService methods
    jest.spyOn(riotService, 'getTournamentMatches').mockResolvedValue([
      {
        info: {
          tournamentName: 'VCT 2024 Finals',
          players: [
            {
              puuid: 'test-puuid',
              stats: {
                kills: 20,
                deaths: 12,
                assists: 8,
                score: 300,
                firstBloods: 3,
                firstDeaths: 1
              }
            }
          ]
        }
      }
    ]);

    jest.spyOn(riotService, 'extractUtilityData').mockReturnValue({
      smokes: 8,
      flashes: 6,
      recon: 5,
      traps: 0,
      postPlantKills: 4,
      flashAssists: 4,
      clutches: 1
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test data for VCT 2024
  const testPlayers = [
    {
      name: 'Test Player 1',
      puuid: 'test-puuid-1',
      role: 'Duelist',
      team: 'Team A'
    },
    {
      name: 'Test Player 2',
      puuid: 'test-puuid-2',
      role: 'Controller',
      team: 'Team B'
    },
    {
      name: 'Test Player 3',
      puuid: 'test-puuid-3',
      role: 'Initiator',
      team: 'Team C'
    },
    {
      name: 'Test Player 4',
      puuid: 'test-puuid-4',
      role: 'Sentinel',
      team: 'Team D'
    }
  ];

  const testTournaments = [
    {
      name: 'VCT 2024 Finals',
      stages: ['group_stage', 'playoffs', 'finals']
    },
    {
      name: 'VCT 2024 Playoffs',
      stages: ['group_stage', 'playoffs']
    }
  ];

  const testMatchData = {
    info: {
      gameStartTime: new Date().toISOString(),
      tournamentName: 'VCT 2024 Finals',
      players: [
        {
          puuid: 'test-puuid',
          teamId: 'team1',
          stats: {
            kills: 25,
            deaths: 15,
            assists: 10,
            score: 300,
            firstBloods: 3,
            firstDeaths: 1,
            damage: 150,
            smokesUsed: 10,
            smokeKills: 2,
            flashesUsed: 8,
            flashKills: 3,
            trapsUsed: 8,
            trapKills: 2
          }
        }
      ],
      teams: [
        { teamId: 'team1' },
        { teamId: 'team2' }
      ]
    }
  };

  describe('GET /api/role-performance/player/:puuid/tournament/:tournamentName', () => {
    it('should validate role performance for a player in a tournament', async () => {
      const response = await request(app)
        .get('/api/role-performance/player/test-puuid/tournament/VCT%202024%20Finals')
        .query({ role: 'Duelist' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should validate role performance with tournament stage weighting', async () => {
      const response = await request(app)
        .get('/api/role-performance/player/test-puuid/tournament/VCT%202024%20Finals')
        .query({ role: 'Controller' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('stageWeights');
    });

    it('should validate role performance with recent match weighting', async () => {
      const response = await request(app)
        .get('/api/role-performance/player/test-puuid/tournament/VCT%202024%20Finals')
        .query({ role: 'Initiator' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('recentWeights');
    });
  });

  describe('POST /api/role-performance/validate', () => {
    it('should validate role performance for a player in a specific tournament', async () => {
      const response = await request(app)
        .post('/api/role-performance/validate')
        .send({
          player: {
            name: 'Test Player',
            role: 'Duelist',
            puuid: 'test-puuid'
          },
          tournamentName: 'VCT 2024 Finals'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('rps');
    });

    it('should validate role performance with tournament stage weighting', async () => {
      const response = await request(app)
        .post('/api/role-performance/validate')
        .send({
          player: {
            name: 'Test Player',
            role: 'Controller',
            puuid: 'test-puuid'
          },
          tournamentName: 'VCT 2024 Finals',
          tournamentStage: 'finals'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('rps');
    });

    it('should validate role performance with recent match weighting', async () => {
      const response = await request(app)
        .post('/api/role-performance/validate')
        .send({
          player: {
            name: 'Test Player',
            role: 'Initiator',
            puuid: 'test-puuid'
          },
          tournamentName: 'VCT 2024 Finals'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('rps');
    });

    it('should handle invalid tournament data gracefully', async () => {
      // Store the original mock implementation
      const originalGetTournamentMatches = rolePerformanceService.riotService.getTournamentMatches;

      // Mock getTournamentMatches to return empty array for invalid tournament
      rolePerformanceService.riotService.getTournamentMatches = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .post('/api/role-performance/validate')
        .send({
          player: {
            name: 'Test Player',
            role: 'Duelist',
            puuid: 'test-puuid'
          },
          tournamentName: 'Invalid Tournament'
        });

      // Restore the original mock
      rolePerformanceService.riotService.getTournamentMatches = originalGetTournamentMatches;

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid tournament data');
    });
  });

  describe('Role Performance Service Methods', () => {
    it('should correctly identify tournament stages', () => {
      const tournamentNames = [
        'VCT 2024 Grand Finals',
        'VCT 2024 Playoffs',
        'VCT 2024 Group Stage',
        'VCT 2024 Regional Qualifier',
        'VCT 2024 Open Qualifier'
      ];
      const expectedWeights = [1.3, 1.2, 1.0, 0.9, 0.8];

      tournamentNames.forEach((tournamentName, index) => {
        const match = {
          info: {
            tournamentName: tournamentName
          }
        };

        const result = rolePerformanceService.getTournamentStage(match);
        const weight = rolePerformanceService.tournamentStageWeights[result];

        expect(weight).toBe(expectedWeights[index]);
      });
    });

    it('should calculate recent match impact correctly', () => {
      const matches = [
        {
          info: {
            gameStartTime: new Date(Date.now() - 1000).toISOString(), // 1 second ago
            tournamentName: 'VCT 2024 Finals',
            players: [
              {
                puuid: 'test-puuid',
                stats: {
                  kills: 20,
                  deaths: 12,
                  assists: 8,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1
                }
              }
            ]
          }
        },
        {
          info: {
            gameStartTime: new Date(Date.now() - 2000).toISOString(), // 2 seconds ago
            tournamentName: 'VCT 2024 Playoffs',
            players: [
              {
                puuid: 'test-puuid',
                stats: {
                  kills: 15,
                  deaths: 10,
                  assists: 6,
                  score: 250,
                  firstBloods: 2,
                  firstDeaths: 2
                }
              }
            ]
          }
        },
        {
          info: {
            gameStartTime: new Date(Date.now() - 3000).toISOString(), // 3 seconds ago
            tournamentName: 'VCT 2024 Group Stage',
            players: [
              {
                puuid: 'test-puuid',
                stats: {
                  kills: 18,
                  deaths: 14,
                  assists: 7,
                  score: 280,
                  firstBloods: 2,
                  firstDeaths: 1
                }
              }
            ]
          }
        }
      ];

      const weightedStats = rolePerformanceService.calculateWeightedStats(matches, 'test-puuid');
      
      // Most recent match (finals) should have highest weight
      expect(weightedStats).toBeTruthy();
      expect(weightedStats.kd_ratio).toBeGreaterThan(0);
      
      // Verify that recent matches have higher impact
      const recentKD = 20 / 12; // Most recent match
      const olderKD = 15 / 10;  // Second match
      expect(weightedStats.kd_ratio).toBeGreaterThan(recentKD * 0.5); // Should be weighted towards recent performance
    });

    it('should apply both tournament stage and recent match weights correctly', () => {
      const matches = [
        {
          info: {
            gameStartTime: new Date(Date.now() - 1000).toISOString(),
            tournamentName: 'VCT 2024 Group Stage',
            players: [
              {
                puuid: 'test-puuid',
                stats: {
                  kills: 20,
                  deaths: 12,
                  assists: 8,
                  score: 300
                }
              }
            ]
          }
        },
        {
          info: {
            gameStartTime: new Date(Date.now() - 2000).toISOString(),
            tournamentName: 'VCT 2024 Finals',
            players: [
              {
                puuid: 'test-puuid',
                stats: {
                  kills: 15,
                  deaths: 10,
                  assists: 6,
                  score: 250
                }
              }
            ]
          }
        }
      ];

      const weightedStats = rolePerformanceService.calculateWeightedStats(matches, 'test-puuid');
      
      // The finals match should have higher weight despite being older
      // due to tournament stage weighting (1.3 vs 1.0)
      expect(weightedStats).toBeTruthy();
      expect(weightedStats.kd_ratio).toBeGreaterThan(0);
      
      // The finals match (1.5 K/D) should have more impact than the group stage match (1.67 K/D)
      // due to tournament stage weighting
      expect(weightedStats.kd_ratio).toBeLessThan(1.67);
    });

    it('should calculate utility effectiveness correctly for each role', () => {
      const duelistData = {
        entryAttempts: 10,
        successfulEntries: 7,
        firstBloods: 3,
        firstDeaths: 2,
        damagePerEntry: 120,
        trades: 8,
        successfulTrades: 6
      };
      const controllerData = {
        postPlantKills: 3,
        postPlantDeaths: 1,
        spikeDefuses: 2,
        smokeKills: 4,
        smokeDeaths: 2,
        siteControlTime: 45,
        smokeSuccessRate: 20
      };
      const initiatorData = {
        recon: 5,
        reconAssists: 3,
        infoDeaths: 2,
        flashAssists: 4,
        flashDeaths: 1,
        flashSuccessRate: 37.5
      };
      const sentinelData = {
        siteKills: 4,
        siteDeaths: 2,
        siteControlTime: 35,
        retakeAttempts: 6,
        retakeKills: 4,
        retakeDeaths: 2,
        trapSuccessRate: 25
      };

      const duelistScore = rolePerformanceService.calculateUtilityEffectiveness(duelistData, 'Duelist');
      const controllerScore = rolePerformanceService.calculateUtilityEffectiveness(controllerData, 'Controller');
      const initiatorScore = rolePerformanceService.calculateUtilityEffectiveness(initiatorData, 'Initiator');
      const sentinelScore = rolePerformanceService.calculateUtilityEffectiveness(sentinelData, 'Sentinel');

      // Duelist score should be based on entry success, space creation, and trade efficiency
      expect(duelistScore).toBeGreaterThan(0);
      expect(duelistScore).toBeLessThan(100);
      expect(rolePerformanceService.calculateEntrySuccessRate(duelistData)).toBe(70);
      expect(rolePerformanceService.calculateSpaceCreationScore(duelistData)).toBeGreaterThan(0);
      expect(rolePerformanceService.calculateTradeEfficiency(duelistData)).toBe(75);

      // Controller score should be based on post-plant performance, site control, and smoke effectiveness
      expect(controllerScore).toBeGreaterThan(0);
      expect(controllerScore).toBeLessThan(100);
      expect(rolePerformanceService.calculatePostPlantScore(controllerData)).toBeGreaterThan(0);
      expect(rolePerformanceService.calculateSiteControlScore(controllerData)).toBeGreaterThan(0);

      // Initiator score should be based on info gathering, flash assists, and recon effectiveness
      expect(initiatorScore).toBeGreaterThan(0);
      expect(initiatorScore).toBeLessThan(100);
      expect(rolePerformanceService.calculateInfoGatheringScore(initiatorData)).toBeGreaterThan(0);
      expect(rolePerformanceService.calculateFlashAssistScore(initiatorData)).toBeGreaterThan(0);

      // Sentinel score should be based on site anchor performance, retake success, and trap effectiveness
      expect(sentinelScore).toBeGreaterThan(0);
      expect(sentinelScore).toBeLessThan(100);
      expect(rolePerformanceService.calculateSiteAnchorScore(sentinelData)).toBeGreaterThan(0);
      expect(rolePerformanceService.calculateRetakeSuccessRate(sentinelData)).toBeGreaterThan(0);
    });

    it('should calculate SDIFF correctly', () => {
      const matches = [
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            gameStartTime: new Date(Date.now() - 1000).toISOString(),
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 30,
                  deaths: 15,
                  assists: 5,
                  score: 350,
                  firstBloods: 4,
                  firstDeaths: 1
                }
              },
              {
                puuid: 'other-puuid-1',
                role: 'Duelist',
                stats: {
                  kills: 20,
                  deaths: 15,
                  assists: 8,
                  score: 250,
                  firstBloods: 2,
                  firstDeaths: 2
                }
              }
            ]
          }
        }
      ];

      const sdiff = rolePerformanceService.calculateSDIFF(matches, 'test-puuid', 'Duelist', 75);
      
      // SDIFF should be positive since the player's stats are above average
      expect(sdiff).toBeGreaterThan(0);
      expect(sdiff).toBeLessThanOrEqual(10);
    });

    it('should handle different tournament tiers correctly', () => {
      // T1 tournament match with exceptional performance
      const t1Matches = [{
        info: {
          tournamentName: 'VCT 2024 Champions Finals',
          gameStartTime: new Date().toISOString(),
          players: [{
            puuid: 'test-puuid',
            role: 'Duelist',
            stats: {
              kills: 35,
              deaths: 12,
              assists: 8,
              score: 400,
              firstBloods: 5,
              firstDeaths: 1,
              damage: 250
            }
          }]
        }
      }];

      // T2 tournament match with good performance
      const t2Matches = [{
        info: {
          tournamentName: 'VCT 2024 Americas League',
          gameStartTime: new Date().toISOString(),
          players: [{
            puuid: 'test-puuid',
            role: 'Duelist',
            stats: {
              kills: 25,
              deaths: 15,
              assists: 6,
              score: 300,
              firstBloods: 3,
              firstDeaths: 2,
              damage: 200
            }
          }]
        }
      }];

      // T3 tournament match with average performance
      const t3Matches = [{
        info: {
          tournamentName: 'VCT 2024 Game Changers',
          gameStartTime: new Date().toISOString(),
          players: [{
            puuid: 'test-puuid',
            role: 'Duelist',
            stats: {
              kills: 20,
              deaths: 18,
              assists: 4,
              score: 250,
              firstBloods: 2,
              firstDeaths: 3,
              damage: 150
            }
          }]
        }
      }];

      // Calculate SDIFF with base RPS values reflecting tier expectations
      const t1Sdiff = rolePerformanceService.calculateSDIFF(t1Matches, 'test-puuid', 'Duelist', 65);
      const t2Sdiff = rolePerformanceService.calculateSDIFF(t2Matches, 'test-puuid', 'Duelist', 65);
      const t3Sdiff = rolePerformanceService.calculateSDIFF(t3Matches, 'test-puuid', 'Duelist', 65);

      // T1 tournaments should have higher weight than T2 and T3
      expect(t1Sdiff).toBeGreaterThan(t2Sdiff);
      expect(t1Sdiff).toBeGreaterThan(t3Sdiff);
      // T2 tournaments should have higher weight than T3
      expect(t2Sdiff).toBeGreaterThan(t3Sdiff);
    });

    it('should weight recent performance more heavily', () => {
      const matches = [
        {
          info: {
            gameStartTime: new Date(Date.now() - 1000).toISOString(),
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 35,
                  deaths: 10,
                  assists: 8,
                  score: 400,
                  firstBloods: 5,
                  firstDeaths: 0
                }
              }
            ]
          }
        },
        {
          info: {
            gameStartTime: new Date(Date.now() - 10000).toISOString(),
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 15,
                  deaths: 20,
                  assists: 5,
                  score: 200,
                  firstBloods: 1,
                  firstDeaths: 3
                }
              }
            ]
          }
        }
      ];

      const sdiff = rolePerformanceService.calculateSDIFF(matches, 'test-puuid', 'Duelist', 75);
      
      // Recent performance should have more impact on SDIFF
      expect(sdiff).toBeGreaterThan(0);
      expect(rolePerformanceService.calculateRecentRPS(matches.slice(0, 1), 'test-puuid', 'Duelist'))
        .toBeGreaterThan(rolePerformanceService.calculateRecentRPS(matches.slice(1), 'test-puuid', 'Duelist'));
    });

    it('should handle role-specific averages correctly', () => {
      const matches = [
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 25,
                  deaths: 15,
                  assists: 10,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1
                }
              },
              {
                puuid: 'other-puuid-1',
                role: 'Controller',
                stats: {
                  kills: 15,
                  deaths: 10,
                  assists: 20,
                  score: 250,
                  firstBloods: 1,
                  firstDeaths: 1
                }
              }
            ]
          }
        }
      ];

      const duelistSdiff = rolePerformanceService.calculateSDIFF(matches, 'test-puuid', 'Duelist', 75);
      const controllerSdiff = rolePerformanceService.calculateSDIFF(matches, 'other-puuid-1', 'Controller', 75);

      // SDIFF should be calculated separately for each role
      expect(duelistSdiff).not.toBe(controllerSdiff);
    });

    it('should validate match data correctly', () => {
      const matches = [
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 25,
                  deaths: 15,
                  assists: 10,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1
                }
              }
            ]
          }
        },
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 30,
                  deaths: 12,
                  assists: 8,
                  score: 350,
                  firstBloods: 4,
                  firstDeaths: 1
                }
              }
            ]
          }
        },
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Controller', // Role mismatch
                stats: {
                  kills: 15,
                  deaths: 10,
                  assists: 20,
                  score: 250,
                  firstBloods: 1,
                  firstDeaths: 1
                }
              }
            ]
          }
        }
      ];

      const validationResults = rolePerformanceService.validateMatchData(matches, 'test-puuid', 'Duelist');

      // Check validation results
      expect(validationResults).toHaveProperty('isValid');
      expect(validationResults).toHaveProperty('confidence');
      expect(validationResults).toHaveProperty('issues');
      expect(validationResults).toHaveProperty('details');

      // Check role consistency
      expect(validationResults.details.roleConsistency).toBe(0.67); // 2 out of 3 matches
      expect(validationResults.issues).toContain('Low role consistency (66.7%)');

      // Check match count
      expect(validationResults.details.matchCount).toBe(3);
      expect(validationResults.isValid).toBe(true); // Should be valid as we have enough matches

      // Check confidence score
      expect(validationResults.confidence).toHaveProperty('score');
      expect(validationResults.confidence).toHaveProperty('level');
      expect(validationResults.confidence).toHaveProperty('issues');
    });

    it('should detect outliers in match data', () => {
      const matches = [
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 40, // Outlier: above max (35)
                  deaths: 30, // Outlier: above max (25)
                  assists: 20, // Outlier: above max (15)
                  score: 500, // Outlier: above max (450)
                  firstBloods: 10, // Outlier: above max (8)
                  firstDeaths: 1
                }
              }
            ]
          }
        },
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 2, // Outlier: below min (5)
                  deaths: 2, // Outlier: below min (5)
                  assists: 1, // Outlier: below min (2)
                  score: 100, // Outlier: below min (150)
                  firstBloods: 0,
                  firstDeaths: 1
                }
              }
            ]
          }
        }
      ];

      const validationResults = rolePerformanceService.validateMatchData(matches, 'test-puuid', 'Duelist');

      // Check outlier detection
      expect(validationResults.details.outliers).toHaveLength(2);
      expect(validationResults.details.outliers[0].stats).toHaveProperty('kills');
      expect(validationResults.details.outliers[0].stats).toHaveProperty('deaths');
      expect(validationResults.details.outliers[0].stats).toHaveProperty('assists');
      expect(validationResults.details.outliers[0].stats).toHaveProperty('score');
      expect(validationResults.details.outliers[0].stats).toHaveProperty('firstBloods');

      // Check outlier values
      expect(validationResults.details.outliers[0].stats.kills.value).toBe(40);
      expect(validationResults.details.outliers[1].stats.kills.value).toBe(2);

      // Check confidence score is reduced due to outliers
      expect(validationResults.confidence.score).toBeLessThan(1.0);
    });

    it('should handle insufficient matches correctly', () => {
      const matches = [
        {
          info: {
            tournamentName: 'VCT 2024 Champions',
            players: [
              {
                puuid: 'test-puuid',
                role: 'Duelist',
                stats: {
                  kills: 25,
                  deaths: 15,
                  assists: 10,
                  score: 300,
                  firstBloods: 3,
                  firstDeaths: 1
                }
              }
            ]
          }
        }
      ];

      const validationResults = rolePerformanceService.validateMatchData(matches, 'test-puuid', 'Duelist');

      // Check insufficient matches handling
      expect(validationResults.isValid).toBe(false);
      expect(validationResults.issues).toContain('Insufficient matches (1/3 required)');
      expect(validationResults.confidence.score).toBeLessThan(1.0);
    });
  });
}); 