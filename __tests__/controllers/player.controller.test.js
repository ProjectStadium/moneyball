// __tests__/controllers/player.controller.test.js
const { Op } = require('sequelize');

// Create mock operators that match Sequelize's Op symbols
const mockOp = {
  iLike: Symbol.for('iLike'),
  gte: Symbol.for('gte'),
  lte: Symbol.for('lte'),
  in: Symbol.for('in'),
  not: Symbol.for('not')
};

// Mock the database models with a more robust implementation
jest.mock('../../src/models', () => {
  // Create a deep copy of sample data to prevent test pollution
  const players = JSON.parse(JSON.stringify(require('../helpers/test-data').samplePlayers));
  
  const findAndFilterPlayers = (options = {}) => {
    let results = [...players];
    
    // Apply filters based on options.where
    if (options.where) {
      // Filter by name
      if (options.where.name && options.where.name[mockOp.iLike]) {
        const pattern = options.where.name[mockOp.iLike].replace(/%/g, '');
        results = results.filter(p => p.name.toLowerCase().includes(pattern.toLowerCase()));
      }
      
      // Filter by team abbreviation
      if (options.where.team_abbreviation) {
        results = results.filter(p => p.team_abbreviation === options.where.team_abbreviation);
      }
      
      // Filter by free agent status
      if (options.where.is_free_agent !== undefined) {
        results = results.filter(p => p.is_free_agent === options.where.is_free_agent);
      }
      
      // Filter by rating range
      if (options.where.rating) {
        if (options.where.rating[mockOp.gte]) {
          results = results.filter(p => p.rating >= options.where.rating[mockOp.gte]);
        }
        if (options.where.rating[mockOp.lte]) {
          results = results.filter(p => p.rating <= options.where.rating[mockOp.lte]);
        }
      }
    }
    
    // Apply order
    if (options.order && options.order.length) {
      const [field, direction] = options.order[0];
      results.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        return direction === 'ASC' ? aVal - bVal : bVal - aVal;
      });
    }
    
    // Apply pagination
    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      results = results.slice(offset, offset + options.limit);
    }
    
    return results;
  };
  
  return {
    Player: {
      findAll: jest.fn((options = {}) => findAndFilterPlayers(options)),
      findAndCountAll: jest.fn((options = {}) => {
        const results = findAndFilterPlayers(options);
        return {
          rows: results,
          count: results.length
        };
      }),
      findByPk: jest.fn((id) => players.find(p => p.id === id)),
      findOne: jest.fn((options = {}) => {
        if (options.where) {
          if (options.where.id) {
            return players.find(p => p.id === options.where.id);
          }
          if (options.where.name) {
            return players.find(p => p.name === options.where.name);
          }
        }
        return null;
      }),
      create: jest.fn((data) => {
        const newPlayer = {
          id: players.length + 1,
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        };
        players.push(newPlayer);
        return newPlayer;
      }),
      update: jest.fn((data, options) => {
        const player = players.find(p => p.id === options.where.id);
        if (player) {
          Object.assign(player, data, { updated_at: new Date() });
        }
        return [1, [player]];
      }),
      destroy: jest.fn((options) => {
        const player = players.find(p => p.id === options.where.id);
        if (player) {
          const index = players.findIndex(p => p.id === player.id);
          if (index > -1) {
            players.splice(index, 1);
          }
          return 1;
        }
        return 0;
      })
    },
    Team: {
      findAll: jest.fn(() => []),
      findByPk: jest.fn(() => null),
      findOne: jest.fn(() => null)
    },
    Sequelize: {
      Op: mockOp
    }
  };
});

// Import after mocks are defined
const playerController = require('../../src/controllers/player.controller');
const { samplePlayers } = require('../helpers/test-data');
const db = require('../../src/models');

// Mock response object with proper tracking of status and response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Player Controller', () => {
  let res;

  beforeEach(() => {
    res = mockResponse();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should get all players', async () => {
      // Arrange
      const req = { query: {} };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // No error status set
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('data');
      expect(responseData).toHaveProperty('total');
      expect(responseData).toHaveProperty('limit');
      expect(responseData).toHaveProperty('offset');
    });

    it('should handle filtering by name', async () => {
      // Arrange
      const req = { query: { name: 'Test' } };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything()
          })
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle filtering by team_abbreviation', async () => {
      // Arrange
      const req = { query: { team_abbreviation: 'TST' } };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            team_abbreviation: 'TST'
          })
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle filtering by free agent status', async () => {
      // Arrange
      const req = { query: { is_free_agent: 'true' } };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_free_agent: true
          })
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle filtering by rating range', async () => {
      // Arrange
      const req = { query: { min_rating: '1.1', max_rating: '1.3' } };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: expect.anything()
          })
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const req = { query: { limit: '10', offset: '20' } };
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = { query: {} };
      
      // Mock a database error
      db.Player.findAndCountAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.findAll(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('findOne', () => {
    it('should get a player by id', async () => {
      // Arrange
      const playerId = samplePlayers[0].id;
      const req = { params: { id: playerId } };
      
      // Setup mock to return a specific player
      db.Player.findByPk.mockResolvedValueOnce(samplePlayers[0]);
      
      // Act
      await playerController.findOne(req, res);
      
      // Assert
      expect(db.Player.findByPk).toHaveBeenCalledWith(playerId);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: playerId,
          name: samplePlayers[0].name
        })
      );
    });

    it('should return 404 for non-existent player', async () => {
      // Arrange
      const req = { params: { id: 'non-existent-id' } };
      
      // Mock findByPk to return null
      db.Player.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await playerController.findOne(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found')
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = { params: { id: samplePlayers[0].id } };
      
      // Mock a database error
      db.Player.findByPk.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.findOne(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error retrieving player')
        })
      );
    });
  });

  describe('getTopPlayers', () => {
    it('should get top players by rating', async () => {
      // Arrange
      const req = { query: { stat: 'rating', limit: '5' } };
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: expect.anything()
          }),
          order: [['rating', 'DESC']],
          limit: 5
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle invalid stat parameter', async () => {
      // Arrange
      const req = { query: { stat: 'invalid_stat' } };
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid stat parameter')
        })
      );
    });

    it('should filter out players with null stats', async () => {
      // Arrange
      const req = { query: { stat: 'acs' } };
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            acs: expect.objectContaining({
              [mockOp.not]: null
            })
          })
        })
      );
    });

    it('should handle different stat combinations', async () => {
      // Arrange
      const stats = ['acs', 'kd_ratio', 'adr', 'kpr', 'apr', 'fk_pr', 'hs_pct'];
      
      // Act & Assert
      for (const stat of stats) {
        const req = { query: { stat } };
        await playerController.getTopPlayers(req, res);
        
        expect(db.Player.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              [stat]: expect.anything()
            }),
            order: [[stat, 'DESC']]
          })
        );
      }
    });

    it('should filter free agents when specified', async () => {
      // Arrange
      const req = { query: { stat: 'rating', is_free_agent: 'true' } };
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_free_agent: true,
            rating: expect.anything()
          })
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const req = { query: { stat: 'rating' } };
      db.Player.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
  });

  describe('getPlayersByTeam', () => {
    it('should get all players for a team', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'TST' } };
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { team_abbreviation: 'TST' },
          order: [['rating', 'DESC']]
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle team with no players', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'EMPTY' } };
      db.Player.findAll.mockResolvedValueOnce([]);
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'TST' } };
      db.Player.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
  });

  describe('getFreeAgents', () => {
    it('should get all free agents', async () => {
      // Arrange
      const req = { query: {} };
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_free_agent: true,
            rating: expect.anything()
          }),
          order: [['rating', 'DESC']]
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should filter free agents by minimum rating', async () => {
      // Arrange
      const req = { query: { min_rating: '1.5' } };
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_free_agent: true,
            rating: expect.objectContaining({
              [mockOp.gte]: 1.5
            })
          })
        })
      );
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const req = { query: { limit: '10', offset: '20' } };
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const req = { query: {} };
      db.Player.findAndCountAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
  });
});