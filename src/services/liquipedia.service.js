// src/services/liquipedia.service.js
const axios = require('axios');
const db = require('../models');
const { Op } = require('sequelize');
const { Tournament } = db;
const cheerio = require('cheerio');
const cache = require('../services/cache.service');

class LiquipediaService {
  constructor() {
    this.Player = db.Player;
    this.Team = db.Team;
    this.Tournament = db.Tournament;
    this.Earnings = db.Earnings;
    this.baseUrl = 'https://liquipedia.net/valorant/api.php';
    this.userAgent = 'Moneyball Valorant Analytics Tool/1.0 (https://winrvte.com; contact@winrvte.com)';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    };
    this.lastRequestTime = 0;
    this.lastParseRequestTime = 0;
    this.generalDelay = 2000; // 2 seconds between general requests
    this.parseDelay = 30000;  // 30 seconds between parse requests
    this.maxRetries = 3;
  }

  /**
   * Respect rate limits between requests
   */
  async respectRateLimit(isParseRequest = false) {
    const now = Date.now();
    const delay = isParseRequest ? this.parseDelay : this.generalDelay;
    const lastRequest = isParseRequest ? this.lastParseRequestTime : this.lastRequestTime;
    
    if (now - lastRequest < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - (now - lastRequest)));
    }
    
    if (isParseRequest) {
      this.lastParseRequestTime = Date.now();
    } else {
      this.lastRequestTime = Date.now();
    }
  }

  /**
   * Exponential backoff for retries
   */
  async backoff(retryCount) {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Make a request to the Liquipedia API with retry logic
   */
  async makeRequest(params, retryCount = 0) {
    const isParseRequest = params.action === 'parse';
    await this.respectRateLimit(isParseRequest);
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          ...params,
          format: 'json',
          origin: '*'
        },
        headers: this.headers
      });
      
      if (!response.data) {
        throw new Error('Empty response from Liquipedia API');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        // Handle rate limiting
        if (error.response.status === 429 && retryCount < this.maxRetries) {
          console.log(`Rate limit hit, retrying after backoff (attempt ${retryCount + 1}/${this.maxRetries})`);
          await this.backoff(retryCount);
          return this.makeRequest(params, retryCount + 1);
        }
        
        // Handle other HTTP errors
        console.error('Liquipedia API error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        throw new Error(`Liquipedia API error: ${error.response.status} ${error.response.statusText}`);
      }
      
      // Handle network errors
      console.error('Network error:', error.message);
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Search for a player
   */
  async searchPlayer(playerName) {
    try {
      // Check cache first
      const cacheKey = cache.getPlayerSearchKey(playerName);
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached player search results');
        return cachedData;
      }

      const data = await this.makeRequest({
        action: 'opensearch',
        search: playerName,
        limit: 10,
        namespace: 0
      });
      
      let results = [];
      if (data && Array.isArray(data) && data.length >= 4) {
        const searchTerms = data[0];
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];
        
        results = titles.map((title, index) => ({
          title,
          description: descriptions[index] || '',
          url: urls[index]
        }));
      }

      // Cache the results
      await cache.set(cacheKey, results, cache.durations.MEDIUM);
      return results;
    } catch (error) {
      console.error(`Error searching for player ${playerName}:`, error);
      throw error;
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

      if (!data?.parse?.text) {
        throw new Error('No page content found');
      }

      // Add a delay between requests
      await this.respectRateLimit(true);

      // Then get the earnings data
      const earningsData = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text',
        section: 'Results',
        formatversion: 2
      });

      // Get tournament history
      const tournamentData = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text',
        section: 'Tournament Results',
        formatversion: 2
      });

      // Get team history
      const teamData = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text',
        section: 'Team History',
        formatversion: 2
      });

      const playerData = {
        ...data,
        earnings: earningsData,
        tournament_history: tournamentData,
        team_history: teamData,
        source: 'liquipedia'
      };

      return playerData;
    } catch (error) {
      console.error(`Error getting player page for ${title}:`, error);
      throw error;
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
      const $ = cheerio.load(pageData.parse.text);
      const earnings = {
        total: 0,
        tournaments: []
      };

      // Find the earnings table
      const earningsTable = $('.wikitable').filter((i, table) => {
        return $(table).find('th').text().toLowerCase().includes('earnings');
      });

      if (earningsTable.length) {
        earningsTable.find('tr').each((i, row) => {
          if (i === 0) return; // Skip header row
          
          const cols = $(row).find('td');
          if (cols.length >= 3) {
            const tournament = $(cols[0]).text().trim();
            const placement = $(cols[1]).text().trim();
            const amount = $(cols[2]).text().trim();
            
            if (tournament && amount) {
              const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
              if (!isNaN(numericAmount)) {
                earnings.tournaments.push({
                  tournament,
                  placement,
                  amount: numericAmount
                });
                earnings.total += numericAmount;
              }
            }
          }
        });
      }

      return earnings;
    } catch (error) {
      console.error('Error extracting earnings data:', error);
      return null;
    }
  }

  _extractTournamentData(pageData) {
    try {
      const $ = cheerio.load(pageData.parse.text);
      const tournamentData = {
        prize_pool: 0,
        start_date: null,
        end_date: null,
        participants: [],
        results: []
      };

      // Extract prize pool
      const prizePoolText = $('.infobox').find('th:contains("Prize Pool")').next().text();
      tournamentData.prize_pool = parseFloat(prizePoolText.replace(/[^0-9.]/g, '')) || 0;

      // Extract dates
      const startDateText = $('.infobox').find('th:contains("Start Date")').next().text();
      const endDateText = $('.infobox').find('th:contains("End Date")').next().text();
      tournamentData.start_date = new Date(startDateText);
      tournamentData.end_date = new Date(endDateText);

      // Extract participants
      const participantsTable = $('.wikitable').filter((i, table) => {
        return $(table).find('th').text().toLowerCase().includes('participants');
      });

      if (participantsTable.length) {
        participantsTable.find('tr').each((i, row) => {
          if (i === 0) return; // Skip header row
          
          const cols = $(row).find('td');
          if (cols.length >= 2) {
            const team = $(cols[0]).text().trim();
            const region = $(cols[1]).text().trim();
            
            if (team) {
              tournamentData.participants.push({ team, region });
            }
          }
        });
      }

      // Extract results
      const resultsTable = $('.wikitable').filter((i, table) => {
        return $(table).find('th').text().toLowerCase().includes('results');
      });

      if (resultsTable.length) {
        resultsTable.find('tr').each((i, row) => {
          if (i === 0) return; // Skip header row
          
          const cols = $(row).find('td');
          if (cols.length >= 3) {
            const placement = $(cols[0]).text().trim();
            const team = $(cols[1]).text().trim();
            const score = $(cols[2]).text().trim();
            
            if (placement && team) {
              tournamentData.results.push({ placement, team, score });
            }
          }
        });
      }

      return tournamentData;
    } catch (error) {
      console.error('Error extracting tournament data:', error);
      return null;
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