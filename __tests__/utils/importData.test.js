// __tests__/utils/importData.test.js
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');
const importDataUtil = require('../../src/utils/importData');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('papaparse');
jest.mock('uuid');
jest.mock('../../src/models');

describe('Import Data Utility', () => {
  // Original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console methods to prevent noise in test output
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Setup common mocks
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock UUID generation for consistent testing
    uuidv4.mockReturnValue('test-uuid-1234');
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Test importTeamsFromCSV
  test('importTeamsFromCSV should parse and import team data correctly', async () => {
    // Setup mock data
    const mockTeamsCsv = 'team_abbreviation,full_team_name,tag\nTST,Test Team,TT';
    fs.readFileSync.mockReturnValue(mockTeamsCsv);
    
    const mockParsedTeams = {
      data: [
        {
          team_abbreviation: 'TST',
          full_team_name: 'Test Team',
          tag: 'TT',
          region: 'NA',
          country: 'USA',
          rank: 10
        }
      ]
    };
    Papa.parse.mockReturnValue(mockParsedTeams);
    
    // Execute
    await importDataUtil.importTeamsFromCSV();
    
    // Verify
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('updated_esport_teams.csv'),
      'utf8'
    );
    expect(Papa.parse).toHaveBeenCalledWith(mockTeamsCsv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    expect(db.Team.bulkCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        id: 'test-uuid-1234',
        team_abbreviation: 'TST',
        full_team_name: 'Test Team'
      })],
      expect.objectContaining({
        ignoreDuplicates: true,
        updateOnDuplicate: ['team_abbreviation']
      })
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Imported'));
  });
  
  // Test importPlayersFromCSV
  test('importPlayersFromCSV should parse and import player data correctly', async () => {
    // Setup mock data
    const mockPlayersCsv = 'name,team_name,is_free_agent\nTestPlayer,Test Team,false';
    fs.readFileSync.mockReturnValue(mockPlayersCsv);
    
    const mockParsedPlayers = {
      data: [
        {
          name: 'TestPlayer',
          full_identifier: 'TestPlayer#123',
          player_img_url: 'https://example.com/player.png',
          team_name: 'Test Team',
          team_abbreviation: 'TST',
          is_free_agent: 'false',
          acs: 250,
          kd_ratio: 1.2
        }
      ]
    };
    Papa.parse.mockReturnValue(mockParsedPlayers);
    
    // Execute
    await importDataUtil.importPlayersFromCSV();
    
    // Verify
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('valorant_players.csv'),
      'utf8'
    );
    expect(Papa.parse).toHaveBeenCalledWith(mockPlayersCsv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    expect(db.Player.bulkCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        id: 'test-uuid-1234',
        name: 'TestPlayer',
        team_name: 'Test Team',
        is_free_agent: false // Should convert string 'false' to boolean false
      })],
      expect.objectContaining({
        ignoreDuplicates: true,
        updateOnDuplicate: ['name']
      })
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Imported'));
  });
  
  // Test importAllData - success case
  test('importAllData should import teams and players in correct order', async () => {
    // Setup - mock function implementations to succeed
    jest.spyOn(importDataUtil, 'importTeamsFromCSV').mockResolvedValue();
    jest.spyOn(importDataUtil, 'importPlayersFromCSV').mockResolvedValue();
    
    // Execute
    const result = await importDataUtil.importAllData();
    
    // Verify
    expect(importDataUtil.importTeamsFromCSV).toHaveBeenCalled();
    expect(importDataUtil.importPlayersFromCSV).toHaveBeenCalled();
    // Teams should be imported before players (for foreign key relationships)
    const teamImportIndex = importDataUtil.importTeamsFromCSV.mock.invocationCallOrder[0];
    const playerImportIndex = importDataUtil.importPlayersFromCSV.mock.invocationCallOrder[0];
    expect(teamImportIndex).toBeLessThan(playerImportIndex);
    
    expect(result).toEqual({
      success: true,
      message: 'Data import completed successfully'
    });
  });
  
  // Test importAllData - error case
  test('importAllData should handle errors gracefully', async () => {
    // Setup - force an error during team import
    jest.spyOn(importDataUtil, 'importTeamsFromCSV')
      .mockRejectedValue(new Error('Test import error'));
    
    // Execute
    const result = await importDataUtil.importAllData();
    
    // Verify
    expect(importDataUtil.importTeamsFromCSV).toHaveBeenCalled();
    expect(importDataUtil.importPlayersFromCSV).not.toHaveBeenCalled(); // Should not proceed to player import
    expect(result).toEqual({
      success: false,
      error: 'Test import error'
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error importing data:'),
      expect.any(Error)
    );
  });
  
  // Test runImport - success case
  test('runImport should exit with success code on successful import', async () => {
    // Setup
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(importDataUtil, 'importAllData').mockResolvedValue({
      success: true,
      message: 'Import successful'
    });
    
    // Execute
    await importDataUtil.runImport();
    
    // Verify
    expect(importDataUtil.importAllData).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('completed successfully'));
    expect(process.exit).toHaveBeenCalledWith(0);
    
    // Cleanup
    mockExit.mockRestore();
  });
  
  // Test runImport - error case
  test('runImport should exit with error code on failed import', async () => {
    // Setup
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(importDataUtil, 'importAllData').mockResolvedValue({
      success: false,
      error: 'Import failed'
    });
    
    // Execute
    await importDataUtil.runImport();
    
    // Verify
    expect(importDataUtil.importAllData).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Import failed:'), 'Import failed');
    expect(process.exit).toHaveBeenCalledWith(1);
    
    // Cleanup
    mockExit.mockRestore();
  });
  
  // Test Boolean conversion for is_free_agent field
  test('should correctly handle boolean conversion for is_free_agent field', async () => {
    // Setup - various representations of boolean values
    const mockPlayersCsv = 'name,is_free_agent\nPlayer1,true\nPlayer2,false\nPlayer3,TRUE\nPlayer4,FALSE';
    fs.readFileSync.mockReturnValue(mockPlayersCsv);
    
    const mockParsedPlayers = {
      data: [
        { name: 'Player1', is_free_agent: 'true' },
        { name: 'Player2', is_free_agent: 'false' },
        { name: 'Player3', is_free_agent: true },
        { name: 'Player4', is_free_agent: false }
      ]
    };
    Papa.parse.mockReturnValue(mockParsedPlayers);
    
    // Execute
    await importDataUtil.importPlayersFromCSV();
    
    // Verify correct boolean conversion
    const createdPlayers = db.Player.bulkCreate.mock.calls[0][0];
    expect(createdPlayers[0].is_free_agent).toBe(true);
    expect(createdPlayers[1].is_free_agent).toBe(false);
    expect(createdPlayers[2].is_free_agent).toBe(true);
    expect(createdPlayers[3].is_free_agent).toBe(false);
  });
});