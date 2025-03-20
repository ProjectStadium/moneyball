// __tests__/controllers/player.controller.test.js
const playerController = require('../../src/controllers/player.controller');
const db = require('../../src/models');
const { Op } = require('sequelize');
const { samplePlayers } = require('../helpers/test-data');

// Mock the database models with a more robust implementation
jest.mock('../../src/models', () => {
  // Create a deep copy of sample data to prevent test pollution
  const players = JSON.parse(JSON.stringify(require('../helpers/test-data').samplePlayers));
  
  return {
    Player: {
      // findAll with support for filtering
      findAll: jest.fn((options = {}) => {
        let results = [...players];
        
        // Apply filters based on options.where
        if (options.where) {
          // Filter by name
          if (options.where.name && options.where.name[Symbol.for('iLike')]) {
            const pattern = options.where.name[Symbol.for('iLike')].replace(/%/g, '');
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
            if (options.where.rating[Symbol.for('gte')]) {
              results = results.filter(p => p.rating >= options.where.rating[Symbol.for('gte')]);
            }
            if (options.where.rating[Symbol.for('lte')]) {
              results = results.filter(p => p.rating <= options.where.rating[Symbol.for('lte')]);
            }
          }
          
          // More filter implementations as needed...
        }
        
        // Apply order
        if (options.order && options.order.length) {
          const [field, direction] = options.order[0];
          results.sort((a, b) => {
            return direction === 'DESC' 
              ? b[field] - a[field]
              : a[field] - b[field];
          });
        }
        
        // Apply pagination
        if (options.limit) {
          const offset = options.offset || 0;
          results = results.slice(offset, offset + parseInt(options.limit));
        }
        
        return Promise.resolve(results);
      }),
      
      // findAndCountAll with the same filtering logic
      findAndCountAll: jest.fn((options = {}) => {
        return db.Player.findAll(options).then(rows => {
          return {
            rows,
            count: players.length // Return full count before pagination
          };
        });
      }),
      
      // findByPk to get a player by ID
      findByPk: jest.fn((id) => {
        const player = players.find(p => p.id === id);
        return Promise.resolve(player || null);
      }),
      
      // count to get number of players
      count: jest.fn((options = {}) => {
        return db.Player.findAll(options).then(results => results.length);
      })
    },
    sequelize: {
      literal: jest.fn(str => str)
    },
    Sequelize: {
      Op
    }
  };
});

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
      expect(res.send).toHaveBeenCalledWith(
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
      expect(res.send).toHaveBeenCalledWith(
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error retrieving player')
        })
      );
    });
  });

  describe('getTopPlayers', () => {
    it('should get top players by rating', async () => {
      // Arrange
      const req = { query: { stat: 'rating', limit: '10' } };
      
      // Setup mock to return sorted players
      const sortedPlayers = [...samplePlayers].sort((a, b) => b.rating - a.rating);
      db.Player.findAll.mockResolvedValueOnce(sortedPlayers.slice(0, 10));
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['rating', 'DESC']],
          limit: 10
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should get top players by acs', async () => {
      // Arrange
      const req = { query: { stat: 'acs', limit: '5' } };
      
      // Setup mock to return sorted players
      const sortedPlayers = [...samplePlayers].sort((a, b) => b.acs - a.acs);
      db.Player.findAll.mockResolvedValueOnce(sortedPlayers.slice(0, 5));
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['acs', 'DESC']],
          limit: 5
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should validate the stat parameter', async () => {
      // Arrange
      const req = { query: { stat: 'invalid_stat' } };
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid stat parameter')
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = { query: { stat: 'rating' } };
      
      // Mock a database error
      db.Player.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.getTopPlayers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('getPlayersByTeam', () => {
    it('should get players by team abbreviation', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'TST' } };
      
      // Setup mock to return team players
      const teamPlayers = samplePlayers.filter(p => p.team_abbreviation === 'TST');
      db.Player.findAll.mockResolvedValueOnce(teamPlayers);
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { team_abbreviation: 'TST' }
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should return empty array for team with no players', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'EMPTY' } };
      
      // Setup mock to return empty array
      db.Player.findAll.mockResolvedValueOnce([]);
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = { params: { team_abbreviation: 'TST' } };
      
      // Mock a database error
      db.Player.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await playerController.getPlayersByTeam(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('getFreeAgents', () => {
    it('should get all free agents', async () => {
      // Arrange
      const req = { query: {} };
      
      // Setup mock to return free agents
      const freeAgents = samplePlayers.filter(p => p.is_free_agent);
      db.Player.findAndCountAll.mockResolvedValueOnce({
        rows: freeAgents,
        count: freeAgents.length
      });
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_free_agent: true }
        })
      );
      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('data');
      expect(responseData).toHaveProperty('total');
    });

    it('should filter free agents by minimum rating', async () => {
      // Arrange
      const req = { query: { min_rating: '1.2' } };
      
      // Setup mock to return filtered free agents
      const filteredAgents = samplePlayers.filter(p => 
        p.is_free_agent && p.rating >= 1.2
      );
      db.Player.findAndCountAll.mockResolvedValueOnce({
        rows: filteredAgents,
        count: filteredAgents.length
      });
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_free_agent: true,
            rating: expect.objectContaining({
              [Op.gte]: 1.2
            })
          })
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle pagination for free agents', async () => {
      // Arrange
      const req = { query: { limit: '10', offset: '0' } };
      
      // Act
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(db.Player.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0
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
      await playerController.getFreeAgents(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });
});