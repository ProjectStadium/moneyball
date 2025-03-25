// __tests__/controllers/team.controller.test.js
const teamController = require('../../src/controllers/team.controller');
const db = require('../../src/models');
const { sampleTeams } = require('../helpers/test-data');
const { Team, Player } = require('../../src/models');
const { Op } = require('sequelize');

// Mock the database models
jest.mock('../../src/models', () => ({
  Team: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn()
  },
  Player: {
    findAll: jest.fn()
  }
}));

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Team Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset request and response objects before each test
    req = {
      params: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should get all teams with default pagination', async () => {
      // Arrange
      const mockTeams = {
        count: 2,
        rows: [
          { id: 1, team_abbreviation: 'TEST1', full_team_name: 'Test Team 1', rank: 1 },
          { id: 2, team_abbreviation: 'TEST2', full_team_name: 'Test Team 2', rank: 2 }
        ]
      };
      Team.findAndCountAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.findAll(req, res);

      // Assert
      expect(Team.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 100,
        offset: 0,
        order: [['rank', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith({
        total: 2,
        limit: 100,
        offset: 0,
        data: mockTeams.rows
      });
    });

    it('should handle filtering by name', async () => {
      // Arrange
      req.query.name = 'Test';
      const mockTeams = {
        count: 1,
        rows: [{ id: 1, team_abbreviation: 'TEST', full_team_name: 'Test Team', rank: 1 }]
      };
      Team.findAndCountAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.findAll(req, res);

      // Assert
      expect(Team.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              { team_abbreviation: { [Op.iLike]: '%Test%' } },
              { full_team_name: { [Op.iLike]: '%Test%' } },
              { tag: { [Op.iLike]: '%Test%' } }
            ])
          })
        })
      );
    });

    it('should handle filtering by region and rank range', async () => {
      // Arrange
      req.query.region = 'NA';
      req.query.min_rank = '1';
      req.query.max_rank = '10';
      const mockTeams = {
        count: 1,
        rows: [{ id: 1, team_abbreviation: 'TEST', full_team_name: 'Test Team', rank: 5 }]
      };
      Team.findAndCountAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.findAll(req, res);

      // Assert
      expect(Team.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            region: 'NA',
            rank: {
              [Op.gte]: 1,
              [Op.lte]: 10
            }
          })
        })
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      Team.findAndCountAll.mockRejectedValueOnce(error);

      // Act
      await teamController.findAll(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('findOne', () => {
    it('should get a team by UUID', async () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      req.params.id = uuid;
      const mockTeam = { id: uuid, team_abbreviation: 'TEST', full_team_name: 'Test Team' };
      Team.findByPk.mockResolvedValueOnce(mockTeam);

      // Act
      await teamController.findOne(req, res);

      // Assert
      expect(Team.findByPk).toHaveBeenCalledWith(uuid);
      expect(res.json).toHaveBeenCalledWith(mockTeam);
    });

    it('should get a team by abbreviation', async () => {
      // Arrange
      req.params.id = 'TEST';
      const mockTeam = { id: 1, team_abbreviation: 'TEST', full_team_name: 'Test Team' };
      Team.findOne.mockResolvedValueOnce(mockTeam);

      // Act
      await teamController.findOne(req, res);

      // Assert
      expect(Team.findOne).toHaveBeenCalledWith({
        where: { team_abbreviation: 'TEST' }
      });
      expect(res.json).toHaveBeenCalledWith(mockTeam);
    });

    it('should return 404 for non-existent team', async () => {
      // Arrange
      req.params.id = 'NONEXISTENT';
      Team.findOne.mockResolvedValueOnce(null);

      // Act
      await teamController.findOne(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Team with id/abbreviation NONEXISTENT not found.'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.params.id = 'TEST';
      const error = new Error('Database error');
      Team.findOne.mockRejectedValueOnce(error);

      // Act
      await teamController.findOne(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Error retrieving team with id/abbreviation TEST'
      });
    });
  });

  describe('getTeamRoster', () => {
    it('should get team roster by UUID', async () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      req.params.id = uuid;
      const mockTeam = { team_abbreviation: 'TEST' };
      const mockPlayers = [
        { id: 1, name: 'Player 1', rating: 100 },
        { id: 2, name: 'Player 2', rating: 90 }
      ];
      Team.findByPk.mockResolvedValueOnce(mockTeam);
      Player.findAll.mockResolvedValueOnce(mockPlayers);

      // Act
      await teamController.getTeamRoster(req, res);

      // Assert
      expect(Team.findByPk).toHaveBeenCalledWith(uuid);
      expect(Player.findAll).toHaveBeenCalledWith({
        where: { team_abbreviation: 'TEST' },
        order: [['rating', 'DESC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    it('should get team roster by abbreviation', async () => {
      // Arrange
      req.params.id = 'TEST';
      const mockPlayers = [
        { id: 1, name: 'Player 1', rating: 100 },
        { id: 2, name: 'Player 2', rating: 90 }
      ];
      Player.findAll.mockResolvedValueOnce(mockPlayers);

      // Act
      await teamController.getTeamRoster(req, res);

      // Assert
      expect(Player.findAll).toHaveBeenCalledWith({
        where: { team_abbreviation: 'TEST' },
        order: [['rating', 'DESC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    it('should return 404 for non-existent team when using UUID', async () => {
      // Arrange
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      Team.findByPk.mockResolvedValueOnce(null);

      // Act
      await teamController.getTeamRoster(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Team with id 123e4567-e89b-12d3-a456-426614174000 not found.'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      req.params.id = 'TEST';
      const error = new Error('Database error');
      Player.findAll.mockRejectedValueOnce(error);

      // Act
      await teamController.getTeamRoster(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('getTeamsByRegion', () => {
    it('should get teams by region', async () => {
      // Arrange
      req.params.region = 'NA';
      const mockTeams = [
        { id: 1, team_abbreviation: 'TEST1', region: 'NA', rank: 1 },
        { id: 2, team_abbreviation: 'TEST2', region: 'NA', rank: 2 }
      ];
      Team.findAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.getTeamsByRegion(req, res);

      // Assert
      expect(Team.findAll).toHaveBeenCalledWith({
        where: { region: 'NA' },
        order: [['rank', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockTeams);
    });

    it('should handle database errors', async () => {
      // Arrange
      req.params.region = 'NA';
      const error = new Error('Database error');
      Team.findAll.mockRejectedValueOnce(error);

      // Act
      await teamController.getTeamsByRegion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('getTopTeams', () => {
    it('should get top teams with default limit', async () => {
      // Arrange
      const mockTeams = [
        { id: 1, team_abbreviation: 'TEST1', rank: 1 },
        { id: 2, team_abbreviation: 'TEST2', rank: 2 }
      ];
      Team.findAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.getTopTeams(req, res);

      // Assert
      expect(Team.findAll).toHaveBeenCalledWith({
        order: [['rank', 'ASC']],
        limit: 10
      });
      expect(res.json).toHaveBeenCalledWith(mockTeams);
    });

    it('should get top teams with custom limit', async () => {
      // Arrange
      req.query.limit = '5';
      const mockTeams = [
        { id: 1, team_abbreviation: 'TEST1', rank: 1 },
        { id: 2, team_abbreviation: 'TEST2', rank: 2 }
      ];
      Team.findAll.mockResolvedValueOnce(mockTeams);

      // Act
      await teamController.getTopTeams(req, res);

      // Assert
      expect(Team.findAll).toHaveBeenCalledWith({
        order: [['rank', 'ASC']],
        limit: 5
      });
      expect(res.json).toHaveBeenCalledWith(mockTeams);
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      Team.findAll.mockRejectedValueOnce(error);

      // Act
      await teamController.getTopTeams(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });
});