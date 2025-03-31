const db = require('../models');
const LiquipediaService = require('./liquipedia.service');
const { Op } = require('sequelize');

class DataCollectionService {
  constructor() {
    this.Player = db.Player;
    this.liquipediaService = new LiquipediaService();
    this.batchSize = 10; // Process 10 players at a time
    this.delayBetweenBatches = 5000; // 5 seconds between batches to respect rate limits
    this.isRunning = false;
  }

  async startCollection() {
    if (this.isRunning) {
      console.log('Data collection is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Liquipedia data collection...');

    try {
      // Get all players that don't have Liquipedia data
      const players = await this.Player.findAll({
        where: {
          [Op.or]: [
            { liquipedia_url: null },
            { liquipedia_stats: null }
          ]
        },
        order: [['name', 'ASC']]
      });

      console.log(`Found ${players.length} players to process`);

      // Process players in batches
      for (let i = 0; i < players.length; i += this.batchSize) {
        const batch = players.slice(i, i + this.batchSize);
        await this.processBatch(batch);
        
        // Add delay between batches
        if (i + this.batchSize < players.length) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
        }
      }

      console.log('Data collection completed');
    } catch (error) {
      console.error('Error during data collection:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processBatch(players) {
    const promises = players.map(player => this.processPlayer(player));
    await Promise.all(promises);
  }

  async processPlayer(player) {
    try {
      const liquipediaData = await this.liquipediaService.getPlayerData(player.name);
      
      if (!liquipediaData) {
        console.log(`No Liquipedia data found for player: ${player.name}`);
        return;
      }

      // Extract tournament results
      const tournamentResults = this.extractTournamentResults(liquipediaData);
      
      // Calculate tournament stats
      const tournamentStats = this.calculateTournamentStats(tournamentResults);
      
      // Extract team history
      const teamHistory = this.extractTeamHistory(liquipediaData);
      
      // Extract performance stats
      const performanceStats = this.extractPerformanceStats(liquipediaData);

      // Update player with new data
      await player.update({
        liquipedia_url: liquipediaData.url,
        liquipedia_stats: liquipediaData.stats,
        tournament_results: tournamentResults,
        total_earnings: liquipediaData.totalEarnings,
        earnings_by_year: liquipediaData.earningsByYear,
        team_history: teamHistory,
        deaths_per_map: performanceStats.deathsPerMap,
        kills_per_map: performanceStats.killsPerMap,
        assists_per_map: performanceStats.assistsPerMap,
        acs_per_map: performanceStats.acsPerMap,
        tournaments_played: tournamentStats.totalTournaments,
        tournaments_won: tournamentStats.tournamentsWon,
        tournaments_top_4: tournamentStats.tournamentsTop4
      });

      console.log(`Successfully updated player: ${player.name}`);
    } catch (error) {
      console.error(`Error processing player ${player.name}:`, error);
    }
  }

  extractTournamentResults(data) {
    if (!data.tournaments) return [];
    
    return data.tournaments.map(tournament => ({
      name: tournament.name,
      date: tournament.date,
      placement: tournament.placement,
      prize: tournament.prize,
      team: tournament.team
    }));
  }

  calculateTournamentStats(tournamentResults) {
    return {
      totalTournaments: tournamentResults.length,
      tournamentsWon: tournamentResults.filter(t => t.placement === 1).length,
      tournamentsTop4: tournamentResults.filter(t => t.placement <= 4).length
    };
  }

  extractTeamHistory(data) {
    if (!data.teams) return [];
    
    return data.teams.map(team => ({
      name: team.name,
      startDate: team.startDate,
      endDate: team.endDate,
      role: team.role
    }));
  }

  extractPerformanceStats(data) {
    if (!data.stats) return {
      deathsPerMap: null,
      killsPerMap: null,
      assistsPerMap: null,
      acsPerMap: null
    };

    return {
      deathsPerMap: parseFloat(data.stats.deathsPerMap) || null,
      killsPerMap: parseFloat(data.stats.killsPerMap) || null,
      assistsPerMap: parseFloat(data.stats.assistsPerMap) || null,
      acsPerMap: parseFloat(data.stats.acsPerMap) || null
    };
  }

  async getCollectionStatus() {
    const totalPlayers = await this.Player.count();
    const processedPlayers = await this.Player.count({
      where: {
        liquipedia_url: { [Op.ne]: null },
        liquipedia_stats: { [Op.ne]: null }
      }
    });

    return {
      isRunning: this.isRunning,
      totalPlayers,
      processedPlayers,
      remainingPlayers: totalPlayers - processedPlayers
    };
  }
}

module.exports = new DataCollectionService(); 