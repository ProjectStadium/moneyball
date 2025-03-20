// __tests__/controllers/team.controller.test.js
const teamController = require('../../src/controllers/team.controller');
const db = require('../../src/models');
const { sampleTeams } = require('../helpers/test-data');

// Mock the database models
jest.mock('../../src/models', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  
  // Create a mock Team model
  const TeamMock = dbMock.define('Team', {
    id: '7c0c2a4a-bce4-4e29-8b9a-5271c938921a',
    team_abbreviation: 'TST',
    full_team_name: 'Test Team',
    region: 'NA',
    country: 'United States',
    country_code: 'us',
    rank: 100,
    score: 500
  });

  // Add findAll method with filtering
  const originalFindAll = TeamMock.findAll.bind(TeamMock);
  TeamMock.findAll = jest.fn((options = {}) => {
    // Filter data based on options.where if provided
    if (options.where) {
      if (options.where.region) {
        return originalFindAll({
          where: { region: options.where.region }
        });
      }
      if (options.where.country_code) {
        return originalFindAll({
          where: { country_code: options.where.country_code }
        });
      }
    }
    
    return originalFindAll();
  });

  // Add findAndCountAll method
  TeamMock.findAndCountAll = jest.fn((options = {}) => {
    return TeamMock.findAll(options).then(results => {
      return {
        rows: results,
        count: results.length
      };
    });
  });

  // Add findByPk method
  TeamMock.findByPk = jest.fn((id) => {
    return originalFindAll().then(results => {
      return results.find(team => team.id === id) || null;
    });
  });

  // Add findOne method
  TeamMock.findOne = jest.fn((options = {}) => {
    return originalFindAll().then(results => {
      if (options.where && options.where.team_abbreviation) {
        return results.find(team => team.team_abbreviation === options.where.team_abbreviation) || null;
      }
      return null;
    });
  });

  // Mock Player model as well for team roster tests
  const PlayerMock = dbMock.define('Player', {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    name: 'TestPlayer1',
    team_abbreviation: 'TST'
  });

  // Add custom findAll for Player
  PlayerMock.findAll = jest.fn((options = {}) => {
    if (options.where && options.where.team_abbreviation) {
      return Promise.resolve([{ 
        id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 
        name: 'TestPlayer1', 
        team_abbreviation: options.where.team_abbreviation 
      }]);
    }
    return Promise.resolve([]);
  });

  return {
    Team: TeamMock,
    Player: PlayerMock,
    sequelize: dbMock
  };
});

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Team Controller', () => {
  let res;

  beforeEach(() => {
    res = mockResponse();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should get all teams', async () => {
      const req = { query: {} };
      
      await teamController.findAll(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // No error status set
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('data');
      expect(responseData).toHaveProperty('total');
    });

    it('should handle filtering by name', async () => {
      const req = { query: { name: 'Test' } };
      
      await teamController.findAll(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [expect.any(Symbol)]: expect.any(Array)
          })
        })
      );
    });

    it('should handle filtering by region', async () => {
      const req = { query: { region: 'NA' } };
      
      await teamController.findAll(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            region: 'NA'
          })
        })
      );
    });

    it('should handle database errors', async () => {
      const req = { query: {} };
      
      // Mock a database error
      db.Team.findAndCountAll.mockRejectedValueOnce(new Error('Database error'));
      
      await teamController.findAll(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('findOne', () => {
    it('should get a team by UUID id', async () => {
      const req = { params: { id: '7c0c2a4a-bce4-4e29-8b9a-5271c938921a' } };
      
      await teamController.findOne(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findByPk).toHaveBeenCalledWith(req.params.id);
    });

    it('should get a team by abbreviation', async () => {
      const req = { params: { id: 'TST' } };
      
      await teamController.findOne(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { team_abbreviation: 'TST' }
        })
      );
    });

    it('should return 404 for non-existent team', async () => {
      const req = { params: { id: 'non-existent-id' } };
      
      // Mock findByPk and findOne to return null
      db.Team.findByPk.mockResolvedValueOnce(null);
      db.Team.findOne.mockResolvedValueOnce(null);
      
      await teamController.findOne(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found')
        })
      );
    });

    it('should handle database errors', async () => {
      const req = { params: { id: '7c0c2a4a-bce4-4e29-8b9a-5271c938921a' } };
      
      // Mock a database error
      db.Team.findByPk.mockRejectedValueOnce(new Error('Database error'));
      
      await teamController.findOne(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Error retrieving team')
        })
      );
    });
  });

  describe('getTeamRoster', () => {
    it('should get team roster by UUID id', async () => {
      const req = { params: { id: '7c0c2a4a-bce4-4e29-8b9a-5271c938921a' } };
      
      await teamController.getTeamRoster(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findByPk).toHaveBeenCalledWith(req.params.id);
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { team_abbreviation: 'TST' }
        })
      );
    });

    it('should get team roster by abbreviation', async () => {
      const req = { params: { id: 'TST' } };
      
      await teamController.getTeamRoster(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Player.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { team_abbreviation: 'TST' }
        })
      );
    });

    it('should handle database errors', async () => {
      const req = { params: { id: 'TST' } };
      
      // Mock a database error
      db.Player.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      await teamController.getTeamRoster(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('getTeamsByRegion', () => {
    it('should get teams by region', async () => {
      const req = { params: { region: 'NA' } };
      
      await teamController.getTeamsByRegion(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { region: 'NA' }
        })
      );
    });

    it('should handle database errors', async () => {
      const req = { params: { region: 'NA' } };
      
      // Mock a database error
      db.Team.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      await teamController.getTeamsByRegion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });

  describe('getTopTeams', () => {
    it('should get top teams', async () => {
      const req = { query: { limit: '5' } };
      
      await teamController.getTopTeams(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(db.Team.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['rank', 'ASC']],
          limit: 5
        })
      );
    });

    it('should handle database errors', async () => {
      const req = { query: {} };
      
      // Mock a database error
      db.Team.findAll.mockRejectedValueOnce(new Error('Database error'));
      
      await teamController.getTopTeams(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error')
        })
      );
    });
  });
});