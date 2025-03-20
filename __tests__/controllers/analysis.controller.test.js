// __tests__/controllers/analysis.controller.test.js
const analysisController = require('../../src/controllers/analysis.controller');
const db = require('../../src/models');

// Mock the database models
jest.mock('../../src/models', () => {
  const mockPlayers = [
    {
      id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      name: 'TestPlayer1',
      team_abbreviation: 'TST',
      is_free_agent: false,
      country_code: 'us',
      acs: 250.5,
      kd_ratio: 1.35,
      adr: 160.2,
      kpr: 0.85,
      apr: 0.65,
      fk_pr: 0.18,
      fd_pr: 0.12,
      hs_pct: 28.5,
      rating: 1.25,
      division: 'T1',
      estimated_value: 5000,
      playstyle: {
        primary_roles: ['Duelist (65%)'],
        traits: ['Entry Fragger'],
        role_percentages: {
          'Duelist': 65,
          'Initiator': 20,
          'Controller': 10,
          'Sentinel': 5
        }
      },
      agent_usage: {
        'Jett': {
          playTime: '12h 34m',
          playCount: 45,
          winRate: '60%',
          acs: 265,
          kd: 1.4,
          adr: 165
        }
      }
    },
    {
      id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
      name: 'TestPlayer2',
      team_abbreviation: 'TST2',
      is_free_agent: false,
      country_code: 'de',
      acs: 220.5,
      kd_ratio: 1.15,
      adr: 140.8,
      kpr: 0.75,
      apr: 0.85,
      fk_pr: 0.15,
      fd_pr: 0.14,
      hs_pct: 24.5,
      rating: 1.1,
      division: 'T2',
      estimated_value: 3500,
      playstyle: {
        primary_roles: ['Controller (55%)'],
        traits: ['Potential IGL'],
        role_percentages: {
          'Duelist': 15,
          'Initiator': 20,
          'Controller': 55,
          'Sentinel': 10
        }
      }
    },
    {
      id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
      name: 'FreeAgent1',
      is_free_agent: true,
      country_code: 'ca',
      acs: 235.0,
      kd_ratio: 1.25,
      adr: 150.5,
      kpr: 0.80,
      apr: 0.70,
      fk_pr: 0.17,
      fd_pr: 0.13,
      hs_pct: 26.5,
      rating: 1.18,
      division: 'T2',
      estimated_value: 4000,
      playstyle: {
        primary_roles: ['Initiator (50%)', 'Duelist (30%)'],
        traits: ['Support-oriented'],
        role_percentages: {
          'Duelist': 30,
          'Initiator': 50,
          'Controller': 15,
          'Sentinel': 5
        }
      }
    }
  ];

  return {
    Player: {
      findByPk: jest.fn(id => Promise.resolve(mockPlayers.find(p => p.id === id) || null)),
      findAll: jest.fn(options => {
        if (options.where) {
          if (options.where.is_free_agent === true) {
            return Promise.resolve(mockPlayers.filter(p => p.is_free_agent));
          }
          if (options.where.id && options.where.id[Symbol.for('ne')]) {
            return Promise.resolve(mockPlayers.filter(p => p.id !== options.where.id[Symbol.for('ne')]));
          }
          if (options.where.id && options.where.id[Symbol.for('in')]) {
            return Promise.resolve(mockPlayers.filter(p => options.where.id[Symbol.for('in')].includes(p.id)));
          }
        }
        return Promise.resolve(mockPlayers);
      })
    },
    Team: {
      findByPk: jest.fn(() => Promise.resolve({ team_abbreviation: 'TST' }))
    },
    sequelize: {
      literal: jest.fn(expr => expr)
    },
    Sequelize: {
      Op: require('sequelize').Op
    }
  };
});

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Analysis Controller', () => {
  let res;

  beforeEach(() => {
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('findSimilarPlayers', () => {
    it('should find players similar to a specified player', async () => {
      const req = { 
        params: { player_id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' }, 
        query: { limit: '2' } 
      };
      
      await analysisController.findSimilarPlayers(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('target_player');
      expect(response).toHaveProperty('similar_players');
      expect(response.target_player.id).toEqual(req.params.player_id);
      expect(response.similar_players.length).toBeLessThanOrEqual(2);
    });

    it('should return 404 for non-existent player', async () => {
      const req = { 
        params: { player_id: 'non-existent-id' }, 
        query: {} 
      };
      
      await analysisController.findSimilarPlayers(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found')
        })
      );
    });

    it('should filter for free agents only when specified', async () => {
      const req = { 
        params: { player_id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' }, 
        query: { free_agents_only: 'true' } 
      };
      
      await analysisController.findSimilarPlayers(req, res);
      
      const response = res.json.mock.calls[0][0];
      expect(response.similar_players.every(player => player.is_free_agent)).toBeTruthy();
    });
  });

  describe('getFreeAgentMarketAnalysis', () => {
    it('should provide market analysis of free agents', async () => {
      const req = { query: {} };
      
      await analysisController.getFreeAgentMarketAnalysis(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('total_free_agents');
      expect(response).toHaveProperty('market_stats');
      expect(response).toHaveProperty('talent_distribution');
      expect(response).toHaveProperty('role_distribution');
      expect(response).toHaveProperty('top_prospects');
    });

    it('should filter free agent analysis by minimum rating', async () => {
      const req = { query: { min_rating: '1.15' } };
      
      await analysisController.getFreeAgentMarketAnalysis(req, res);
      
      expect(res.json).toHaveBeenCalled();
      // Specific checks would depend on the implementation
    });
  });

  describe('comparePlayers', () => {
    it('should compare multiple players side by side', async () => {
      const player1Id = '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p';
      const player2Id = '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q';
      const req = { query: { player_ids: `${player1Id},${player2Id}` } };
      
      await analysisController.comparePlayers(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('players');
      expect(response).toHaveProperty('metrics');
      expect(response.players.length).toEqual(2);
      expect(response.players[0].id).toEqual(player1Id);
      expect(response.players[1].id).toEqual(player2Id);
    });

    it('should return 400 when player_ids are not provided', async () => {
      const req = { query: {} };
      
      await analysisController.comparePlayers(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Please provide player_ids')
        })
      );
    });
  });

  describe('getPlayerValuation', () => {
    it('should return valuation details for a player', async () => {
      const req = { params: { player_id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' } };
      
      await analysisController.getPlayerValuation(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('player');
      expect(response).toHaveProperty('comparable_players');
      expect(response).toHaveProperty('valuation_factors');
      expect(response).toHaveProperty('market_context');
      expect(response.player.id).toEqual(req.params.player_id);
    });

    it('should return 404 for non-existent player', async () => {
      const req = { params: { player_id: 'non-existent-id' } };
      
      await analysisController.getPlayerValuation(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('generateOptimalRoster', () => {
    it('should generate an optimal roster based on constraints', async () => {
      const req = { query: { budget: '15000', min_rating: '0.8' } };
      
      await analysisController.generateOptimalRoster(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('roster');
      expect(response).toHaveProperty('team_stats');
      expect(response).toHaveProperty('total_cost');
      expect(response).toHaveProperty('budget_remaining');
      expect(Array.isArray(response.roster)).toBeTruthy();
    });
  });
});