// __tests__/controllers/player.controller.basic.test.js
const playerController = require('../../src/controllers/player.controller');

// Mock the database models
jest.mock('../../src/models', () => ({
  Player: {
    findAndCountAll: jest.fn().mockResolvedValue({
      rows: [
        { id: 1, name: 'Player 1', rating: 1.2 },
        { id: 2, name: 'Player 2', rating: 1.3 }
      ],
      count: 2
    }),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Player 1',
      rating: 1.2
    })
  },
  Sequelize: {
    Op: {
      iLike: Symbol('iLike'),
      gte: Symbol('gte'),
      lte: Symbol('lte')
    }
  }
}));

describe('Player Controller Basic Tests', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all players', async () => {
      const req = { query: {} };
      await playerController.findAll(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(Array),
        total: expect.any(Number)
      }));
    });

    it('should handle errors', async () => {
      const req = { query: {} };
      const error = new Error('Database error');
      require('../../src/models').Player.findAndCountAll.mockRejectedValueOnce(error);
      
      await playerController.findAll(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });

  describe('findOne', () => {
    it('should return a player by id', async () => {
      const req = { params: { id: 1 } };
      await playerController.findOne(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'Player 1'
      }));
    });

    it('should return 404 for non-existent player', async () => {
      const req = { params: { id: 999 } };
      require('../../src/models').Player.findByPk.mockResolvedValueOnce(null);
      
      await playerController.findOne(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('not found')
      }));
    });
  });
}); 