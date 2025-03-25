require('dotenv').config();
const db = require('../models');
const vlrScraper = require('../services/vlrScraper.service');

async function runScraper() {
  try {
    console.log('Testing database connection...');
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    console.log('Starting VLR.gg scraper...');
    const players = await vlrScraper.scrapeAllPlayers(3); // Scrape first 3 pages
    console.log(`Successfully scraped ${players.length} players`);

    // Close database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
}

runScraper(); 