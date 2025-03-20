// filepath: a:\moneyball\__mocks__\sequelize.js
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

module.exports = {
  Sequelize: SequelizeMock,
  DataTypes: DataTypesMock,
  Op: {
    in: jest.fn(),
    ne: jest.fn(),
    gte: jest.fn(),
  },
};