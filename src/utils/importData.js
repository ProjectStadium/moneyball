import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/index.js';

// Helper to resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function importTeamsFromCSV() {
  // Read the teams CSV file
  const teamsFilePath = path.join(__dirname, '../../data/updated_esport_teams.csv');
  const teamsCsv = fs.readFileSync(teamsFilePath, 'utf8');

  // Parse the CSV data
  const teamsData = Papa.parse(teamsCsv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  }).data;

  console.log(`Processed ${teamsData.length} teams from CSV`);

  // Format the data for database insertion
  const formattedTeams = teamsData.map((team) => ({
    id: uuidv4(),
    team_abbreviation: team.team_abbreviation,
    full_team_name: team.full_team_name,
    tag: team.tag,
    region: team.region,
    country: team.country,
    country_code: team.country_code,
    rank: team.rank,
    score: team.score,
    record: team.record,
    earnings: team.earnings,
    founded_year: team.founded_year,
    game: team.game,
    logo_url: team.logo_url,
  }));

  // Bulk insert teams with duplicate handling
  await db.Team.bulkCreate(formattedTeams, {
    ignoreDuplicates: true,
    updateOnDuplicate: ['team_abbreviation'],
  });

  console.log(`Imported ${formattedTeams.length} teams to database`);
}

export async function importPlayersFromCSV() {
  // Read the players CSV file
  const playersFilePath = path.join(__dirname, '../../data/valorant_players.csv');
  const playersCsv = fs.readFileSync(playersFilePath, 'utf8');

  // Parse the CSV data
  const playersData = Papa.parse(playersCsv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  }).data;

  console.log(`Processed ${playersData.length} players from CSV`);

  // Format the data for database insertion
  const formattedPlayers = playersData.map((player) => ({
    id: uuidv4(),
    name: player.name,
    full_identifier: player.full_identifier,
    player_img_url: player.player_img_url,
    team_name: player.team_name,
    team_abbreviation: player.team_abbreviation,
    team_logo_url: player.team_logo_url,
    country_name: player.country_name,
    country_code: player.country_code,
    is_free_agent: player.is_free_agent === 'true' || player.is_free_agent === true, // Handle string or boolean
    acs: player.acs,
    kd_ratio: player.kd_ratio,
    adr: player.adr,
    kpr: player.kpr,
    apr: player.apr,
    fk_pr: player.fk_pr,
    fd_pr: player.fd_pr,
    hs_pct: player.hs_pct,
    rating: player.rating,
    source: player.source,
    current_act: player.current_act,
    leaderboard_rank: player.leaderboard_rank,
    ranked_rating: player.ranked_rating,
    number_of_wins: player.number_of_wins,
  }));

  // Bulk insert players with duplicate handling
  await db.Player.bulkCreate(formattedPlayers, {
    ignoreDuplicates: true,
    updateOnDuplicate: ['name'],
  });

  console.log(`Imported ${formattedPlayers.length} players to database`);
}

export async function importAllData() {
  try {
    // Import teams first to establish foreign key relationships
    await importTeamsFromCSV();
    // Then import players
    await importPlayersFromCSV();
    console.log('Data import completed successfully');
    return { success: true, message: 'Data import completed successfully' };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}

export async function runImport() {
  console.log('Starting data import process...');
  const result = await importAllData();

  if (result.success) {
    console.log('Import completed successfully!');
    process.exit(0);
  } else {
    console.error('Import failed:', result.error);
    process.exit(1);
  }
}

// If this file is being run directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runImport();
}