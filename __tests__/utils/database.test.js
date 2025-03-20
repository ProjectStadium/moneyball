// __tests__/utils/database.test.js
const { Sequelize } = require('sequelize');

// Mock environment variables before importing
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'moneyball_test';
process.env.POSTGRES_USER = 'esports_user';
process.env.POSTGRES_PASSWORD = 'FourZero26!';
process.env.NODE_ENV = 'test';

// Mock Sequelize
jest.mock('sequelize', () => {
  const mockSequelizeInstance = {
    authenticate: jest.fn(),
    define: jest.fn().mockReturnValue({}),
    sync: jest.fn().mockResolvedValue(true)
  };
  
  const MockSequelize = jest.fn(() => mockSequelizeInstance);
  MockSequelize.prototype.authenticate = mockSequelizeInstance.authenticate;
  
  return {
    Sequelize: MockSequelize
  };
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('Database Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Reset module cache for each test
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  afterAll(() => {
    mockExit.mockRestore();
  });
  
  test('should create Sequelize instance with correct parameters', () => {
    // This will trigger database.js to be evaluated
    const sequelize = require('../../src/utils/database');
    
    // Verify Sequelize constructor was called with correct params
    expect(Sequelize).toHaveBeenCalledWith(
      'test_db',
      'test_user',
      'test_password',
      expect.objectContaining({
        host: 'localhost',
        port: '5432',
        dialect: 'postgres'
      })
    );
  });
  
  test('should test database connection on load', () => {
    // This will trigger database.js to be evaluated and testConnection to be called
    const sequelize = require('../../src/utils/database');
    const sequelizeInstance = Sequelize();
    
    // Verify authenticate was called
    expect(sequelizeInstance.authenticate).toHaveBeenCalled();
  });
  
  test('should handle successful authentication', async () => {
    // Setup - mock successful connection
    const sequelizeInstance = Sequelize();
    sequelizeInstance.authenticate.mockResolvedValue();
    
    // Load database module which will call testConnection
    const sequelize = require('../../src/utils/database');
    
    // Trigger authenticate promise resolution
    await new Promise(process.nextTick);
    
    // Verify success message
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/connection has been established successfully/i)
    );
  });
  
  test('should exit process on authentication failure', async () => {
    // Setup - mock failed connection
    const sequelizeInstance = Sequelize();
    sequelizeInstance.authenticate.mockRejectedValue(new Error('Auth failed'));
    
    // Load database module which will call testConnection
    const sequelize = require('../../src/utils/database');
    
    // Trigger authenticate promise rejection
    await new Promise(process.nextTick);
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Unable to connect to the database/i),
      expect.any(Error)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('should exit if required env vars are missing', () => {
    // Setup - save current env and remove required var
    const originalEnv = { ...process.env };
    delete process.env.POSTGRES_HOST;
    
    // Try to load the database module
    expect(() => {
      require('../../src/utils/database');
    }).not.toThrow();
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Missing required environment variable: POSTGRES_HOST/i)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    
    // Restore env for subsequent tests
    process.env = originalEnv;
  });
  
  test('should use environment-specific logging settings', () => {
    // Test with development environment
    process.env.NODE_ENV = 'development';
    const devSequelize = require('../../src/utils/database');
    expect(Sequelize).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        logging: expect.any(Function) // console.log in development
      })
    );
    
    // Reset for production test
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    const prodSequelize = require('../../src/utils/database');
    expect(Sequelize).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        logging: false // No logging in production
      })
    );
    
    // Reset for test environment
    process.env.NODE_ENV = 'test';
  });
});