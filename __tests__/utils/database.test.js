// __tests__/utils/database.test.js
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../src/utils/database');

// Mock Sequelize
jest.mock('sequelize', () => {
  const mockSequelize = {
    authenticate: jest.fn(),
    close: jest.fn(),
    define: jest.fn(),
    models: {}
  };
  
  return {
    Sequelize: jest.fn(() => mockSequelize)
  };
});

describe('Database Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create Sequelize instance with correct parameters', () => {
    // Verify Sequelize constructor was called with correct params
    expect(Sequelize).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        dialect: 'postgres',
        host: expect.any(String),
        port: expect.any(String)
      })
    );
  });

  test('should test database connection on load', async () => {
    // Mock successful authentication
    sequelize.authenticate.mockResolvedValueOnce();

    // Verify authenticate was called
    await sequelize.authenticate();
    expect(sequelize.authenticate).toHaveBeenCalled();
  });

  test('should handle successful authentication', async () => {
    // Mock successful authentication
    sequelize.authenticate.mockResolvedValueOnce();

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log');

    // Test connection
    await sequelize.authenticate();

    // Verify success message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/connection has been established successfully/i)
    );
  });

  test('should exit process on authentication failure', async () => {
    // Mock authentication failure
    const error = new Error('Connection failed');
    sequelize.authenticate.mockRejectedValueOnce(error);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error');

    // Test connection
    await expect(sequelize.authenticate()).rejects.toThrow(error);

    // Verify error handling
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Unable to connect to the database/i),
      expect.any(Error)
    );
  });

  test('should exit if required env vars are missing', () => {
    // Temporarily remove required env vars
    const originalEnv = process.env;
    process.env = {};

    // Spy on process.exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Require the database module
    require('../../src/utils/database');

    // Verify process.exit was called
    expect(exitSpy).toHaveBeenCalledWith(1);

    // Restore env vars
    process.env = originalEnv;
  });

  test('should use environment-specific logging settings', () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';

    // Verify Sequelize was called with development logging
    expect(Sequelize).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        logging: expect.any(Function)
      })
    );
  });
});