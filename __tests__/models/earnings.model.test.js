const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const { sequelize } = require('../../src/utils/database');
const db = require('../../src/models');

describe('Earnings Model', () => {
  let testPlayer;
  let testTeam;
  let testTournament;

  beforeEach(async () => {
    try {
      // Create test data
      testTeam = await db.Team.create({
        name: 'Test Team',
        abbreviation: 'TEST'
      });
      console.log('Created test team:', testTeam.id);

      testPlayer = await db.Player.create({
        name: 'Test Player',
        team_id: testTeam.id
      });
      console.log('Created test player:', testPlayer.id);

      testTournament = await db.Tournament.create({
        name: 'Test Tournament',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-07'),
        prize_pool: 10000.00
      });
      console.log('Created test tournament:', testTournament.id);
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await db.Earnings.destroy({ where: {} });
      await db.Player.destroy({ where: {} });
      await db.Team.destroy({ where: {} });
      await db.Tournament.destroy({ where: {} });
      console.log('Test data cleaned up');
    } catch (error) {
      console.error('Error in afterAll:', error);
      throw error;
    }
  });

  it('should create earnings with required fields', async () => {
    try {
      const earnings = await db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: testTournament.id,
        amount: 1000.00,
        placement: 1,
        team_id: testTeam.id,
        date: new Date('2024-01-07')
      });

      expect(earnings.id).toBeDefined();
      expect(earnings.currency).toBe('USD'); // Default value
    } catch (error) {
      console.error('Error in create earnings test:', error);
      throw error;
    }
  });

  it('should handle metadata field correctly', async () => {
    try {
      const metadata = {
        prize_pool_percentage: 50,
        team_share: 80,
        player_share: 20,
        notes: 'First place prize'
      };

      const earnings = await db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: testTournament.id,
        amount: 2000.00,
        placement: 2,
        team_id: testTeam.id,
        date: new Date('2024-01-07'),
        metadata
      });

      expect(earnings.metadata).toEqual(metadata);
    } catch (error) {
      console.error('Error in metadata test:', error);
      throw error;
    }
  });

  it('should enforce foreign key constraints', async () => {
    try {
      // Test invalid player_id
      await expect(db.Earnings.create({
        player_id: 'invalid-uuid',
        tournament_id: testTournament.id,
        amount: 1000.00,
        team_id: testTeam.id,
        date: new Date('2024-01-07')
      })).rejects.toThrow();

      // Test invalid tournament_id
      await expect(db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: 'invalid-uuid',
        amount: 1000.00,
        team_id: testTeam.id,
        date: new Date('2024-01-07')
      })).rejects.toThrow();

      // Test invalid team_id
      await expect(db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: testTournament.id,
        amount: 1000.00,
        team_id: 'invalid-uuid',
        date: new Date('2024-01-07')
      })).rejects.toThrow();
    } catch (error) {
      console.error('Error in foreign key test:', error);
      throw error;
    }
  });

  it('should update last_updated timestamp', async () => {
    try {
      const earnings = await db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: testTournament.id,
        amount: 3000.00,
        placement: 3,
        team_id: testTeam.id,
        date: new Date('2024-01-07')
      });

      const initialUpdate = earnings.last_updated;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await earnings.update({ amount: 3500.00 });
      
      expect(earnings.last_updated.getTime()).toBeGreaterThan(initialUpdate.getTime());
    } catch (error) {
      console.error('Error in timestamp test:', error);
      throw error;
    }
  });

  it('should handle different currencies', async () => {
    try {
      const earnings = await db.Earnings.create({
        player_id: testPlayer.id,
        tournament_id: testTournament.id,
        amount: 5000.00,
        currency: 'EUR',
        placement: 4,
        team_id: testTeam.id,
        date: new Date('2024-01-07')
      });

      expect(earnings.currency).toBe('EUR');
    } catch (error) {
      console.error('Error in currency test:', error);
      throw error;
    }
  });
}); 