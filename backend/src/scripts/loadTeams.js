require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const db = require('../models');
const { syncDatabase } = require('../utils/database');

async function loadTeams() {
  try {
    console.log('Starting team data import...');
    
    // Sync database first
    console.log('Syncing database...');
    await syncDatabase();
    
    // Read the CSV file
    const csvFilePath = path.join(__dirname, '../../../data/updated_esport_teams.csv');
    console.log('Looking for CSV at:', csvFilePath);
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV content
    const records = await new Promise((resolve, reject) => {
      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    console.log(`Found ${records.length} teams in CSV`);

    // Transform records for database
    const teams = records.map(record => ({
      team_abbreviation: record.team_abbreviation,
      full_team_name: record.full_team_name,
      tag: record.tag,
      region: record.region,
      country: record.country,
      country_code: record.country_code,
      rank: record.rank ? parseInt(record.rank) : null,
      score: record.score ? parseFloat(record.score) : null,
      record: record.record,
      earnings: record.earnings ? parseFloat(record.earnings) : null,
      founded_year: record.founded_year ? parseInt(record.founded_year) : null,
      game: record.game,
      logo_url: record.logo_url,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Bulk create teams
    const result = await db.Team.bulkCreate(teams, {
      updateOnDuplicate: [
        'full_team_name', 'tag', 'region', 'country', 'country_code',
        'rank', 'score', 'record', 'earnings', 'founded_year',
        'game', 'logo_url', 'updated_at'
      ]
    });

    console.log(`Successfully imported ${result.length} teams`);
    process.exit(0);
  } catch (error) {
    console.error('Error loading teams:', error);
    process.exit(1);
  }
}

loadTeams(); 