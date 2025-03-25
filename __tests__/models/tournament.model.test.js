const { sequelize } = require('../../src/utils/database');
const Tournament = require('../../src/models/tournament.model')(sequelize);

describe('Tournament Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a tournament with required fields', async () => {
    const tournament = await Tournament.create({
      name: 'Test Tournament',
      liquipedia_url: 'https://liquipedia.net/test',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-07'),
      prize_pool: 10000.00,
      region: 'NA',
      organizer: 'Test Org'
    });

    expect(tournament.id).toBeDefined();
    expect(tournament.name).toBe('Test Tournament');
    expect(tournament.status).toBe('upcoming'); // Default value
    expect(tournament.type).toBe('other'); // Default value
    expect(tournament.currency).toBe('USD'); // Default value
  });

  it('should handle JSON fields correctly', async () => {
    const format = {
      type: 'double_elimination',
      teams: 16,
      rounds: ['quarterfinals', 'semifinals', 'finals']
    };

    const participants = [
      { team: 'Team A', seed: 1 },
      { team: 'Team B', seed: 2 }
    ];

    const results = {
      winner: 'Team A',
      runner_up: 'Team B',
      final_score: '3-1'
    };

    const statistics = {
      total_matches: 15,
      total_rounds: 4,
      average_match_duration: '45:00'
    };

    const tournament = await Tournament.create({
      name: 'JSON Test Tournament',
      liquipedia_url: 'https://liquipedia.net/json-test',
      start_date: new Date('2024-02-01'),
      format,
      participants,
      results,
      statistics
    });

    expect(tournament.format).toEqual(format);
    expect(tournament.participants).toEqual(participants);
    expect(tournament.results).toEqual(results);
    expect(tournament.statistics).toEqual(statistics);
  });

  it('should enforce unique liquipedia_url', async () => {
    const tournamentData = {
      name: 'Duplicate URL Test',
      liquipedia_url: 'https://liquipedia.net/duplicate',
      start_date: new Date('2024-03-01')
    };

    await Tournament.create(tournamentData);

    await expect(Tournament.create(tournamentData)).rejects.toThrow();
  });

  it('should handle enum fields correctly', async () => {
    const tournament = await Tournament.create({
      name: 'Enum Test Tournament',
      liquipedia_url: 'https://liquipedia.net/enum-test',
      start_date: new Date('2024-04-01'),
      status: 'ongoing',
      type: 'major'
    });

    expect(tournament.status).toBe('ongoing');
    expect(tournament.type).toBe('major');

    // Test invalid enum values
    await expect(Tournament.create({
      name: 'Invalid Status',
      liquipedia_url: 'https://liquipedia.net/invalid-status',
      start_date: new Date('2024-05-01'),
      status: 'invalid_status'
    })).rejects.toThrow();

    await expect(Tournament.create({
      name: 'Invalid Type',
      liquipedia_url: 'https://liquipedia.net/invalid-type',
      start_date: new Date('2024-06-01'),
      type: 'invalid_type'
    })).rejects.toThrow();
  });

  it('should update last_updated timestamp', async () => {
    const tournament = await Tournament.create({
      name: 'Timestamp Test',
      liquipedia_url: 'https://liquipedia.net/timestamp-test',
      start_date: new Date('2024-07-01')
    });

    const initialUpdate = tournament.last_updated;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await tournament.update({ name: 'Updated Name' });
    
    expect(tournament.last_updated.getTime()).toBeGreaterThan(initialUpdate.getTime());
  });
}); 