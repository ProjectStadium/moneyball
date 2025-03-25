// src/services/liquipedia.service.js
const axios = require('axios');
const db = require('../models');
const { Op } = require('sequelize');
const { Tournament } = db;

class LiquipediaService {
  constructor() {
    this.baseUrl = 'https://liquipedia.net/valorant/api.php';
    this.userAgent = 'Moneyball Valorant Analytics Tool/1.0 (contact@yourdomainhere.com)';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json'
    };
    this.lastRequestTime = 0;
    this.requestDelay = 2000; // 2 seconds between requests
  }

  /**
   * Ensure we respect the rate limits
   */
  async respectRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make a request to the Liquipedia API
   */
  async makeRequest(params) {
    await this.respectRateLimit();
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          ...params,
          format: 'json',
          origin: '*'
        },
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('Error making API request:', error.message);
      throw error;
    }
  }

  /**
   * Search for a player
   */
  async searchPlayer(playerName) {
    try {
      const data = await this.makeRequest({
        action: 'opensearch',
        search: playerName,
        limit: 10,
        namespace: 0
      });
      
      if (data && Array.isArray(data) && data.length >= 4) {
        const searchTerms = data[0];
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];
        
        return titles.map((title, index) => ({
          title,
          description: descriptions[index] || '',
          url: urls[index]
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching for player ${playerName}:`, error);
      return [];
    }
  }

  /**
   * Get player page content with earnings data
   */
  async getPlayerPage(title) {
    try {
      // First get the page content
      const data = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text|infoboxes',
        formatversion: 2
      });

      if (!data || !data.parse) {
        return null;
      }

      // Then get the earnings data specifically
      const earningsData = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text',
        section: 'Earnings',
        formatversion: 2
      });

      return {
        text: data.parse.text,
        infoboxes: data.parse.infoboxes,
        earnings: earningsData?.parse?.text || ''
      };
    } catch (error) {
      console.error(`Error getting player page for ${title}:`, error);
      return null;
    }
  }

  /**
   * Get tournament page content with specific sections
   */
  async getTournamentPage(title) {
    try {
      // Get main page content with infoboxes
      const data = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text|infoboxes',
        formatversion: 2
      });

      if (!data || !data.parse) {
        return null;
      }

      // Get specific sections we need
      const sections = await Promise.all([
        this.makeRequest({
          action: 'parse',
          page: title,
          prop: 'text',
          section: 'Format',
          formatversion: 2
        }),
        this.makeRequest({
          action: 'parse',
          page: title,
          prop: 'text',
          section: 'Participants',
          formatversion: 2
        }),
        this.makeRequest({
          action: 'parse',
          page: title,
          prop: 'text',
          section: 'Results',
          formatversion: 2
        })
      ]);

      return {
        text: data.parse.text,
        infoboxes: data.parse.infoboxes,
        format: sections[0]?.parse?.text || '',
        participants: sections[1]?.parse?.text || '',
        results: sections[2]?.parse?.text || ''
      };
    } catch (error) {
      console.error(`Error getting tournament page for ${title}:`, error);
      return null;
    }
  }

  /**
   * Get list of tournaments with filtering options
   */
  async getTournamentList(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = 'all', // all, upcoming, ongoing, completed
        region = 'all'
      } = options;

      // First get all tournaments in the category
      const data = await this.makeRequest({
        action: 'query',
        list: 'categorymembers',
        cmtitle: 'Category:Tournaments',
        cmlimit: limit,
        cmoffset: offset,
        cmprop: 'title|timestamp'
      });

      if (!data?.query?.categorymembers) {
        return [];
      }

      // Filter tournaments based on status and region if specified
      const tournaments = await Promise.all(
        data.query.categorymembers.map(async (tournament) => {
          const tournamentData = await this.getTournamentPage(tournament.title);
          if (!tournamentData) return null;

          const infobox = tournamentData.infoboxes?.[0] || {};
          const tournamentStatus = this._determineStatus(infobox);
          const tournamentRegion = infobox.region || 'Unknown';

          if (status !== 'all' && tournamentStatus !== status) return null;
          if (region !== 'all' && tournamentRegion !== region) return null;

          return {
            title: tournament.title,
            timestamp: tournament.timestamp,
            status: tournamentStatus,
            region: tournamentRegion,
            prize_pool: this._extractPrizePool(infobox),
            start_date: this._extractDate(infobox, 'Start Date'),
            end_date: this._extractDate(infobox, 'End Date')
          };
        })
      );

      return tournaments.filter(Boolean);
    } catch (error) {
      console.error('Error getting tournament list:', error);
      return [];
    }
  }

  /**
   * Process a player to find and update their earnings
   */
  async processPlayerEarnings(playerId) {
    try {
      const player = await db.Player.findByPk(playerId);
      
      if (!player) {
        return { success: false, message: `Player not found: ${playerId}` };
      }
      
      console.log(`Processing earnings for player: ${player.name}`);
      
      // Search for the player
      const searchResults = await this.searchPlayer(player.name);
      
      if (searchResults.length === 0) {
        console.log(`No Liquipedia results found for player: ${player.name}`);
        return { success: false, message: 'No Liquipedia page found' };
      }
      
      // Get the player's page content
      const playerPage = await this.getPlayerPage(searchResults[0].title);
      
      if (!playerPage) {
        return { success: false, message: 'Failed to get player page content' };
      }
      
      // Extract earnings data from the page content
      const earnings = this._extractEarningsFromPage(playerPage);
      
      if (!earnings || !earnings.total) {
        return { success: false, message: 'Failed to extract earnings data' };
      }
      
      // Update player in database
      const updated = await this.updatePlayerEarnings(playerId, earnings);
      
      if (!updated) {
        return { 
          success: false, 
          message: 'Failed to update player earnings in database',
          player_name: player.name,
          total_earnings: earnings.total,
          tournaments_count: earnings.tournaments.length
        };
      }
      
      return {
        success: true,
        player_name: player.name,
        total_earnings: earnings.total,
        tournaments_count: earnings.tournaments.length
      };
    } catch (error) {
      console.error(`Error processing earnings for player ${playerId}:`, error);
      return { 
        success: false, 
        message: error.message || 'An unexpected error occurred',
        player_name: null,
        total_earnings: null,
        tournaments_count: 0
      };
    }
  }

  /**
   * Update tournament data
   */
  async updateTournamentData(tournamentId) {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with id ${tournamentId} not found`);
      }

      const tournamentPage = await this.getTournamentPage(tournament.name);
      if (!tournamentPage) {
        throw new Error('Failed to get tournament page content');
      }

      const updatedData = this._extractTournamentData(tournamentPage);
      await tournament.update(updatedData);

      return tournament;
    } catch (error) {
      console.error('Error updating tournament data:', error);
      throw error;
    }
  }

  /**
   * Queue earnings updates for prioritized players
   */
  async queueEarningsUpdates(options = {}) {
    try {
      const { 
        limit = 100, 
        divisions = ['T1', 'T2'],
        minDaysSinceUpdate = 30
      } = options;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minDaysSinceUpdate);
      
      const players = await db.Player.findAll({
        where: {
          division: { [Op.in]: divisions },
          [Op.or]: [
            { earnings_last_updated: null },
            { earnings_last_updated: { [Op.lt]: cutoffDate } }
          ]
        },
        order: [
          [db.sequelize.literal(`
            CASE 
              WHEN division = 'T1' THEN 1
              WHEN division = 'T2' THEN 2
              WHEN division = 'T3' THEN 3
              WHEN division = 'T4' THEN 4
              ELSE 5
            END
          `)],
          ['rating', 'DESC']
        ],
        limit
      });
      
      console.log(`Found ${players.length} players needing earnings updates`);
      
      const scheduler = require('./scheduler.service');
      
      players.forEach((player, index) => {
        const priority = 100 - (index * 0.1);
        
        scheduler.addToQueue({
          type: 'player_earnings',
          playerId: player.id,
          priority,
          timestamp: Date.now(),
          retries: 0
        });
      });
      
      return {
        success: true,
        queued_players: players.length,
        divisions
      };
    } catch (error) {
      console.error('Error queuing earnings updates:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods for data extraction
  _extractEarningsFromPage(pageData) {
    try {
      const earnings = {
        total: 0,
        by_year: {},
        tournaments: []
      };

      // Extract total earnings from infobox
      const infobox = pageData.infoboxes?.[0] || {};
      const totalEarnings = infobox['Approx. Total Earnings'];
      if (totalEarnings) {
        earnings.total = this._parsePrizeAmount(totalEarnings);
      }

      // Parse earnings section
      const earningsText = pageData.earnings;
      if (!earningsText) return earnings;

      // Extract earnings by year
      const yearMatches = earningsText.matchAll(/(\d{4})\s*-\s*\$([\d,]+)/g);
      for (const match of yearMatches) {
        const [_, year, amount] = match;
        earnings.by_year[year] = this._parsePrizeAmount(amount);
      }

      // Extract tournament earnings
      const tournamentMatches = earningsText.matchAll(/(\d{4}-\d{2}-\d{2})\s*(\d+[a-z]*)\s*([^$]+)\s*\$([\d,]+)\s*([^$]+)/g);
      for (const match of tournamentMatches) {
        const [_, date, placement, tournament, prize, team] = match;
        earnings.tournaments.push({
          date,
          placement,
          tournament: tournament.trim(),
          prize: this._parsePrizeAmount(prize),
          team: team.trim()
        });
      }

      return earnings;
    } catch (error) {
      console.error('Error extracting earnings data:', error);
      return {
        total: 0,
        by_year: {},
        tournaments: []
      };
    }
  }

  _extractTournamentData(pageData) {
    try {
      const infobox = pageData.infoboxes?.[0] || {};
      
      return {
        name: infobox.name || '',
        start_date: this._extractDate(infobox, 'Start Date'),
        end_date: this._extractDate(infobox, 'End Date'),
        prize_pool: this._extractPrizePool(infobox),
        region: infobox.region || '',
        organizer: infobox.organizer || '',
        type: this._determineTournamentType(infobox),
        format: this._extractFormat(pageData.format),
        participants: this._extractParticipants(pageData.participants),
        status: this._determineStatus(infobox)
      };
    } catch (error) {
      console.error('Error extracting tournament data:', error);
      return {
        name: '',
        start_date: null,
        end_date: null,
        prize_pool: 0,
        region: '',
        organizer: '',
        type: 'other',
        format: {},
        participants: [],
        status: 'upcoming'
      };
    }
  }

  _parsePrizeAmount(amount) {
    if (!amount) return 0;
    return parseFloat(amount.replace(/[$,]/g, '')) || 0;
  }

  _extractDate(infobox, label) {
    const dateText = infobox[label];
    if (!dateText) return null;
    
    const date = new Date(dateText);
    return isNaN(date.getTime()) ? null : date;
  }

  _extractPrizePool(infobox) {
    const prizeText = infobox['Prize Pool'];
    if (!prizeText) return 0;
    return this._parsePrizeAmount(prizeText);
  }

  _determineTournamentType(infobox) {
    const typeText = (infobox.type || '').toLowerCase();
    if (typeText.includes('major')) return 'major';
    if (typeText.includes('minor')) return 'minor';
    if (typeText.includes('qualifier')) return 'qualifier';
    if (typeText.includes('showmatch')) return 'showmatch';
    return 'other';
  }

  _extractFormat(formatText) {
    if (!formatText) return {};
    
    return {
      description: formatText,
      stages: this._extractFormatStages(formatText)
    };
  }

  _extractFormatStages(formatText) {
    const stages = [];
    const stageMatches = formatText.matchAll(/==\s*([^=]+)\s*==\s*([^=]+)/g);
    
    for (const match of stageMatches) {
      const [_, stageName, stageDetails] = match;
      if (stageName.includes('Stage') || stageName.includes('Phase')) {
        stages.push({
          name: stageName.trim(),
          details: stageDetails.trim()
        });
      }
    }
    
    return stages;
  }

  _extractParticipants(participantsText) {
    if (!participantsText) return [];
    
    const participants = [];
    const participantMatches = participantsText.matchAll(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/g);
    
    for (const match of participantMatches) {
      const [_, team, seed, region] = match;
      if (team && !team.includes('Team')) { // Skip header row
        participants.push({
          team: team.trim(),
          seed: seed.trim(),
          region: region.trim()
        });
      }
    }
    
    return participants;
  }

  _determineStatus(infobox) {
    const startDate = this._extractDate(infobox, 'Start Date');
    const endDate = this._extractDate(infobox, 'End Date');
    
    if (!startDate || !endDate) return 'upcoming';
    
    const now = new Date();
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  }
}

module.exports = new LiquipediaService();