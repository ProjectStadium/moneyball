require('dotenv').config();
const db = require('../models');
const { Op } = require('sequelize');

async function checkPlayers() {
  try {
    // Get total player count
    const totalPlayers = await db.Player.count();
    
    // Get players with Liquipedia data
    const playersWithLiquipedia = await db.Player.count({
      where: {
        liquipedia_url: { [Op.not]: null }
      }
    });
    
    // Get players with earnings data
    const playersWithEarnings = await db.Player.count({
      where: {
        total_earnings: { [Op.gt]: 0 }
      }
    });
    
    // Get players by division
    const playersByDivision = await db.Player.findAll({
      attributes: [
        'division',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['division']
    });
    
    console.log('\nPlayer Database Statistics:');
    console.log('---------------------------');
    console.log(`Total Players: ${totalPlayers}`);
    console.log(`Players with Liquipedia Data: ${playersWithLiquipedia}`);
    console.log(`Players with Earnings Data: ${playersWithEarnings}`);
    console.log('\nPlayers by Division:');
    playersByDivision.forEach(div => {
      console.log(`${div.division || 'Unknown'}: ${div.get('count')}`);
    });
    
    // Get some sample players with Liquipedia data
    console.log('\nSample Players with Liquipedia Data:');
    const samplePlayers = await db.Player.findAll({
      where: {
        liquipedia_url: { [Op.not]: null }
      },
      limit: 5,
      attributes: ['name', 'liquipedia_url', 'total_earnings', 'earnings_last_updated']
    });
    
    samplePlayers.forEach(player => {
      console.log(`\nName: ${player.name}`);
      console.log(`Liquipedia URL: ${player.liquipedia_url}`);
      console.log(`Total Earnings: $${player.total_earnings || 0}`);
      console.log(`Last Updated: ${player.earnings_last_updated || 'Never'}`);
    });
    
  } catch (error) {
    console.error('Error checking players:', error);
  } finally {
    process.exit();
  }
}

checkPlayers(); 