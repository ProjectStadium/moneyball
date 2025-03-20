// __tests__/models/team.model.test.js
const db = require('../../src/models');
const { sequelize } = db;
const Team = db.Team;
const Player = db.Player;
const { v4: uuidv4 } = require('uuid');

// Mock UUID for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'team-uuid-5678')
}));

describe('Team Model', () => {
  // Clear database before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Clear database after each test
  afterEach(async () => {
    await Team.destroy({ where: {}, truncate: true, cascade: true });
  });

  // Close database connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Test team creation with required fields
  test('should create a team with required fields', async () => {
    const teamData = {
      team_abbreviation: 'TST'
    };

    const team = await Team.create(teamData);
    expect(team).toBeDefined();
    expect(team.id).toBeTruthy();
    expect(team.team_abbreviation).toBe('TST');
  });

  // Test team creation failure without required fields
  test('should not create a team without the required team_abbreviation field', async () => {
    const teamData = {
      full_team_name: 'Test Team'
    };

    await expect(Team.create(teamData)).rejects.toThrow();
  });

  // Test team creation with all fields
  test('should create a team with all fields', async () => {
    const teamData = {
      team_abbreviation: 'FULL',
      full_team_name: 'Full Test Team',
      tag: 'FTT',
      region: 'EMEA',
      country: 'Test Country',
      country_code: 'TC',
      rank: 10,
      score: 85.5,
      record: '15-5',
      earnings: 75000.50,
      founded_year: 2022,
      game: 'VALORANT',
      logo_url: 'https://example.com/logo.png'
    };

    const team = await Team.create(teamData);
    expect(team).toBeDefined();
    expect(team.team_abbreviation).toBe('FULL');
    expect(team.full_team_name).toBe('Full Test Team');
    expect(team.region).toBe('EMEA');
    expect(team.rank).toBe(10);
    expect(parseFloat(team.earnings)).toBe(75000.50);
    expect(team.founded_year).toBe(2022);
  });

  // Test unique constraint on team_abbreviation field
  test('should not create teams with duplicate team_abbreviations', async () => {
    const teamData = {
      team_abbreviation: 'UNQ'
    };

    await Team.create(teamData);
    await expect(Team.create(teamData)).rejects.toThrow();
  });

  // Test team-player associations
  test('should associate teams with players correctly', async () => {
    // Create a team
    const team = await Team.create({
      team_abbreviation: 'TSM',
      full_team_name: 'Team SoloMid'
    });

    // Create players associated with the team
    await Player.bulkCreate([
      { name: 'TSMPlayer1', team_abbreviation: 'TSM', is_free_agent: false },
      { name: 'TSMPlayer2', team_abbreviation: 'TSM', is_free_agent: false },
      { name: 'FreeAgent', is_free_agent: true }
    ]);

    // Find the team with its associated players
    const teamWithPlayers = await Team.findOne({
      where: { team_abbreviation: 'TSM' },
      include: [{ model: Player }]
    });

    expect(teamWithPlayers.Players).toBeDefined();
    expect(teamWithPlayers.Players).toHaveLength(2);
    expect(teamWithPlayers.Players[0].name).toMatch(/TSMPlayer/);
    expect(teamWithPlayers.Players[1].name).toMatch(/TSMPlayer/);
  });

  // Test query capabilities
  test('should be able to query teams by various fields', async () => {
    // Create multiple teams for querying
    await Team.bulkCreate([
      { team_abbreviation: 'TM1', region: 'NA', rank: 1 },
      { team_abbreviation: 'TM2', region: 'EMEA', rank: 2 },
      { team_abbreviation: 'TM3', region: 'NA', rank: 3 }
    ]);

    // Query by region
    const naTeams = await Team.findAll({ where: { region: 'NA' } });
    expect(naTeams).toHaveLength(2);

    // Query by rank
    const topTeam = await Team.findOne({ 
      where: { rank: 1 }
    });
    expect(topTeam).toBeDefined();
    expect(topTeam.team_abbreviation).toBe('TM1');

    // Query with ordering
    const orderedTeams = await Team.findAll({
      order: [['rank', 'ASC']]
    });
    expect(orderedTeams).toHaveLength(3);
    expect(orderedTeams[0].team_abbreviation).toBe('TM1');
    expect(orderedTeams[1].team_abbreviation).toBe('TM2');
    expect(orderedTeams[2].team_abbreviation).toBe('TM3');
  });

  // Test updating team information
  test('should update team information correctly', async () => {
    const team = await Team.create({
      team_abbreviation: 'UPD',
      full_team_name: 'Update Team',
      rank: 20
    });

    // Update team information
    team.rank = 5;
    team.score = 95.2;
    await team.save();

    // Fetch updated team
    const updatedTeam = await Team.findByPk(team.id);
    expect(updatedTeam.rank).toBe(5);
    expect(parseFloat(updatedTeam.score)).toBe(95.2);
  });
});