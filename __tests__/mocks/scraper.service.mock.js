// __tests__/mocks/scraper.service.mock.js
module.exports = {
    scrapePlayerList: jest.fn().mockResolvedValue([]),
    scrapeAndSavePlayerDetails: jest.fn().mockResolvedValue(true),
    scrapeAllPlayers: jest.fn().mockResolvedValue(5),
    scrapePlayerDetail: jest.fn().mockResolvedValue({
      agent_usage: {},
      playstyle: {},
      division: 'T2',
      tournament_history: []
    }),
    calculateRating: jest.fn().mockReturnValue(1.2),
    estimatePlayerValue: jest.fn().mockReturnValue(3000),
    extractPlayerFromStatsPage: jest.fn(),
    makeRequest: jest.fn()
  };