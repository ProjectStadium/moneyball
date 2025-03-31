const LiquipediaService = require('./backend/src/services/liquipedia.service.js');

async function testLiquipedia() {
    try {
        const service = new LiquipediaService();
        const stats = await service.getTournamentStats('VCL/2025/NORTH_EAST/Stage_1');
        console.log('Tournament Statistics:', JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testLiquipedia(); 