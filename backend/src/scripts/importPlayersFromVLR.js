const db = require('../models');
const Player = db.Player;
const scraper = require('../services/scraper.service');
const { Op } = require('sequelize');
const { testConnection, syncDatabase, withTransaction, batchOperation } = require('../utils/database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const ValorantScraper = require('../services/scraper.service');

// Load Valorant teams CSV
const teamsCsvPath = path.join(__dirname, '../../../data/updated_esport_teams.csv');
const teamsCsvContent = fs.readFileSync(teamsCsvPath, 'utf-8');
const teamsData = csv.parse(teamsCsvContent, {
  columns: true,
  skip_empty_lines: true
});

// Create a map of team abbreviations to full names
const teamNameMap = new Map(teamsData.map(team => [team.abbreviation, team.name]));

// Validation schema for player data
const playerSchema = {
  name: (value) => typeof value === 'string' && value.length > 0,
  team_abbreviation: (value) => typeof value === 'string' || value === null,
  country_code: (value) => typeof value === 'string' || value === null,
  is_free_agent: (value) => typeof value === 'boolean',
  rating: (value) => value === null || (typeof value === 'number' && value >= 0),
  kd_ratio: (value) => value === null || (typeof value === 'number' && value >= 0),
  acs: (value) => value === null || (typeof value === 'number' && value >= 0),
  adr: (value) => value === null || (typeof value === 'number' && value >= 0),
  kast: (value) => value === null || (typeof value === 'number' && value >= 0 && value <= 1),
  division: (value) => ['T1', 'T2', 'T3', 'T4'].includes(value),
  last_updated: (value) => value instanceof Date
};

function normalizeName(name) {
  // Remove all whitespace characters (spaces, tabs, newlines) and trim
  return name.replace(/[\s\t\n]+/g, ' ').trim();
}

function validatePlayerData(data) {
  const errors = [];
  for (const [key, validator] of Object.entries(playerSchema)) {
    if (key in data && !validator(data[key])) {
      errors.push(`Invalid ${key}: ${data[key]}`);
    }
  }
  return errors;
}

async function scrapeAllPlayers() {
  const allPlayers = [];
  let page = 1;
  let hasMorePages = true;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (hasMorePages && page <= 10) {
    try {
      console.log(`Scraping page ${page}...`);
      const players = await scraper.scrapePlayerList(`https://www.vlr.gg/stats/players?page=${page}`);
      
      if (!players || players.length === 0) {
        hasMorePages = false;
      } else {
        allPlayers.push(...players);
        page++;
        consecutiveErrors = 0; // Reset error counter on success
        // Add a delay between pages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      consecutiveErrors++;
      console.error(`Error scraping page ${page}:`, error.message);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error('Too many consecutive errors, stopping scrape');
        break;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, consecutiveErrors), 30000);
      console.log(`Waiting ${delay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return allPlayers;
}

async function processPlayer(vlrPlayer, existingPlayerNames, transaction) {
  try {
    // Clean up the player name
    const fullName = normalizeName(vlrPlayer.name);
    let playerName = fullName;
    
    // 1. Read the .stats-player-country string
    const countryString = vlrPlayer.country_string;
    
    // 2 & 3. Determine if there is a string and set freeAgent status
    const freeAgent = !countryString;
    
    // 4 & 5. Cross reference against CSV and update if needed
    let teamName = null;
    let teamAbbreviation = null;
    
    if (countryString) {
      // Verify team exists in CSV and get team data
      const teamExists = await scraper.verifyAndUpdateTeam(countryString);
      if (teamExists) {
        teamName = countryString;
        // Use the team abbreviation exactly as it appears in the player name
        teamAbbreviation = vlrPlayer.team_abbreviation;
      }
    }

    // Validate and clean stats
    const validateStat = (value, statName) => {
      if (value === null || value === undefined) {
        console.warn(`[Scraper] Missing ${statName} for player ${playerName}`);
        return null;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        console.warn(`[Scraper] Invalid ${statName} value "${value}" for player ${playerName}`);
        return null;
      }
      return numValue;
    };

    const stats = {
      acs: validateStat(vlrPlayer.stats?.acs, 'ACS'),
      kd: validateStat(vlrPlayer.stats?.kd, 'K/D'),
      adr: validateStat(vlrPlayer.stats?.adr, 'ADR'),
      kpr: validateStat(vlrPlayer.stats?.kpr, 'KPR'),
      apr: validateStat(vlrPlayer.stats?.apr, 'APR'),
      fkpr: validateStat(vlrPlayer.stats?.fkpr, 'FKPR'),
      fdpr: validateStat(vlrPlayer.stats?.fdpr, 'FDPR'),
      hs: validateStat(vlrPlayer.stats?.hs, 'HS%'),
      rating: validateStat(vlrPlayer.stats?.rating, 'Rating'),
      kast: validateStat(vlrPlayer.stats?.kast, 'KAST')
    };

    // Check if we have enough valid stats
    const validStatsCount = Object.values(stats).filter(v => v !== null).length;
    if (validStatsCount < 3) {
      console.warn(`[Scraper] Player ${playerName} has insufficient valid stats (${validStatsCount}/9)`);
    }

    const playerData = {
      name: playerName,
      full_identifier: `${playerName}_${teamAbbreviation || 'free_agent'}`,
      player_img_url: vlrPlayer.player_img_url || null,
      team_name: teamName,
      team_abbreviation: teamAbbreviation,
      team_logo_url: null,
      country_name: vlrPlayer.country_name || null,
      country_code: vlrPlayer.country_code || null,
      is_free_agent: freeAgent,
      acs: stats.acs,
      kd_ratio: stats.kd,
      adr: stats.adr,
      kpr: stats.kpr,
      apr: stats.apr,
      fk_pr: stats.fkpr,
      fd_pr: stats.fdpr,
      hs_pct: stats.hs,
      rating: stats.rating,
      agent_usage: vlrPlayer.agent_usage || {},
      playstyle: {
        kast: stats.kast,
        roles: vlrPlayer.roles || [],
        primary_role: vlrPlayer.primary_role || null,
        role_distribution: vlrPlayer.role_distribution || {},
        total_agents: vlrPlayer.total_agents || 0,
        visible_agents: vlrPlayer.visible_agents || 0,
        additional_agents: vlrPlayer.additional_agents || 0
      },
      division: 'T3',
      tournament_history: [],
      last_updated: new Date(),
      total_earnings: null,
      earnings_by_year: {},
      tournament_earnings: [],
      earnings_last_updated: new Date(),
      source: 'VLR',
      current_act: null,
      leaderboard_rank: null,
      ranked_rating: null,
      number_of_wins: null
    };

    // Log player info without attempting to download images
    console.log(`[Scraper] Found player: ${fullName}, country code: ${playerData.country_code}, team: ${teamAbbreviation || 'Free Agent'}, roles: ${playerData.playstyle.roles.join(', ')} (${playerData.playstyle.visible_agents} visible + ${playerData.playstyle.additional_agents} additional)`);

    // Validate data
    const validationErrors = validatePlayerData(playerData);
    if (validationErrors.length > 0) {
      console.error(`Validation errors for player ${fullName}:`, validationErrors);
      return { success: false, error: 'Validation failed', details: validationErrors, name: fullName };
    }

    // Find existing player or create new one
    const [player, created] = await Player.findOrCreate({
      where: { name: playerData.name },
      defaults: playerData,
      transaction
    });

    if (!created) {
      // Update existing player
      await player.update(playerData);
      console.log(`Successfully updated player: ${fullName} (Free Agent: ${playerData.is_free_agent}, Roles: ${playerData.playstyle.roles.join(', ')})`);
      return { success: true, action: 'updated', name: fullName };
    } else {
      console.log(`Successfully created player: ${fullName} with ID: ${player.id} (Roles: ${playerData.playstyle.roles.join(', ')})`);
      return { success: true, action: 'created', name: fullName };
    }
  } catch (error) {
    console.error(`Error processing player ${vlrPlayer.name}:`, error);
    return { success: false, error: error.message, name: vlrPlayer.name };
  }
}

async function importPlayersFromVLR() {
  try {
    console.log('Starting player import from VLR...');
    
    // Scrape all players from VLR
    const vlrPlayers = await scrapeAllPlayers();
    console.log(`Found ${vlrPlayers.length} players on VLR`);
    
    if (!vlrPlayers || vlrPlayers.length === 0) {
      console.error('No players found or scraping failed');
      return;
    }
    
    // Get existing players from database
    console.log('\nFetching existing players from database...');
    const existingPlayers = await Player.findAll({
      attributes: ['name']
    });
    console.log(`Found ${existingPlayers.length} existing players in database`);
    
    const existingPlayerNames = new Set(existingPlayers.map(p => normalizeName(p.name)));
    
    // Process players in smaller batches for better transaction handling
    const batchSize = 25; // Reduced batch size for better error tracking
    console.log(`\nProcessing players in batches of ${batchSize}...`);
    
    const results = await batchOperation(vlrPlayers, async (player, transaction) => {
      console.log(`\nStarting transaction for player: ${player.name}`);
      const result = await processPlayer(player, existingPlayerNames, transaction);
      console.log(`Transaction completed for player: ${player.name} - ${result.success ? 'Success' : 'Failed'}`);
      return result;
    }, batchSize);
    
    // Analyze results
    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      created: results.filter(r => r.success && r.action === 'created').length,
      updated: results.filter(r => r.success && r.action === 'updated').length
    };
    
    console.log('\nImport Summary:');
    console.log(`Total players found on VLR: ${stats.total}`);
    console.log(`New players created: ${stats.created}`);
    console.log(`Existing players updated: ${stats.updated}`);
    console.log(`Failed operations: ${stats.failed}`);
    
    if (stats.failed > 0) {
      console.log('\nFailed operations:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`\nPlayer: ${r.name}`);
          console.log(`Error: ${r.error}`);
          if (r.details) {
            console.log('Details:', r.details);
          }
        });
    }
    
  } catch (error) {
    console.error('\nError in importPlayersFromVLR:', error);
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', {
        message: error.message,
        sql: error.sql,
        parameters: error.parameters,
        code: error.code,
        errno: error.errno
      });
    }
    throw error;
  }
}

// Initialize database and run the import
async function main() {
  try {
    // Initialize database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database schema
    await db.sequelize.sync();
    console.log('Database schema synced successfully.');
    
    // Run the import
    console.log('Starting player import process...');
    await importPlayersFromVLR();
    
    console.log('Import completed successfully.');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    // Close database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  if (error.name === 'SequelizeDatabaseError') {
    console.error('Database error details:', {
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });
  }
  process.exit(1);
});

// Run the main function
main(); 