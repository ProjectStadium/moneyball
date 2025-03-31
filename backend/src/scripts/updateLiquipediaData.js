require('dotenv').config();
const db = require('../models');
const LiquipediaService = require('../services/liquipedia.service');
const cache = require('../services/cache.service');
const { Op } = require('sequelize');

const liquipediaService = new LiquipediaService();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePlayerData(player) {
  try {
    console.log(`Processing player: ${player.name}`);
    
    // Check cache first
    const cacheKey = cache.getPlayerKey(player.name);
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData && cachedData.last_updated && 
        (Date.now() - new Date(cachedData.last_updated).getTime() < 7 * 24 * 60 * 60 * 1000)) {
      console.log(`Using cached data for ${player.name}`);
      await player.update(cachedData);
      return true;
    }
    
    // Search for player on Liquipedia
    const searchResults = await liquipediaService.searchPlayer(player.name);
    
    if (!searchResults || searchResults.length === 0) {
      console.log(`No Liquipedia data found for ${player.name}`);
      return false;
    }

    // Get the first result
    const liquipediaPlayer = searchResults[0];
    console.log(`Found Liquipedia page: ${liquipediaPlayer.title}`);

    // Get detailed player data
    const liquipediaData = await liquipediaService.getPlayerPage(liquipediaPlayer.title);
    
    if (liquipediaData) {
      // Extract earnings data
      const earnings = liquipediaService._extractEarningsFromPage(liquipediaData);
      
      // Prepare player data
      const playerData = {
        liquipedia_url: liquipediaPlayer.url,
        liquipedia_stats: {
          ...liquipediaData,
          last_updated: new Date()
        },
        total_earnings: earnings ? earnings.total : 0,
        tournament_earnings: earnings ? earnings.tournaments : [],
        earnings_last_updated: new Date()
      };

      // Update player record
      await player.update(playerData);

      // Cache the data
      await cache.set(cacheKey, playerData, cache.durations.EXTRA_LONG);

      console.log(`Successfully updated data for ${player.name}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating data for ${player.name}:`, error);
    return false;
  }
}

async function batchUpdatePlayers() {
  try {
    console.log('Starting batch update of player data from Liquipedia...');
    
    // Get all players without Liquipedia data or with old data
    const players = await db.Player.findAll({
      where: {
        [Op.or]: [
          { liquipedia_url: null },
          { 
            earnings_last_updated: {
              [Op.or]: [
                null,
                { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
              ]
            }
          }
        ]
      }
    });

    console.log(`Found ${players.length} players to update`);
    
    let successCount = 0;
    let failureCount = 0;

    // Process players with rate limiting
    for (const player of players) {
      const success = await updatePlayerData(player);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add delay between requests to respect rate limits
      await sleep(2000); // 2 seconds delay between players
    }

    console.log('\nBatch Update Results:');
    console.log('--------------------');
    console.log(`Total Players Processed: ${players.length}`);
    console.log(`Successful Updates: ${successCount}`);
    console.log(`Failed Updates: ${failureCount}`);

  } catch (error) {
    console.error('Error in batch update:', error);
  } finally {
    process.exit();
  }
}

// Run the batch update
batchUpdatePlayers(); 