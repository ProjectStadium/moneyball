const db = require('../models');
const Player = db.Player;
const scraper = require('../services/scraper.service');
const { Op } = require('sequelize');

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, ''); // Remove spaces
}

async function scrapeAllPlayers() {
  const allPlayers = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages && page <= 10) { // Limit to 10 pages for now
    console.log(`Scraping page ${page}...`);
    const players = await scraper.scrapePlayerList(`https://www.vlr.gg/stats/players?page=${page}`);
    
    if (players.length === 0) {
      hasMorePages = false;
    } else {
      allPlayers.push(...players);
      page++;
      // Add a delay between pages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return allPlayers;
}

async function updatePlayerCountryCodes() {
  try {
    console.log('Starting player country code update...');
    
    // Get all players from the database
    const players = await Player.findAll({
      where: {
        [Op.or]: [
          { country_code: null },
          { country_code: '' }
        ]
      }
    });
    console.log(`Found ${players.length} players in database`);
    
    // Scrape all players from VLR
    const vlrPlayers = await scrapeAllPlayers();
    console.log(`Found ${vlrPlayers.length} players on VLR`);
    
    // Create a map of normalized player names to country codes
    const playerCountryMap = new Map();
    vlrPlayers.forEach(player => {
      if (player.name && player.country_code) {
        const normalizedName = normalizeName(player.name);
        playerCountryMap.set(normalizedName, player.country_code);
        console.log(`Mapped ${player.name} (${normalizedName}) to ${player.country_code}`);
      }
    });
    
    // Update players in database
    let updatedCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    for (const player of players) {
      try {
        const normalizedName = normalizeName(player.name);
        const countryCode = playerCountryMap.get(normalizedName);
        
        console.log(`Checking player: ${player.name} (${normalizedName})`);
        
        if (countryCode) {
          if (!player.country_code || player.country_code !== countryCode) {
            await player.update({ country_code: countryCode });
            updatedCount++;
            console.log(`Updated country code for ${player.name}: ${countryCode}`);
          } else {
            console.log(`Country code already correct for ${player.name}: ${countryCode}`);
          }
        } else {
          notFoundCount++;
          console.log(`No country code found for ${player.name} (${normalizedName})`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        console.error(`Error updating player ${player.name}:`, error);
      }
      
      // Log progress
      console.log(`Progress: ${updatedCount + errorCount + notFoundCount}/${players.length} players processed`);
    }
    
    console.log('\nUpdate Summary:');
    console.log(`Total players processed: ${players.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Not found in VLR: ${notFoundCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in updatePlayerCountryCodes:', error);
    process.exit(1);
  }
}

// Run the update
updatePlayerCountryCodes(); 