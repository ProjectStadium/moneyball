const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

class VLRScraper {
  constructor() {
    this.baseUrl = 'https://www.vlr.gg';
    this.statsUrl = 'https://www.vlr.gg/stats';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
    };
    this.db = db;
  }

  async makeRequest(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Making request to ${url}...`);
        const response = await axios.get(url, { headers: this.headers });
        console.log(`Response status: ${response.status}`);
        return response.data;
      } catch (error) {
        console.error(`Error making request to ${url}:`, error.message);
        if (i === retries - 1) throw error;
        
        if (error.response) {
          if (error.response.status === 429) {
            const waitTime = 5000 * (i + 1);
            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (error.response.status === 503) {
            const waitTime = 3000 * (i + 1);
            console.log(`Service unavailable. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        } else {
          const waitTime = 2000 * (i + 1);
          console.log(`Network error. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  extractAgentData($, $row) {
    const agents = [];
    let additionalAgents = 0;
    
    // Find all agent images
    $row.find('.mod-agents img').each((_, img) => {
      const $img = $(img);
      const src = $img.attr('src');
      const title = $img.attr('title');
      
      if (src) {
        const agentName = src.split('/').pop().replace('.png', '');
        if (agentName && !agents.includes(agentName)) {
          agents.push(agentName);
        }
      } else if (title) {
        if (!agents.includes(title)) {
          agents.push(title);
        }
      }
    });

    // Check for additional agents
    const additionalText = $row.find('.mod-agents .more-agents').text();
    const match = additionalText.match(/\+(\d+)/);
    if (match) {
      additionalAgents = parseInt(match[1]) || 0;
    }

    return {
      agents,
      additionalAgents
    };
  }

  async scrapePlayerList(page = 1) {
    try {
      const url = `${this.statsUrl}/?page=${page}`;
      console.log(`Scraping player list from ${url}...`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      const players = [];

      // Find the stats table
      const statsTable = $('.wf-table.mod-stats.mod-scroll');
      console.log('Found stats table:', statsTable.length > 0);

      if (!statsTable.length) {
        console.error('Could not find stats table');
        return [];
      }

      // Extract raw data from each row
      statsTable.find('tbody tr').each((_, element) => {
        try {
          const $row = $(element);
          
          // Clean up player name and extract team
          const playerNameText = $row.find('.mod-player a').text();
          const [playerName, teamAbbr] = this.cleanText(playerNameText).split(/\s+/);
          
          // Extract stats
          const stats = {};
          const statNames = ['rating', 'acs', 'kd_ratio', 'kast', 'adr', 'kpr', 'apr', 'fk_pr', 'fd_pr', 'hs_pct'];
          
          $row.find('.mod-color-sq').each((index, cell) => {
            const $cell = $(cell);
            const rawValue = $cell.text().trim();
            const statName = statNames[index];
            
            if (statName && rawValue) {
              // Convert percentages to decimals
              if (statName === 'kast' || statName === 'hs_pct') {
                stats[statName] = parseFloat(rawValue.replace('%', '')) / 100;
              } else {
                stats[statName] = parseFloat(rawValue) || 0;
              }
            }
          });

          // Extract clutch stats
          const clutchText = $row.find('.mod-cl').text().trim();
          const [clutchWon, clutchTotal] = clutchText.split('/').map(n => parseInt(n.trim()) || 0);

          // Extract agent data
          const agentData = this.extractAgentData($, $row);

          // Player info
          const flagClass = $row.find('.mod-player .flag').attr('class');
          console.log(`Flag class for ${playerName}:`, flagClass);
          
          const rawData = {
            // Player info
            player_name: playerName,
            player_url: $row.find('.mod-player a').attr('href') ? `${this.baseUrl}${$row.find('.mod-player a').attr('href')}` : null,
            player_flag: flagClass,
            player_flag_title: $row.find('.mod-player .flag').attr('title') || null,
            country_code: flagClass?.match(/mod-(\w+)/)?.[1]?.toUpperCase() || null,
            
            // Team info
            team_name: $row.find('.mod-team a').text().trim(),
            team_abbr: teamAbbr || '',
            
            // Raw stats
            rounds_played: parseInt($row.find('.mod-rnd').text().trim()) || 0,
            ...stats,
            
            // Clutch stats
            clutch_won: clutchWon,
            clutch_total: clutchTotal,
            
            // Agent info
            agents: agentData.agents,
            additional_agents: agentData.additionalAgents
          };

          if (rawData.player_name) {
            console.log(`Found player: ${rawData.player_name}`);
            players.push(rawData);
          }
        } catch (error) {
          console.error('Error extracting raw player data:', error);
        }
      });

      console.log(`Found ${players.length} players on page ${page}`);
      return players;
    } catch (error) {
      console.error('Error scraping player list:', error);
      throw error;
    }
  }

  async scrapeAllPlayers() {
    try {
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`Scraping page ${page}...`);
        const players = await this.scrapePlayerList(page);
        
        if (players.length === 0) {
          hasMorePages = false;
          continue;
        }

        console.log(`Found ${players.length} players on page ${page}`);

        for (const playerData of players) {
          try {
            const playerToSave = {
              id: uuidv4(),
              name: playerData.player_name || 'Unknown',
              full_identifier: playerData.player_url,
              player_img_url: null,
              team_name: playerData.team_name || null,
              team_abbreviation: playerData.team_abbr || null,
              team_logo_url: null,
              country_name: playerData.player_flag_title || null,
              country_code: playerData.country_code || null,
              is_free_agent: !playerData.team_name,
              acs: parseFloat(playerData.acs) || null,
              kd_ratio: parseFloat(playerData.kd_ratio) || null,
              adr: parseFloat(playerData.adr) || null,
              kpr: parseFloat(playerData.kpr) || null,
              apr: parseFloat(playerData.apr) || null,
              fk_pr: parseFloat(playerData.fk_pr) || null,
              fd_pr: parseFloat(playerData.fd_pr) || null,
              hs_pct: parseFloat(playerData.hs_pct) || null,
              rating: parseFloat(playerData.rating) || null,
              agent_usage: playerData.agents || {},  // Let Sequelize handle the JSON conversion
              division: 'T3', // Default until we get division data from Liquipedia
              last_updated: new Date(),
              source: 'VLR'
            };

            try {
              await this.db.Player.create(playerToSave);
              console.log(`Successfully saved player: ${playerData.player_name}`);
            } catch (error) {
              if (error.name === 'SequelizeUniqueConstraintError') {
                console.log(`Player ${playerData.player_name} already exists, skipping...`);
              } else if (error.name === 'SequelizeValidationError') {
                console.error(`Validation error for player ${playerData.player_name}:`, error.errors.map(e => e.message));
              } else {
                console.error(`Error saving player ${playerData.player_name}:`, error.message);
              }
            }
          } catch (error) {
            console.error(`Error saving player data: ${error.message}`);
          }
        }

        // Add a delay between pages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        page++;
      }
    } catch (error) {
      console.error('Error in scrapeAllPlayers:', error);
      throw error;
    }
  }

  async scrapeTeamList() {
    const regions = [
      { url: '/rankings', name: 'World' },
      { url: '/rankings/north-america', name: 'North America' },
      { url: '/rankings/europe', name: 'Europe' },
      { url: '/rankings/brazil', name: 'Brazil' },
      { url: '/rankings/asia-pacific', name: 'Asia-Pacific' },
      { url: '/rankings/korea', name: 'Korea' },
      { url: '/rankings/china', name: 'China' },
      { url: '/rankings/japan', name: 'Japan' },
      { url: '/rankings/la-s', name: 'Latin America South' },
      { url: '/rankings/la-n', name: 'Latin America North' },
      { url: '/rankings/oceania', name: 'Oceania' },
      { url: '/rankings/mena', name: 'MENA' },
      { url: '/rankings/gc', name: 'Game Changers' }
    ];

    const allTeams = [];
    const processedTeamIds = new Set(); // To avoid duplicate teams

    try {
      for (const region of regions) {
        console.log(`Scraping teams from ${region.name} region...`);
        const url = `${this.baseUrl}${region.url}`;
        const html = await this.makeRequest(url);
        const $ = cheerio.load(html);
        
        // Find all team rows in the rankings table
        $('div.rank-item, tr.rank-item').each((_, element) => {
          try {
            const $row = $(element);
            
            // Extract team URL to get team ID
            const teamUrl = $row.find('a[href*="/team/"]').attr('href');
            const teamId = teamUrl ? teamUrl.match(/\/team\/(\d+)\//)?.[1] : null;
            
            if (teamId && !processedTeamIds.has(teamId)) {
              processedTeamIds.add(teamId);
              
              const teamData = {
                id: uuidv4(),
                team_abbreviation: $row.find('.rank-item-team-name').text().trim(),
                full_team_name: $row.find('.rank-item-team-name').attr('title') || '',
                team_url: teamUrl ? `${this.baseUrl}${teamUrl}` : null,
                region: region.name,
                rank: parseInt($row.find('.rank-item-rank-num').text().trim()) || null,
                rating: parseFloat($row.find('.rank-item-rating').text().trim()) || null,
                earnings: this.parseEarnings($row.find('.rank-item-earnings').text().trim()),
                roster_size: parseInt($row.find('.rank-item-roster-size').text().trim()) || null,
                last_updated: new Date()
              };

              if (teamData.team_abbreviation) {
                console.log(`Found team: ${teamData.team_abbreviation} (${region.name})`);
                allTeams.push(teamData);
              }
            }
          } catch (error) {
            console.error('Error extracting team data:', error);
          }
        });

        // Add delay between regions to avoid rate limiting
        if (region !== regions[regions.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Found ${allTeams.length} unique teams across all regions`);
      
      // Save teams to database
      for (const teamData of allTeams) {
        try {
          await this.db.Team.create(teamData);
          console.log(`Successfully saved team: ${teamData.team_abbreviation}`);
        } catch (error) {
          console.error(`Error saving team ${teamData.team_abbreviation}:`, error.message);
        }
      }

      return allTeams;
    } catch (error) {
      console.error('Error scraping team list:', error);
      throw error;
    }
  }

  async scrapeTournamentList() {
    try {
      const url = `${this.baseUrl}/events`;
      console.log(`Scraping tournament list from ${url}...`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      const tournaments = [];

      // Find all tournament cards
      $('.wf-card').each((_, element) => {
        try {
          const $card = $(element);
          
          const tournamentData = {
            name: $card.find('.event-name').text().trim(),
            tournament_url: $card.find('a').attr('href') ? `${this.baseUrl}${$card.find('a').attr('href')}` : null,
            dates: this.parseTournamentDates($card.find('.event-dates').text().trim()),
            prize_pool: this.parsePrizePool($card.find('.event-prize').text().trim()),
            status: this.getTournamentStatus($card),
            region: $card.find('.event-region').text().trim(),
            teams: this.extractTeamList($card.find('.event-teams'))
          };

          if (tournamentData.name) {
            console.log(`Found tournament: ${tournamentData.name}`);
            tournaments.push(tournamentData);
          }
        } catch (error) {
          console.error('Error extracting tournament data:', error);
        }
      });

      console.log(`Found ${tournaments.length} tournaments`);
      return tournaments;
    } catch (error) {
      console.error('Error scraping tournament list:', error);
      throw error;
    }
  }

  async scrapePlayerDetails(playerUrl) {
    try {
      const url = `${this.baseUrl}${playerUrl}`;
      console.log(`Scraping player details from ${url}...`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      
      const playerData = {
        agent_usage: this.extractAgentUsage($),
        playstyle: this.extractPlaystyle($),
        division: this.extractDivision($),
        achievements: this.extractAchievements($),
        lastUpdated: new Date()
      };

      return playerData;
    } catch (error) {
      console.error('Error scraping player details:', error);
      throw error;
    }
  }

  async scrapePlayerEarnings(playerUrl) {
    try {
      const url = `${this.baseUrl}${playerUrl}`;
      console.log(`Scraping player earnings from ${url}...`);
      const html = await this.makeRequest(url);
      const $ = cheerio.load(html);
      
      // Find earnings in the player's profile
      const earnings = $('.player-earnings').text().trim();
      return this.parseEarnings(earnings);
    } catch (error) {
      console.error('Error scraping player earnings:', error);
      throw error;
    }
  }

  // Helper methods
  parseEarnings(text) {
    const match = text.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  parseTournamentDates(text) {
    const dates = text.split(' - ').map(d => new Date(d.trim()));
    return {
      startDate: dates[0],
      endDate: dates[1] || dates[0]
    };
  }

  parsePrizePool(text) {
    const match = text.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  getTournamentStatus(card) {
    if (card.hasClass('mod-upcoming')) return 'upcoming';
    if (card.hasClass('mod-ongoing')) return 'ongoing';
    return 'completed';
  }

  extractTeamList($teams) {
    const teams = [];
    $teams.find('.team-item').each((_, team) => {
      const teamName = $(team).text().trim();
      if (teamName) teams.push(teamName);
    });
    return teams;
  }

  // Helper methods for player details
  extractAgentUsage($) {
    const agentUsage = {};
    $('.agent-usage-stats .agent-item').each((_, element) => {
      const $agent = $(element);
      const agentName = $agent.find('.agent-name').text().trim();
      const playRate = parseFloat($agent.find('.play-rate').text());
      if (agentName && !isNaN(playRate)) {
        agentUsage[agentName] = playRate;
      }
    });
    return agentUsage;
  }

  extractPlaystyle($) {
    const playstyle = {
      roles: [],
      preferredWeapons: [],
      playStyle: ''
    };

    // Extract roles
    $('.player-roles .role').each((_, element) => {
      const role = $(element).text().trim();
      if (role) playstyle.roles.push(role);
    });

    // Extract preferred weapons
    $('.preferred-weapons .weapon').each((_, element) => {
      const weapon = $(element).text().trim();
      if (weapon) playstyle.preferredWeapons.push(weapon);
    });

    // Extract play style description
    playstyle.playStyle = $('.player-playstyle').text().trim();

    return playstyle;
  }

  extractDivision($) {
    const divisionText = $('.player-division').text().trim();
    // Extract T1, T2, T3, etc. from the text
    const match = divisionText.match(/T[1-4]/);
    return match ? match[0] : 'Unranked';
  }

  extractAchievements($) {
    const achievements = [];
    $('.player-achievements .achievement').each((_, element) => {
      const $achievement = $(element);
      achievements.push({
        tournament: $achievement.find('.tournament').text().trim(),
        placement: $achievement.find('.placement').text().trim(),
        date: $achievement.find('.date').text().trim(),
        prize: this.parseEarnings($achievement.find('.prize').text().trim())
      });
    });
    return achievements;
  }
}

module.exports = new VLRScraper(); 