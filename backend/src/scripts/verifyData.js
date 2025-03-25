require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Team, Player } = require('../models');

async function verifyData() {
    try {
        // Check teams count
        const teamCount = await Team.count();
        console.log(`Total teams in database: ${teamCount}`);
        
        // Get sample teams
        const sampleTeams = await Team.findAll({
            limit: 3,
            order: [['createdAt', 'DESC']]
        });
        console.log('\nSample teams:');
        sampleTeams.forEach(team => {
            console.log(`- ${team.full_team_name} (${team.team_abbreviation}) from ${team.region}`);
        });

        // Check players count
        const playerCount = await Player.count();
        console.log(`\nTotal players in database: ${playerCount}`);
        
        // Get sample players
        const samplePlayers = await Player.findAll({
            limit: 3,
            order: [['createdAt', 'DESC']]
        });
        console.log('\nSample players:');
        samplePlayers.forEach(player => {
            console.log(`- ${player.name} (${player.team_name}) - ${player.is_free_agent ? 'Free Agent' : 'Signed'}`);
        });

        // Get free agent count
        const freeAgentCount = await Player.count({
            where: {
                is_free_agent: true
            }
        });
        console.log(`\nTotal free agents: ${freeAgentCount}`);

    } catch (error) {
        console.error('Error verifying data:', error);
        process.exit(1);
    }
}

verifyData(); 