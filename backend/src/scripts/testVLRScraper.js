const vlrScraper = require('../services/vlrScraper.service');
const dataEnrichment = require('../services/dataEnrichment.service');
const fs = require('fs');
const path = require('path');

async function testScraper() {
  try {
    // Scrape all players
    const players = await vlrScraper.scrapeAllPlayers(2);
    console.log(`Total players found across pages: ${players.length}`);

    // Enrich the player data
    const enrichedPlayers = dataEnrichment.enrichPlayersData(players);

    // Save raw data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rawDataPath = path.join(__dirname, '../../data', `vlr_raw_data_${timestamp}.json`);
    fs.writeFileSync(rawDataPath, JSON.stringify(players, null, 2));
    console.log(`Raw data saved to: ${rawDataPath}`);

    // Save enriched data
    const enrichedDataPath = path.join(__dirname, '../../data', `vlr_enriched_data_${timestamp}.json`);
    fs.writeFileSync(enrichedDataPath, JSON.stringify(enrichedPlayers, null, 2));
    console.log(`Enriched data saved to: ${enrichedDataPath}`);

    // Log some statistics
    const freeAgents = enrichedPlayers.filter(p => p.is_free_agent).length;
    const regions = new Map();
    enrichedPlayers.forEach(p => {
      if (p.region) {
        regions.set(p.region, (regions.get(p.region) || 0) + 1);
      }
    });

    console.log('\nStatistics:');
    console.log(`Total Players: ${enrichedPlayers.length}`);
    console.log(`Free Agents: ${freeAgents}`);
    console.log(`Signed Players: ${enrichedPlayers.length - freeAgents}`);
    console.log('\nPlayers by Region:');
    regions.forEach((count, region) => {
      console.log(`${region}: ${count}`);
    });

  } catch (error) {
    console.error('Error in test script:', error);
  }
}

testScraper(); 