// src/services/liquipedia.service.js
const axios = require('axios');
const db = require('../models');
const { Op } = require('sequelize');
const { Tournament } = db;
const cache = require('./cache.service');
const cheerio = require('cheerio');

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
   * Ensure we respect the rate limits
   */
  async respectRateLimit(isParseRequest = false) {
    const now = Date.now();
    const delay = isParseRequest ? this.parseDelay : this.generalDelay;
    const lastRequestTime = isParseRequest ? this.lastParseRequestTime : this.lastRequestTime;
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
    }
    
    if (isParseRequest) {
      this.lastParseRequestTime = Date.now();
    } else {
      this.lastRequestTime = Date.now();
    }
  }

  /**
   * Exponential backoff delay
   */
  async backoff(attempt) {
    const delay = this.generalDelay * Math.pow(2, attempt);
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
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429 && retryCount < this.maxRetries) {
        console.log(`Rate limit hit, retrying after backoff (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.backoff(retryCount);
        return this.makeRequest(params, retryCount + 1);
      }
      
      console.error('Error making API request:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
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
   * Get tournament list with pagination
   */
  async getTournamentList({ limit = 5, offset = 0 } = {}) {
    try {
      // Check cache first
      const cacheKey = cache.getTournamentListKey(limit, offset);
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached tournament list');
        return cachedData;
      }

      console.log('Fetching tournament list...');
      const data = await this.makeRequest({
        action: 'query',
        list: 'categorymembers',
        cmtitle: 'Category:Tournaments',
        cmlimit: limit,
        cmoffset: offset,
        cmprop: 'title|timestamp'
      });

      console.log('Tournament API response:', JSON.stringify(data, null, 2));

      let tournaments = [];
      if (data && data.query && data.query.categorymembers) {
        tournaments = data.query.categorymembers.map(tournament => ({
          title: tournament.title,
          timestamp: tournament.timestamp,
          url: `https://liquipedia.net/valorant/${encodeURIComponent(tournament.title)}`
        }));
      }

      // Cache the results
      await cache.set(cacheKey, tournaments, cache.durations.MEDIUM);
      return tournaments;
    } catch (error) {
      console.error('Error getting tournament list:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return [];
    }
  }

  /**
   * Get tournament page content
   */
  async getTournamentPage(title) {
    try {
      const data = await this.makeRequest({
        action: 'parse',
        page: title,
        prop: 'text',
        section: 'Participants',
        formatversion: 2
      });

      return data;
    } catch (error) {
      console.error(`Error getting tournament page for ${title}:`, error);
      throw error;
    }
  }

  /**
   * Get player match history
   */
  async getPlayerMatches(playerName) {
    try {
      const data = await this.makeRequest({
        action: 'parse',
        page: `${playerName}/Matches`,
        prop: 'text',
        formatversion: 2
      });

      return data;
    } catch (error) {
      console.error(`Error getting matches for player ${playerName}:`, error);
      throw error;
    }
  }

  /**
   * Get player team history
   */
  async getPlayerTeams(playerName) {
    try {
      const data = await this.makeRequest({
        action: 'parse',
        page: playerName,
        prop: 'text',
        section: 'Teams',
        formatversion: 2
      });

      return data;
    } catch (error) {
      console.error(`Error getting teams for player ${playerName}:`, error);
      throw error;
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

  /**
   * Get tournament statistics
   */
  async getTournamentStats(title) {
    try {
      // Format the title to match Liquipedia's format
      const formattedTitle = title.replace(/_/g, ' ');
      
      // Get the statistics page content
      const statsData = await this.makeRequest({
        action: 'parse',
        page: `${formattedTitle}/Statistics`,
        prop: 'text',
        format: 'json',
        formatversion: 2
      });

      if (!statsData.parse?.text) {
        throw new Error('No statistics page found for this tournament');
      }

      const content = statsData.parse.text;
      console.log('Raw content:', content.substring(0, 1000));

      // Parse player statistics directly from the HTML table
      const playerStats = await this._parsePlayerStats(content);
      console.log(`Found ${playerStats.length} player statistics`);

      // Parse map statistics
      const mapStats = this._parseMapStats(content);
      console.log('Map statistics:', {
        picked: Object.keys(mapStats.maps_picked).length,
        banned: Object.keys(mapStats.maps_banned).length
      });

      return {
        tournament: formattedTitle,
        player_statistics: playerStats,
        map_statistics: mapStats
      };
    } catch (error) {
      console.error(`Error getting tournament statistics for ${title}:`, error);
      throw error;
    }
  }

  /**
   * Parse player statistics from the content
   */
  async _parsePlayerStats(content) {
    const stats = [];
    
    // Look for the player statistics table in HTML format
    const tableRegex = /<table class="wikitable[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/;
    const tableMatch = content.match(tableRegex);
    
    if (!tableMatch) {
      console.log('No player statistics table found in content');
      // Log a sample of the content to debug
      console.log('Content sample:', content.substring(0, 500));
      return stats;
    }

    const rows = tableMatch[1].split('</tr>');
    for (const row of rows) {
      if (!row.trim() || row.includes('th>')) continue;
      
      // Extract player name and flag from the block-player div
      const playerMatch = row.match(/<div class="block-player">[\s\S]*?<span class="name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
      const playerName = playerMatch ? playerMatch[1] : '';
      
      // Extract team name from the team-template-team-icon
      const teamMatch = row.match(/<span data-highlightingclass="([^"]*)" class="team-template-team-icon"/);
      const team = teamMatch ? teamMatch[1] : '';
      
      // Extract agent icons
      const agentMatches = row.match(/<a href="\/valorant\/[^"]*" title="([^"]*)">/g)?.map(agent => {
        const titleMatch = agent.match(/title="([^"]*)"/);
        return titleMatch ? titleMatch[1] : '';
      }).filter(agent => !agent.includes('Team')) || [];
      
      // Extract all numeric values
      const numericValues = row.match(/>(\d+(?:\.\d+)?)</g)?.map(val => val.replace(/[><]/g, '')) || [];
      
      if (numericValues.length >= 10 && playerName) {
        const [rank, maps, kills, deaths, assists, kd, kda, acsPerMap, killsPerMap, deathsPerMap, assistsPerMap] = numericValues;
        
        stats.push({
          rank: parseInt(rank),
          player: playerName,
          team: team,
          agents: agentMatches,
          maps: parseInt(maps),
          kills: parseInt(kills),
          deaths: parseInt(deaths),
          assists: parseInt(assists),
          kd: parseFloat(kd),
          kda: parseFloat(kda),
          acs_per_map: parseFloat(acsPerMap),
          kills_per_map: parseFloat(killsPerMap),
          deaths_per_map: parseFloat(deathsPerMap),
          assists_per_map: parseFloat(assistsPerMap)
        });
      }
    }

    console.log(`Found ${stats.length} player statistics`);
    return stats;
  }

  /**
   * Parse map statistics from the content
   */
  _parseMapStats(content) {
    const stats = {
      maps_picked: {},
      maps_banned: {},
      side_statistics: {}
    };

    // Look for the Maps Picked section in HTML format
    const pickedSectionRegex = /<h2>Maps Picked<\/h2>\s*([\s\S]*?)(?=<h2>|$)/;
    const pickedSection = content.match(pickedSectionRegex);
    
    if (pickedSection) {
      const pickedContent = pickedSection[1];
      const pickedRegex = /<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>/g;
      let match;
      while ((match = pickedRegex.exec(pickedContent)) !== null) {
        const [_, map, ...counts] = match;
        if (map && !map.includes('Map')) {
          stats.maps_picked[map.trim()] = counts.map(c => parseInt(c));
        }
      }
    }

    // Look for the Maps Banned section in HTML format
    const bannedSectionRegex = /<h2>Maps Banned<\/h2>\s*([\s\S]*?)(?=<h2>|$)/;
    const bannedSection = content.match(bannedSectionRegex);
    
    if (bannedSection) {
      const bannedContent = bannedSection[1];
      const bannedRegex = /<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>/g;
      let match;
      while ((match = bannedRegex.exec(bannedContent)) !== null) {
        const [_, map, ...counts] = match;
        if (map && !map.includes('Map')) {
          stats.maps_banned[map.trim()] = counts.map(c => parseInt(c));
        }
      }
    }

    console.log('Map statistics:', {
      picked: Object.keys(stats.maps_picked).length,
      banned: Object.keys(stats.maps_banned).length
    });

    return stats;
  }

  /**
   * Parse team statistics from the content
   */
  _parseTeamStats(content) {
    const stats = [];
    
    // Look for the team statistics table in HTML format
    const tableRegex = /<table class="wikitable[^"]*">\s*<tr>\s*<th>#<\/th>\s*<th>Team<\/th>\s*<th>W<\/th>\s*<th>L<\/th>\s*<th>WR<\/th>\s*<th>RD<\/th>\s*<th>Maps<\/th>\s*<th>Rounds<\/th>\s*<th>Rounds\/Map<\/th>\s*<\/tr>\s*([\s\S]*?)<\/table>/;
    const tableMatch = content.match(tableRegex);
    
    if (!tableMatch) {
      console.log('No team statistics table found in content');
      return stats;
    }

    const rows = tableMatch[1].split('</tr>');
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([^<]+)<\/td>/g)?.map(cell => cell.replace(/<[^>]+>/g, '').trim()) || [];
      if (cells.length >= 10) {
        const [rank, team, wins, losses, winRate, roundDiff, maps, rounds, roundsPerMap] = cells;
        
        stats.push({
          rank: parseInt(rank),
          team: team,
          wins: parseInt(wins),
          losses: parseInt(losses),
          win_rate: parseFloat(winRate),
          round_differential: parseInt(roundDiff),
          maps: parseInt(maps),
          rounds: parseInt(rounds),
          rounds_per_map: parseFloat(roundsPerMap)
        });
      }
    }

    console.log(`Found ${stats.length} team statistics`);
    return stats;
  }

  /**
   * Parse match results from the content
   */
  _parseMatchResults(content) {
    const results = [];
    
    // Look for match results tables in HTML format
    const tableRegex = /<table class="wikitable[^"]*">\s*<tr>\s*<th>Team 1<\/th>\s*<th>Score<\/th>\s*<th>Team 2<\/th>\s*<th>Maps<\/th>\s*<th>VOD<\/th>\s*<\/tr>\s*([\s\S]*?)<\/table>/g;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(content)) !== null) {
      const rows = tableMatch[1].split('</tr>');
      for (const row of rows) {
        const cells = row.match(/<td[^>]*>([^<]+)<\/td>/g)?.map(cell => cell.replace(/<[^>]+>/g, '').trim()) || [];
        if (cells.length >= 5) {
          const [team1, score, team2, maps, vod] = cells;
          
          results.push({
            team1: team1,
            team2: team2,
            score: score.trim(),
            maps: maps.split(',').map(m => m.trim()),
            vod: vod.trim()
          });
        }
      }
    }

    console.log(`Found ${results.length} match results`);
    return results;
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
      const earningsText = pageData.earnings?.parse?.text || '';
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

  async getPlayerData(playerName) {
    try {
      // Search for player
      const searchResults = await this.searchPlayer(playerName);
      if (!searchResults || searchResults.length === 0) {
        return null;
      }

      const player = searchResults[0];
      const pageData = await this.getPlayerPage(player.title);

      if (!pageData) {
        return null;
      }

      // Parse the HTML content
      const $ = cheerio.load(pageData.parse.text);
      
      // Extract tournaments
      const tournaments = this.extractTournaments($);
      
      // Extract teams
      const teams = this.extractTeams($);
      
      // Extract stats
      const stats = this.extractStats($);
      
      // Calculate earnings
      const earnings = this.calculateEarnings(tournaments);

      return {
        url: player.url,
        title: player.title,
        tournaments,
        teams,
        stats,
        totalEarnings: earnings.total,
        earningsByYear: earnings.byYear
      };
    } catch (error) {
      console.error('Error getting player data:', error);
      return null;
    }
  }

  extractTournaments($) {
    const tournaments = [];
    const tournamentTable = $('.wikitable').first();
    
    if (!tournamentTable.length) return tournaments;

    tournamentTable.find('tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const cols = $(row).find('td');
      if (cols.length >= 5) {
        tournaments.push({
          date: $(cols[0]).text().trim(),
          name: $(cols[1]).text().trim(),
          placement: parseInt($(cols[2]).text().trim()) || null,
          team: $(cols[3]).text().trim(),
          prize: $(cols[4]).text().trim()
        });
      }
    });

    return tournaments;
  }

  extractTeams($) {
    const teams = [];
    const teamTable = $('.wikitable').eq(1); // Second table is usually team history
    
    if (!teamTable.length) return teams;

    teamTable.find('tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        teams.push({
          startDate: $(cols[0]).text().trim(),
          endDate: $(cols[1]).text().trim(),
          name: $(cols[2]).text().trim(),
          role: $(cols[3]).text().trim()
        });
      }
    });

    return teams;
  }

  extractStats($) {
    const stats = {};
    const statsTable = $('.wikitable').eq(2); // Third table is usually stats
    
    if (!statsTable.length) return stats;

    statsTable.find('tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 2) {
        const key = $(cols[0]).text().trim().toLowerCase().replace(/\s+/g, '_');
        const value = $(cols[1]).text().trim();
        
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    return stats;
  }

  calculateEarnings(tournaments) {
    const earnings = {
      total: 0,
      byYear: {}
    };

    tournaments.forEach(tournament => {
      const prize = this.parsePrize(tournament.prize);
      if (prize) {
        earnings.total += prize;
        
        const year = new Date(tournament.date).getFullYear();
        earnings.byYear[year] = (earnings.byYear[year] || 0) + prize;
      }
    });

    return earnings;
  }

  parsePrize(prizeStr) {
    if (!prizeStr) return 0;
    
    // Remove currency symbols and commas
    const cleanStr = prizeStr.replace(/[$,]/g, '');
    
    // Extract number
    const match = cleanStr.match(/\d+(\.\d+)?/);
    if (!match) return 0;
    
    return parseFloat(match[0]);
  }
}

module.exports = LiquipediaService;