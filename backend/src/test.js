const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const puppeteer = require('puppeteer');

// Mapping of vlr.gg team abbreviations to our CSV abbreviations
const TEAM_ABBREV_MAP = {
    'G2': 'BN1',
    'NRG': 'Z5K',
    'SEN': 'A12L',
    'LOUD': 'A1B',
    'FNC': 'A2B',
    'TH': 'A3B',
    'PRX': 'A4B',
    'DRX': 'A5B',
    'T1': 'A6B',
    'GEN': 'A7B',
    'TL': 'A8B',
    'C9': 'A9B',
    '100T': 'B1B',
    'EG': 'B2B',
    'FURIA': 'B3B',
    'KRU': 'B4B',
    'LEV': 'B5B',
    'MIBR': 'B6B',
    'NAVI': 'B7B',
    'FPX': 'B8B',
    'BDS': 'B9B',
    'KOI': 'C1B',
    'KC': 'C2B',
    'VIT': 'C3B',
    'HERO': 'C4B',
    'BBL': 'C5B',
    'FUT': 'C6B',
    'GIA': 'C7B',
    'GX': 'C8B',
    'BIG': 'C9B',
    'ALL': 'D1B',
    'GMB': 'D2B',
    'NIP': 'D3B',
    'OG': 'D4B',
    'VIT': 'D5B',
    'KOI': 'D6B',
    'KC': 'D7B',
    'BDS': 'D8B',
    'FPX': 'D9B',
    'NAVI': 'E1B',
    'MIBR': 'E2B',
    'LEV': 'E3B',
    'KRU': 'E4B',
    'FURIA': 'E5B',
    'EG': 'E6B',
    '100T': 'E7B',
    'C9': 'E8B',
    'TL': 'E9B',
    'T1': 'F1B',
    'DRX': 'F2B',
    'PRX': 'F3B',
    'TH': 'F4B',
    'FNC': 'F5B',
    'LOUD': 'F6B',
    'SEN': 'F7B',
    'NRG': 'F8B',
    'G2': 'F9B'
};

class TestScraper {
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
    this.teams = new Map(); // Will store team data from CSV
    this.unmatchedTeams = new Set();
  }

  async loadTeams() {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(path.join(__dirname, '../../data/updated_esport_teams.csv'))
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          console.log(`Loaded ${results.length} teams from CSV`);
          console.log('CSV columns:', Object.keys(results[0]));
          
          // Store teams by both CSV abbreviation and vlr.gg abbreviation
          results.forEach(team => {
            this.teams.set(team.team_abbreviation, team);
            
            // Find vlr.gg abbreviation that maps to this team
            const vlrAbbrev = Object.entries(TEAM_ABBREV_MAP).find(([_, csvAbbr]) => csvAbbr === team.team_abbreviation)?.[0];
            if (vlrAbbrev) {
              this.teams.set(vlrAbbrev, team);
            }
          });
          
          resolve();
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });
  }

  async makeRequest(url) {
    try {
      console.log(`[Test] Making request to ${url}`);
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error(`[Test] Error making request: ${error.message}`);
      throw error;
    }
  }

  calculateCompatibilityScore(stats) {
    // Weights for different stats based on team play importance
    const weights = {
      rating: 0.3,    // Overall performance
      acs: 0.2,       // Combat score
      kd: 0.15,       // Kills per death
      kast: 0.25,     // Kill/Assist/Survival/Trade
      adr: 0.1        // Average damage per round
    };

    // Normalize stats to 0-1 range
    const normalizedStats = {
      rating: Math.min(stats.rating / 2, 1),
      acs: Math.min(stats.acs / 300, 1),
      kd: Math.min(stats.kd / 2, 1),
      kast: stats.kast / 100,
      adr: Math.min(stats.adr / 200, 1)
    };

    // Calculate weighted score
    return Object.entries(weights).reduce((score, [stat, weight]) => {
      return score + (normalizedStats[stat] * weight);
    }, 0);
  }

  async scrapePlayerList(url) {
    try {
      console.log(`[Test] Scraping player list from ${url}`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      
      const statsTable = $('.wf-table').first();
      if (!statsTable.length) {
        console.error('[Test] Could not find stats table');
        return [];
      }

      const players = [];
      let matchedTeams = 0;
      let unmatchedTeams = 0;
      let freeAgents = 0;
      
      statsTable.find('tbody tr').each((i, row) => {
        try {
          const $row = $(row);
          
          // Extract player info
          const playerCell = $row.find('td:first-child');
          const playerName = playerCell.find('.text-of').text().trim();
          const playerTeam = playerCell.find('.ge-text-light').text().trim();
          
          // Extract country code from flag class
          const flagClass = playerCell.find('.flag').attr('class') || '';
          const countryCode = flagClass.split(' ').find(cls => cls.startsWith('mod-'))?.replace('mod-', '') || '';
          const playerCountry = playerCell.find('img.flag').attr('title') || '';
          
          // Extract team abbreviation from the country div
          const teamAbbr = playerCell.find('.stats-player-country').text().replace(/\s+/g, ' ').trim();
          
          // Extract stats - using specific indices since the order is fixed
          const stats = {};
          $row.find('td').each((index, cell) => {
            const value = $(cell).text().trim();
            switch(index) {
              case 1: // Rating
                stats.rating = parseFloat(value) || 0;
                break;
              case 2: // ACS
                stats.acs = parseFloat(value) || 0;
                break;
              case 3: // K:D
                stats.kd = parseFloat(value) || 0;
                break;
              case 4: // KAST
                stats.kast = parseFloat(value?.replace('%', '')) || 0;
                break;
              case 5: // ADR
                stats.adr = parseFloat(value) || 0;
                break;
            }
          });
          
          // Check if team exists in our CSV data
          const teamData = teamAbbr ? this.teams.get(teamAbbr) : null;
          if (teamAbbr && teamData) {
            matchedTeams++;
          } else if (teamAbbr) {
            unmatchedTeams++;
            console.log(`[Test] Unmatched team abbreviation: ${teamAbbr}`);
            this.unmatchedTeams.add(teamAbbr);
          }

          const isFreeAgent = !teamAbbr || !teamData;
          if (isFreeAgent) freeAgents++;
          
          const compatibilityScore = this.calculateCompatibilityScore(stats);
          
          const player = {
            name: playerName,
            team: teamData ? teamData.name : null,
            team_abbreviation: teamAbbr || null,
            country: playerCountry,
            country_code: countryCode,
            // Add flag information for UI rendering
            flag: {
              code: countryCode?.toLowerCase(),
              // Using flag-icons format
              css_class: `fi fi-${countryCode?.toLowerCase()}`,
              // Fallback URL if needed
              url: countryCode ? `https://flagcdn.com/${countryCode.toLowerCase()}.svg` : null
            },
            stats,
            compatibilityScore,
            isFreeAgent,
            freeAgentBadge: isFreeAgent ? 'FA' : null,
            lastUpdated: new Date().toISOString()
          };

          if (player.name) {
            players.push(player);
          }
        } catch (rowError) {
          console.error(`[Test] Error processing player row: ${rowError.message}`);
        }
      });

      console.log(`[Test] Found ${players.length} players on page`);
      console.log(`[Test] Team matching stats: ${matchedTeams} matched, ${unmatchedTeams} unmatched`);
      console.log(`[Test] Free agents: ${freeAgents}`);
      console.log(`[Test] Unmatched teams: ${this.unmatchedTeams.size}`);
      if (this.unmatchedTeams.size > 0) {
        console.log('Unmatched team abbreviations:', Array.from(this.unmatchedTeams).join(', '));
      }
      return players;
    } catch (error) {
      console.error(`[Test] Error scraping player list: ${error.message}`);
      return [];
    }
  }

  async scrapeTeams(url) {
    try {
      console.log(`[Test] Scraping teams from ${url}`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      
      // Find all tables and get the teams table (usually the second one)
      const teamsTable = $('.wf-table').eq(1);
      if (!teamsTable.length) {
        console.error('[Test] Could not find teams table');
        return [];
      }

      const teams = [];
      
      teamsTable.find('tbody tr').each((i, row) => {
        try {
          const $row = $(row);
          
          // Extract team info using specific indices
          const teamCell = $row.find('td:first-child');
          const teamName = teamCell.find('.text-of').text().trim();
          const teamRegion = teamCell.find('.ge-text-light').text().trim();
          
          // Extract stats using specific indices
          const stats = {};
          $row.find('td').each((index, cell) => {
            const value = $(cell).text().trim();
            switch(index) {
              case 1: // Rating
                stats.rating = parseFloat(value) || 0;
                break;
              case 2: // ACS
                stats.acs = parseFloat(value) || 0;
                break;
              case 3: // K:D
                stats.kd = parseFloat(value) || 0;
                break;
              case 4: // Win Rate
                stats.winRate = parseFloat(value?.replace('%', '')) || 0;
                break;
            }
          });
          
          const team = {
            name: teamName,
            region: teamRegion,
            stats
          };

          if (team.name) {
            teams.push(team);
          }
        } catch (rowError) {
          console.error(`[Test] Error processing team row: ${rowError.message}`);
        }
      });

      console.log(`[Test] Found ${teams.length} teams on page`);
      return teams;
    } catch (error) {
      console.error(`[Test] Error scraping teams list: ${error.message}`);
      return [];
    }
  }
}

async function runTest() {
  try {
    console.log('[Test] Starting scraper test...');
    const scraper = new TestScraper();
    
    // Load teams from CSV first
    await scraper.loadTeams();
    
    // Test player list scraping
    const playerUrl = 'https://www.vlr.gg/stats/players?page=1';
    console.log(`[Test] Scraping players from: ${playerUrl}`);
    
    const players = await scraper.scrapePlayerList(playerUrl);
    
    if (players.length === 0) {
      console.error('[Test] No players found!');
      return;
    }
    
    console.log(`[Test] Found ${players.length} players`);
    
    // Log details of first 3 players to verify data
    players.slice(0, 3).forEach((player, index) => {
      console.log(`\n[Test] Player ${index + 1}:`);
      console.log(`Name: ${player.name}`);
      console.log(`Team: ${player.team || 'Free Agent'}`);
      console.log(`Country: ${player.country} (${player.country_code})`);
      console.log(`Compatibility Score: ${player.compatibilityScore.toFixed(2)}`);
      console.log(`Stats:`, player.stats);
    });
    
    // Test team scraping
    const teamUrl = 'https://www.vlr.gg/stats/teams?page=1';
    console.log(`\n[Test] Scraping teams from: ${teamUrl}`);
    
    const teams = await scraper.scrapeTeams(teamUrl);
    
    if (teams.length === 0) {
      console.error('[Test] No teams found!');
      return;
    }
    
    console.log(`[Test] Found ${teams.length} teams`);
    
    // Log details of first 3 teams to verify data
    teams.slice(0, 3).forEach((team, index) => {
      console.log(`\n[Test] Team ${index + 1}:`);
      console.log(`Name: ${team.name}`);
      console.log(`Region: ${team.region}`);
      console.log(`Stats:`, team.stats);
    });
    
  } catch (error) {
    console.error('[Test] Error during test:', error);
  }
}

// Run the test
runTest(); 