// src/services/scraper.service.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

class ValorantScraper {
  constructor() {
    this.baseUrl = 'https://www.vlr.gg';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
  }

  async makeRequest(url) {
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${url}:`, error.message);
      throw error;
    }
  }

  async scrapePlayerList(pageNumber = 1) {
    try {
      console.log(`Scraping player list page ${pageNumber}...`);
      const html = await this.makeRequest(`${this.baseUrl}/stats/players?page=${pageNumber}`);
      const $ = cheerio.load(html);
      
      const players = [];
      $('.wf-card').each((index, element) => {
        // Skip header rows
        if ($(element).find('.stats-player-country').length === 0) return;
        
        const playerData = this.extractPlayerFromStatsPage($, element);
        if (playerData) {
          // Store player URL for detailed scraping later
          playerData.vlr_url = $(element).find('.mod-player a').attr('href');
          players.push(playerData);
        }
      });

      console.log(`Found ${players.length} players on page ${pageNumber}`);
      return players;
    } catch (error) {
      console.error(`Error scraping player list page ${pageNumber}:`, error);
      throw error;
    }
  }

  extractPlayerFromStatsPage($, element) {
    try {
      const name = $(element).find('.mod-player a').text().trim();
      if (!name) return null;

      const playerUrl = $(element).find('.mod-player a').attr('href');
      const playerImgUrl = $(element).find('.mod-player img').attr('src') || null;
      
      const teamElement = $(element).find('.mod-team');
      const teamName = teamElement.text().trim();
      const teamUrl = teamElement.find('a').attr('href') || null;
      
      const countryName = $(element).find('.stats-player-country').text().trim();
      const countryFlag = $(element).find('.mod-flag').attr('class') || '';
      const countryCode = countryFlag.split(' ').find(cls => cls.startsWith('mod-'))?.replace('mod-', '') || null;
      
      // Get stats
      const statElements = $(element).find('.stats-center');
      const acs = parseFloat($(statElements[0]).text().trim()) || null;
      const kd = parseFloat($(statElements[1]).text().trim()) || null;
      const adr = parseFloat($(statElements[2]).text().trim()) || null;
      const kpr = parseFloat($(statElements[3]).text().trim()) || null;
      const apr = parseFloat($(statElements[4]).text().trim()) || null;
      const fkpr = parseFloat($(statElements[5]).text().trim()) || null;
      const fdpr = parseFloat($(statElements[6]).text().trim()) || null;
      const hsPercent = $(statElements[7]).text().trim();
      const hsPct = hsPercent ? parseFloat(hsPercent.replace('%', '')) : null;
      
      // Use available stats to estimate a basic player value in salary range
      const estimatedValue = this.estimatePlayerValue(acs, kd, adr, kpr, apr, fkpr, fdpr, hsPct);
      
      return {
        id: uuidv4(),
        name: name,
        full_identifier: name,
        player_img_url: playerImgUrl ? `https://www.vlr.gg${playerImgUrl}` : null,
        team_name: teamName !== 'No Team' ? teamName : null,
        team_abbreviation: this.extractTeamAbbreviation(teamUrl),
        is_free_agent: teamName === 'No Team',
        country_name: countryName,
        country_code: countryCode,
        acs: acs,
        kd_ratio: kd,
        adr: adr,
        kpr: kpr,
        apr: apr,
        fk_pr: fkpr,
        fd_pr: fdpr,
        hs_pct: hsPct,
        rating: this.calculateRating(acs, kd, adr),
        estimated_value: estimatedValue,
        source: 'VLR',
        current_act: 'N/A',
        division: null, // Will be populated later
        playstyle: null, // Will be populated based on agent usage
        agent_usage: {} // Will be populated later
      };
    } catch (error) {
      console.error('Error extracting player data:', error);
      return null;
    }
  }

  // Extract team abbreviation from team URL
  extractTeamAbbreviation(teamUrl) {
    if (!teamUrl) return null;
    
    const matches = teamUrl.match(/\/team\/(\d+)\/([^\/]+)/);
    if (matches && matches[2]) {
      return matches[2].toUpperCase();
    }
    return null;
  }

  // Calculate a player rating based on stats
  calculateRating(acs, kd, adr) {
    if (!acs || !kd || !adr) return null;
    
    // Enhanced rating formula that weighs important factors
    // ACS (Average Combat Score) is a key indicator of overall impact
    // KD ratio shows survivability and trade efficiency
    // ADR (Average Damage per Round) shows consistent damage output
    const rating = (acs / 200 * 0.4) + (kd * 0.35) + (adr / 150 * 0.25);
    return Math.round(rating * 100) / 100; // Round to 2 decimal places
  }

  // Estimate player value based on performance metrics
  estimatePlayerValue(acs, kd, adr, kpr, apr, fkpr, fdpr, hsPct) {
    if (!acs || !kd || !adr) return null;
    
    // Base value for a professional player (could be adjusted based on market research)
    let baseValue = 2000; // $2000/month as base
    
    // Performance multipliers
    // These weights are estimates and should be refined with actual market data
    const acsMultiplier = acs > 250 ? 1.5 : (acs > 200 ? 1.2 : (acs > 150 ? 1 : 0.8));
    const kdMultiplier = kd > 1.3 ? 1.4 : (kd > 1.1 ? 1.2 : (kd > 0.9 ? 1 : 0.8));
    const adrMultiplier = adr > 160 ? 1.3 : (adr > 140 ? 1.2 : (adr > 120 ? 1 : 0.9));
    
    // Additional factors
    const kprBonus = kpr > 0.9 ? 200 : (kpr > 0.7 ? 100 : 0);
    const fkprBonus = fkpr > 0.18 ? 300 : (fkpr > 0.15 ? 200 : (fkpr > 0.12 ? 100 : 0));
    const hsBonus = hsPct > 30 ? 150 : (hsPct > 25 ? 100 : (hsPct > 20 ? 50 : 0));
    
    // Calculate estimated value
    const estimatedValue = baseValue * acsMultiplier * kdMultiplier * adrMultiplier + kprBonus + fkprBonus + hsBonus;
    
    return Math.round(estimatedValue);
  }

  // Scrape detailed player information including agent usage
  async scrapePlayerDetail(playerUrl) {
    try {
      console.log(`Scraping player details from ${playerUrl}...`);
      const html = await this.makeRequest(`${this.baseUrl}${playerUrl}`);
      const $ = cheerio.load(html);
      
      // Extract agent usage data
      const agentUsage = {};
      $('.agent-stats-list tr').each((i, element) => {
        if (i === 0) return; // Skip header row
        
        const agent = $(element).find('td:nth-child(1)').text().trim();
        const playTime = $(element).find('td:nth-child(2)').text().trim();
        const playCount = parseInt($(element).find('td:nth-child(3)').text().trim()) || 0;
        const winRate = $(element).find('td:nth-child(4)').text().trim();
        const acs = parseFloat($(element).find('td:nth-child(5)').text().trim()) || null;
        const kd = parseFloat($(element).find('td:nth-child(6)').text().trim()) || null;
        const adr = parseFloat($(element).find('td:nth-child(7)').text().trim()) || null;
        
        if (agent && playCount > 0) {
          agentUsage[agent] = {
            playTime,
            playCount,
            winRate,
            acs,
            kd,
            adr
          };
        }
      });
      
      // Determine playstyle based on agent usage
      const playstyle = this.determinePlaystylesFromAgents(agentUsage);
      
      // Get tournament history to determine division level
      const tournamentHistory = [];
      $('.wf-card .mod-overview').each((i, element) => {
        const tournamentName = $(element).find('.event-name').text().trim();
        if (tournamentName) {
          tournamentHistory.push(tournamentName);
        }
      });
      
      // Determine division based on tournament participation
      const division = this.determinePlayerDivision(tournamentHistory);
      
      return {
        agent_usage: agentUsage,
        playstyle,
        division,
        tournament_history: tournamentHistory
      };
    } catch (error) {
      console.error(`Error scraping player details from ${playerUrl}:`, error);
      return {
        agent_usage: {},
        playstyle: null,
        division: null,
        tournament_history: []
      };
    }
  }

  // Determine player playstyles based on agent usage
  determinePlaystylesFromAgents(agentUsage) {
    // Define agent roles
    const agentRoles = {
      // Duelists
      'Jett': 'Duelist',
      'Phoenix': 'Duelist',
      'Raze': 'Duelist',
      'Reyna': 'Duelist',
      'Yoru': 'Duelist',
      'Neon': 'Duelist',
      'ISO': 'Duelist',
      'Waylay': 'Duelist',
      // Controllers
      'Brimstone': 'Controller',
      'Omen': 'Controller',
      'Viper': 'Controller',
      'Astra': 'Controller',
      'Harbor': 'Controller',
      'Clove': 'Controller',
      // Initiators
      'Sova': 'Initiator',
      'Breach': 'Initiator',
      'Skye': 'Initiator',
      'KAY/O': 'Initiator',
      'Fade': 'Initiator',
      'Gekko': 'Initiator',
      // Sentinels
      'Killjoy': 'Sentinel',
      'Cypher': 'Sentinel',
      'Sage': 'Sentinel',
      'Chamber': 'Sentinel',
      'Deadlock': 'Sentinel'
    };

    // Calculate total plays and role distribution
    let totalPlays = 0;
    const roleCounts = {
      'Duelist': 0,
      'Controller': 0,
      'Initiator': 0,
      'Sentinel': 0
    };

    // Count plays by role
    Object.entries(agentUsage).forEach(([agent, data]) => {
      const role = agentRoles[agent] || 'Unknown';
      if (role !== 'Unknown') {
        roleCounts[role] += data.playCount;
      }
      totalPlays += data.playCount;
    });

    if (totalPlays === 0) return null;

    // Calculate percentages
    const rolePercentages = {};
    Object.entries(roleCounts).forEach(([role, count]) => {
      rolePercentages[role] = Math.round((count / totalPlays) * 100);
    });

    // Determine primary and secondary playstyles
    let playstyles = Object.entries(rolePercentages)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, percentage]) => percentage > 20)
      .map(([role, percentage]) => `${role} (${percentage}%)`);

    // Determine special playstyle traits
    const traits = [];
    
    // Check for IGLs (common for Controller mains)
    if (rolePercentages['Controller'] > 40) {
      traits.push('Potential IGL');
    }
    
    // Check for support players (Initiator/Sentinel focus)
    if (rolePercentages['Initiator'] + rolePercentages['Sentinel'] > 60) {
      traits.push('Support-oriented');
    }
    
    // Check for entry fraggers (Duelist-heavy)
    if (rolePercentages['Duelist'] > 50) {
      traits.push('Entry Fragger');
    }
    
    // Check for flex players (balanced role distribution)
    const roleSpread = Math.max(...Object.values(rolePercentages)) - Math.min(...Object.values(rolePercentages));
    if (roleSpread < 30 && Object.values(rolePercentages).every(pct => pct > 15)) {
      traits.push('Flex Player');
    }

    // Combine playstyles and traits
    return {
      primary_roles: playstyles,
      traits: traits,
      role_percentages: rolePercentages
    };
  }

  // Determine player division based on tournament history
  determinePlayerDivision(tournamentHistory) {
    // Lists of tournaments by tier
    const t1Tournaments = [
      'VCT', 'Masters', 'Champions', 'LOCK//IN', 'Challengers', 'VALORANT Champions'
    ];
    
    const t2Tournaments = [
      'Challengers Ascension', 'Ascension', 'Challengers League', 'Contenders'
    ];
    
    const t3Tournaments = [
      'Game Changers', 'GC', 'Rising', 'Valorant Regional League'
    ];
    
    const t4Tournaments = [
      'Collegiate', 'University', 'College', 'Campus'
    ];

    // Check tournament history against each tier
    for (const tournament of tournamentHistory) {
      // Check for T1
      if (t1Tournaments.some(t => tournament.includes(t))) {
        return 'T1';
      }
      
      // Check for T2
      if (t2Tournaments.some(t => tournament.includes(t))) {
        return 'T2';
      }
      
      // Check for T3
      if (t3Tournaments.some(t => tournament.includes(t))) {
        return 'T3';
      }
      
      // Check for T4
      if (t4Tournaments.some(t => tournament.includes(t))) {
        return 'T4';
      }
    }

    // Default if no matching tournaments found
    return 'Unranked';
  }

  // Scrape and save detailed player information
  async scrapeAndSavePlayerDetails(playerId, playerUrl) {
    try {
      const playerDetails = await this.scrapePlayerDetail(playerUrl);
      
      // Update player in database with detailed information
      await db.Player.update({
        agent_usage: JSON.stringify(playerDetails.agent_usage),
        playstyle: JSON.stringify(playerDetails.playstyle),
        division: playerDetails.division,
        tournament_history: JSON.stringify(playerDetails.tournament_history)
      }, {
        where: { id: playerId }
      });
      
      return true;
    } catch (error) {
      console.error(`Error saving player details for ${playerUrl}:`, error);
      return false;
    }
  }

  // Complete player scrape with basic and detailed information
  async scrapeAllPlayers(pages = 5, detailedScrape = true) {
    try {
      let allPlayers = [];
      
      // First get basic player information
      for (let page = 1; page <= pages; page++) {
        const players = await this.scrapePlayerList(page);
        allPlayers = [...allPlayers, ...players];
        
        // Wait between requests to avoid rate limiting
        if (page < pages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Filter out null values
      const validPlayers = allPlayers.filter(player => player !== null);
      
      console.log(`Saving ${validPlayers.length} players to database...`);
      
      // Save basic player information
      const playerSaveResults = await db.Player.bulkCreate(
        validPlayers.map(player => {
          // Remove the URL from what gets saved to the database
          const { vlr_url, ...playerData } = player;
          return playerData;
        }), 
        {
          updateOnDuplicate: [
            'team_name', 'team_abbreviation', 'is_free_agent', 
            'acs', 'kd_ratio', 'adr', 'kpr', 'apr', 'fk_pr', 'fd_pr', 'hs_pct', 'rating',
            'estimated_value'
          ]
        }
      );
      
      console.log('Basic player information saved successfully');
      
      // If detailed scrape is requested, get detailed information for each player
      if (detailedScrape) {
        console.log('Starting detailed player information scrape...');
        let detailsScraped = 0;
        
        for (const player of validPlayers) {
          if (player.vlr_url) {
            await this.scrapeAndSavePlayerDetails(player.id, player.vlr_url);
            detailsScraped++;
            
            // Log progress
            if (detailsScraped % 10 === 0) {
              console.log(`Scraped detailed information for ${detailsScraped}/${validPlayers.length} players`);
            }
            
            // Wait between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        
        console.log(`Completed detailed scrape for ${detailsScraped} players`);
      }
      
      return validPlayers.length;
    } catch (error) {
      console.error('Error in scrapeAllPlayers:', error);
      throw error;
    }
  }

  // Scrape team information including roster and match history
  async scrapeTeams(pages = 3) {
    // Implementation for team scraping would go here
    // Similar pattern to player scraping
  }
}

module.exports = new ValorantScraper();