// src/services/liquipedia.service.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../models');
const { Op } = require('sequelize');

class LiquipediaService {
  constructor() {
    this.baseUrl = 'https://liquipedia.net/valorant';
    this.apiUrl = 'https://liquipedia.net/valorant/api.php';
    this.userAgent = 'Moneyball Valorant Analytics Tool/1.0 (contact@yourdomainhere.com)';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
    this.lastRequestTime = 0;
    this.generalDelay = 2000;  // 2 seconds between general requests
    this.parseDelay = 30000;   // 30 seconds between parse actions
  }

  /**
   * Ensure we respect the rate limits
   * @param {boolean} isParseAction Whether this is a resource-intensive parse action
   */
  async respectRateLimit(isParseAction = false) {
    const now = Date.now();
    const delay = isParseAction ? this.parseDelay : this.generalDelay;
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < delay) {
      // Wait until we can make the next request
      const waitTime = delay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make a request to Liquipedia
   * @param {string} url The URL to request
   * @param {boolean} isParseAction Whether this is a resource-intensive parse action
   */
  async makeRequest(url, isParseAction = false) {
    await this.respectRateLimit(isParseAction);
    
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Search for a player on Liquipedia
   * @param {string} playerName The name of the player to search for
   */
  async searchPlayer(playerName) {
    try {
      // Use the MediaWiki API to search for the player
      const searchUrl = `${this.apiUrl}?action=opensearch&search=${encodeURIComponent(playerName)}&limit=10&namespace=0&format=json`;
      
      const data = await this.makeRequest(searchUrl);
      
      // Process the search results
      if (data && Array.isArray(data) && data.length >= 4) {
        const searchTerms = data[0];
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];
        
        // Find the best match for the player
        const results = [];
        for (let i = 0; i < titles.length; i++) {
          results.push({
            title: titles[i],
            description: descriptions[i] || '',
            url: urls[i]
          });
        }
        
        // Return the search results
        return results;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching for player ${playerName}:`, error);
      return [];
    }
  }

  /**
   * Get player earnings data from their Liquipedia page
   * @param {string} playerUrl The URL of the player's Liquipedia page
   */
  async getPlayerEarnings(playerUrl) {
    try {
      // Extract the page title from the URL
      const pageTitle = playerUrl.split('/').pop();
      
      // Use the MediaWiki API to get the page content
      const apiUrl = `${this.apiUrl}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json`;
      
      const data = await this.makeRequest(apiUrl, true); // This is a parse action
      
      if (!data || !data.parse || !data.parse.text || !data.parse.text['*']) {
        throw new Error('Invalid API response format');
      }
      
      // Load the HTML content
      const html = data.parse.text['*'];
      const $ = cheerio.load(html);
      
      // Extract earnings information
      const earnings = {
        total: null,
        by_year: {},
        tournaments: []
      };
      
      // Find total earnings (typically in the infobox)
      const approximateEarnings = $('div.infobox-cell-2:contains("Approx. Total Earnings:")').next().text().trim();
      if (approximateEarnings) {
        // Extract the numeric value (remove currency symbols, commas, etc.)
        const earningsMatch = approximateEarnings.match(/\$([0-9,]+(\.[0-9]+)?)/);
        if (earningsMatch) {
          earnings.total = parseFloat(earningsMatch[1].replace(/,/g, ''));
        }
      }
      
      // Extract earnings by year from the earnings table
      $('h3:contains("Earnings By Year")').next('div.table-responsive').find('tbody tr').each((i, elem) => {
        const year = $(elem).find('td:first-child').text().trim();
        const yearAmount = $(elem).find('td:last-child').text().trim();
        
        if (year && yearAmount) {
          const amountMatch = yearAmount.match(/\$([0-9,]+(\.[0-9]+)?)/);
          if (amountMatch) {
            earnings.by_year[year] = parseFloat(amountMatch[1].replace(/,/g, ''));
          }
        }
      });
      
      // Extract tournament earnings
      $('h3:contains("Achievements")').next('div.table-responsive').find('tbody tr').each((i, elem) => {
        const dateText = $(elem).find('td:nth-child(1)').text().trim();
        const placement = $(elem).find('td:nth-child(2)').text().trim();
        const tournamentName = $(elem).find('td:nth-child(3) a').first().text().trim();
        const prizeText = $(elem).find('td:nth-child(4)').text().trim();
        const teamName = $(elem).find('td:nth-child(5)').text().trim();
        
        if (tournamentName && prizeText) {
          const prizeMatch = prizeText.match(/\$([0-9,]+(\.[0-9]+)?)/);
          let prize = null;
          if (prizeMatch) {
            prize = parseFloat(prizeMatch[1].replace(/,/g, ''));
          }
          
          // Parse date
          let date = null;
          if (dateText) {
            // Try to parse the date (format varies)
            const dateMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
              date = dateMatch[0];
            }
          }
          
          earnings.tournaments.push({
            date,
            placement,
            tournament: tournamentName,
            prize,
            team: teamName
          });
        }
      });
      
      return earnings;
    } catch (error) {
      console.error(`Error getting player earnings from ${playerUrl}:`, error);
      return null;
    }
  }

  /**
   * Update player earnings in the database
   * @param {string} playerId The ID of the player
   * @param {object} earnings The earnings data
   */
  async updatePlayerEarnings(playerId, earnings) {
    try {
      // Find the player
      const player = await db.Player.findByPk(playerId);
      
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }
      
      // Update the player with earnings data
      await player.update({
        total_earnings: earnings.total,
        earnings_by_year: JSON.stringify(earnings.by_year),
        tournament_earnings: JSON.stringify(earnings.tournaments),
        earnings_last_updated: new Date()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating earnings for player ${playerId}:`, error);
      return false;
    }
  }

  /**
   * Process a player to find and update their earnings
   * @param {string} playerId The ID of the player
   */
  async processPlayerEarnings(playerId) {
    try {
      // Get the player
      const player = await db.Player.findByPk(playerId);
      
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }
      
      console.log(`Processing earnings for player: ${player.name}`);
      
      // Search for the player on Liquipedia
      const searchResults = await this.searchPlayer(player.name);
      
      if (searchResults.length === 0) {
        console.log(`No Liquipedia results found for player: ${player.name}`);
        return { success: false, message: 'No Liquipedia page found' };
      }
      
      // Use the first result (most relevant)
      const playerResult = searchResults[0];
      
      // Get earnings data
      const earnings = await this.getPlayerEarnings(playerResult.url);
      
      if (!earnings) {
        return { success: false, message: 'Failed to extract earnings data' };
      }
      
      // Update player in database
      const updated = await this.updatePlayerEarnings(playerId, earnings);
      
      if (!updated) {
        return { success: false, message: 'Failed to update player earnings in database' };
      }
      
      return {
        success: true,
        player_name: player.name,
        total_earnings: earnings.total,
        tournaments_count: earnings.tournaments.length
      };
    } catch (error) {
      console.error(`Error processing earnings for player ${playerId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue earnings updates for prioritized players
   * @param {object} options Configuration options
   */
  async queueEarningsUpdates(options = {}) {
    try {
      const { 
        limit = 100, 
        divisions = ['T1', 'T2'],
        minDaysSinceUpdate = 30
      } = options;
      
      // Calculate cutoff date for updates
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minDaysSinceUpdate);
      
      // Find players that need earnings updates
      const players = await db.Player.findAll({
        where: {
          division: { [Op.in]: divisions },
          [Op.or]: [
            { earnings_last_updated: null },
            { earnings_last_updated: { [Op.lt]: cutoffDate } }
          ]
        },
        order: [
          // Order by division priority
          [db.sequelize.literal(`
            CASE 
              WHEN division = 'T1' THEN 1
              WHEN division = 'T2' THEN 2
              WHEN division = 'T3' THEN 3
              WHEN division = 'T4' THEN 4
              ELSE 5
            END
          `)],
          // Then by rating (higher rating first)
          ['rating', 'DESC']
        ],
        limit
      });
      
      console.log(`Found ${players.length} players needing earnings updates`);
      
      // Add tasks to the scheduler queue
      const scheduler = require('./scheduler.service');
      
      players.forEach((player, index) => {
        // Stagger priority slightly to maintain order
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
}

module.exports = new LiquipediaService();