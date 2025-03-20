// __tests__/mocks/liquipedia.service.mock.js
module.exports = {
    makeRequest: jest.fn(),
    respectRateLimit: jest.fn(),
    searchPlayer: jest.fn().mockResolvedValue([]),
    getPlayerEarnings: jest.fn().mockResolvedValue({
      total: 50000,
      by_year: {},
      tournaments: []
    }),
    updatePlayerEarnings: jest.fn().mockResolvedValue(true),
    processPlayerEarnings: jest.fn().mockResolvedValue({
      success: true,
      player_name: 'TestPlayer',
      total_earnings: 50000,
      tournaments_count: 5
    }),
    queueEarningsUpdates: jest.fn().mockResolvedValue({
      success: true,
      queued_players: 5,
      divisions: ['T1', 'T2']
    })
  };