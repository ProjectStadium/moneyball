// __tests__/mocks/scheduler.service.mock.js
module.exports = {
    init: jest.fn(),
    addToQueue: jest.fn(),
    startQueueProcessor: jest.fn(),
    processNextInQueue: jest.fn(),
    scheduleBasicDataUpdate: jest.fn(),
    scheduleDetailedPlayerUpdate: jest.fn(),
    scheduleEarningsUpdates: jest.fn(),
    updatePlayerDetails: jest.fn().mockResolvedValue({ success: true, message: 'Player update scheduled' }),
    triggerFullRefresh: jest.fn().mockResolvedValue({ success: true, message: 'Full data refresh scheduled' }),
    getQueueStatus: jest.fn().mockReturnValue({
      queue_length: 0,
      active_requests: 0,
      is_running: false,
      priority_distribution: {}
    })
  };