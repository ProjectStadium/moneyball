// __tests__/utils/database.test.js
const { Sequelize } = require('sequelize');
const { sequelize, db, testConnection } = require('../../src/utils/database');

jest.mock('sequelize', () => {
  const SequelizeMock = jest.fn(() => ({
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    define: jest.fn().mockReturnValue({
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      bulkCreate: jest.fn(),
    }),
  }));

  const DataTypesMock = {
    STRING: jest.fn(),
    INTEGER: jest.fn(),
    BOOLEAN: jest.fn(),
    DATE: jest.fn(),
    DECIMAL: jest.fn(),
  };

  return {
    Sequelize: SequelizeMock,
    DataTypes: DataTypesMock,
    Op: {
      in: jest.fn(),
      ne: jest.fn(),
      gte: jest.fn(),
    },
  };
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

beforeEach(() => {
  process.env.POSTGRES_HOST = 'localhost';
  process.env.POSTGRES_PORT = '5432';
  process.env.POSTGRES_DB = 'test_db';
  process.env.POSTGRES_USER = 'test_user';
  process.env.POSTGRES_PASSWORD = 'test_password';

  jest.clearAllMocks();
  jest.resetModules();

  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

afterAll(() => {
  mockExit.mockRestore();
});

describe('Database Utility', () => {
  test('should create Sequelize instance with correct parameters', () => {
    expect(Sequelize).toHaveBeenCalledWith(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      expect.objectContaining({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
      })
    );
  });

  test('should test database connection on load', async () => {
    await testConnection();
    expect(sequelize.authenticate).toHaveBeenCalled();
  });

  test('should initialize models correctly', () => {
    expect(sequelize.define).toHaveBeenCalled();
    expect(db.Player).toBeDefined();
    expect(db.Team).toBeDefined();
  });

  test('should set up associations correctly', () => {
    expect(db.Team.hasMany).toHaveBeenCalledWith(db.Player, {
      foreignKey: 'team_abbreviation',
      sourceKey: 'team_abbreviation',
    });
    expect(db.Player.belongsTo).toHaveBeenCalledWith(db.Team, {
      foreignKey: 'team_abbreviation',
      targetKey: 'team_abbreviation',
    });
  });
});