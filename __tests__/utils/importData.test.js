// __tests__/utils/importData.test.js
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../../src/utils/database');
const { importData } = require('../../src/utils/importData');

// Mock fs module
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock database models
jest.mock('../../src/models', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  },
  Sequelize: {
    DataTypes: jest.fn(),
    Op: {
      eq: 'eq',
      ne: 'ne'
    }
  },
  Player: {
    bulkCreate: jest.fn().mockResolvedValue(true)
  },
  Team: {
    bulkCreate: jest.fn().mockResolvedValue(true)
  }
}));

describe('Import Data Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should import player data from JSON file', async () => {
    // Mock file system operations
    const mockPlayerData = [
      {
        name: 'Test Player 1',
        team_abbreviation: 'TEST1',
        rating: 1.2
      },
      {
        name: 'Test Player 2',
        team_abbreviation: 'TEST2',
        rating: 1.5
      }
    ];

    fs.readFileSync.mockReturnValue(JSON.stringify(mockPlayerData));

    // Execute import
    await importData('players.json');

    // Verify database operations
    expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
    expect(require('../../src/models').Player.bulkCreate).toHaveBeenCalledWith(
      mockPlayerData,
      expect.any(Object)
    );
  });

  test('should import team data from JSON file', async () => {
    // Mock file system operations
    const mockTeamData = [
      {
        team_abbreviation: 'TEST1',
        full_team_name: 'Test Team 1',
        region: 'NA'
      },
      {
        team_abbreviation: 'TEST2',
        full_team_name: 'Test Team 2',
        region: 'EU'
      }
    ];

    fs.readFileSync.mockReturnValue(JSON.stringify(mockTeamData));

    // Execute import
    await importData('teams.json');

    // Verify database operations
    expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
    expect(require('../../src/models').Team.bulkCreate).toHaveBeenCalledWith(
      mockTeamData,
      expect.any(Object)
    );
  });

  test('should handle invalid JSON data', async () => {
    // Mock invalid JSON data
    fs.readFileSync.mockReturnValue('invalid json');

    // Execute and verify error handling
    await expect(importData('invalid.json')).rejects.toThrow();
  });

  test('should handle missing file', async () => {
    // Mock file not found error
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    // Execute and verify error handling
    await expect(importData('missing.json')).rejects.toThrow('File not found');
  });

  test('should handle database errors', async () => {
    // Mock valid JSON data
    const mockData = [{ name: 'Test Player' }];
    fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

    // Mock database error
    const dbError = new Error('Database error');
    require('../../src/models').Player.bulkCreate.mockRejectedValueOnce(dbError);

    // Execute and verify error handling
    await expect(importData('players.json')).rejects.toThrow('Database error');
  });
});