const db = require('../models');
const RolePerformanceService = require('../services/rolePerformance.service');
const VLRScraper = require('../services/vlrScraper.service');
const LiquipediaService = require('../services/liquipedia.service');
const fs = require('fs');
const path = require('path');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function analyzePlayerPerformance(player, rolePerformanceService) {
    try {
        console.log('\n========================================');
        console.log(`Player: ${player.player_name}`);
        console.log(`Role: ${player.role || 'Unknown'}`);
        console.log(`Team: ${player.team_name || 'Free Agent'}`);
        console.log('----------------------------------------');

        // Calculate RPS with skipRiotApi option
        const rpsResult = await rolePerformanceService.calculateRPS(player, null, { skipRiotApi: true });

        console.log('RPS Calculation Results:');
        console.log(`- Final RPS Score: ${rpsResult.finalScore.toFixed(2)}`);
        console.log(`- Original Score: ${rpsResult.originalScore.toFixed(2)}`);
        console.log(`- SDIFF: ${rpsResult.sdiff.toFixed(2)}`);

        console.log('\nBase Stats:');
        Object.entries(rpsResult.baseStats).forEach(([key, value]) => {
            if (typeof value === 'object') {
                console.log(`- ${key}:`, value);
            } else {
                console.log(`- ${key}: ${Number(value).toFixed(2)}`);
            }
        });

        console.log('\nNormalized Metrics:');
        Object.entries(rpsResult.normalizedMetrics).forEach(([key, value]) => {
            console.log(`- ${key}: ${value.toFixed(2)}`);
        });

        console.log('\nRole-Specific Adjustments:');
        console.log(`- Applied: ${rpsResult.roleAdjustments.applied}`);
        if (rpsResult.roleAdjustments.applied) {
            console.log(`- Adjustment Amount: ${rpsResult.roleAdjustments.amount.toFixed(2)}`);
        }

        return rpsResult;
    } catch (error) {
        console.error(`Error analyzing player ${player.player_name}:`, error);
        return null;
    }
}

async function generateRoleComparison(players, results) {
    const roleGroups = {};
    results.forEach((result, index) => {
        const player = players[index];
        if (!result || !player.role) return;
        
        if (!roleGroups[player.role]) {
            roleGroups[player.role] = {
                scores: [],
                sdiff: []
            };
        }
        
        roleGroups[player.role].scores.push(result.finalScore);
        roleGroups[player.role].sdiff.push(result.sdiff);
    });

    console.log('\n========================================');
    console.log('Role Performance Analysis');
    console.log('========================================');

    Object.entries(roleGroups).forEach(([role, data]) => {
        const scores = data.scores;
        const sdiff = data.sdiff;
        
        console.log(`\n${role} Analysis (${scores.length} players):`);
        console.log('Scores:');
        console.log(`- Average: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)}`);
        console.log(`- Median:  ${scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)].toFixed(2)}`);
        console.log(`- Range:   ${Math.min(...scores).toFixed(2)} - ${Math.max(...scores).toFixed(2)}`);
        
        console.log('SDIFF:');
        console.log(`- Average: ${(sdiff.reduce((a, b) => a + b, 0) / sdiff.length).toFixed(2)}`);
        console.log(`- Median:  ${sdiff.sort((a, b) => a - b)[Math.floor(sdiff.length / 2)].toFixed(2)}`);
        console.log(`- Range:   ${Math.min(...sdiff).toFixed(2)} - ${Math.max(...sdiff).toFixed(2)}`);
    });
}

async function runLiveTest() {
    try {
        console.log('Starting RPS Live Test...');
        
        // Initialize services
        const vlrScraper = new VLRScraper(db);
        const liquipediaService = new LiquipediaService();
        const rolePerformanceService = new RolePerformanceService();

        // Get real players from VLR
        console.log('Fetching players from VLR...');
        const vlrPlayers = await vlrScraper.scrapePlayerList(1); // Get first page of players
        
        // Take first 10 players for testing
        const testPlayers = vlrPlayers.slice(0, 10);
        console.log(`Testing with ${testPlayers.length} players`);

        // Special agent name mappings
        const agentNameMap = {
            'tejo': 'kayo',
            'vyse': 'skye'
        };

        // Map agent to role (case-insensitive)
        const agentToRole = {
            'jett': 'Duelist',
            'phoenix': 'Duelist',
            'raze': 'Duelist',
            'reyna': 'Duelist',
            'yoru': 'Duelist',
            'neon': 'Duelist',
            'iso': 'Duelist',
            'waylay': 'Duelist',
            'brimstone': 'Controller',
            'viper': 'Controller',
            'omen': 'Controller',
            'astra': 'Controller',
            'harbor': 'Controller',
            'sova': 'Initiator',
            'breach': 'Initiator',
            'kayo': 'Initiator',
            'fade': 'Initiator',
            'gekko': 'Initiator',
            'skye': 'Initiator',
            'cypher': 'Sentinel',
            'sage': 'Sentinel',
            'killjoy': 'Sentinel',
            'chamber': 'Sentinel',
            'deadlock': 'Sentinel'
        };

        // Process players and assign roles based on agent usage
        const playersWithRoles = testPlayers.map(player => {
            // Get the first agent from the list (most played)
            let primaryAgent = player.agents[0]?.toLowerCase();
            
            // Map special agent names
            primaryAgent = agentNameMap[primaryAgent] || primaryAgent;

            if (primaryAgent && agentToRole[primaryAgent]) {
                player.role = agentToRole[primaryAgent];
                console.log(`Found role for ${player.player_name}: ${player.role} (${primaryAgent})`);
                
                // Map VLR stats to RPS stats
                player.stats = {
                    kd_ratio: player.kd_ratio || 1.0,
                    acs: player.acs || 200,
                    kda: (player.kpr + player.apr) / (player.fd_pr || 1),
                    deaths_per_map: player.fd_pr * 13, // Approximate deaths per map
                    first_bloods: player.fk_pr * 13, // Approximate first bloods per map
                    utility_usage: player.kast // Use KAST as a proxy for utility usage
                };
            } else {
                console.log(`No role found for ${player.player_name} (agents: ${player.agents.join(', ')})`);
            }
            return player;
        }).filter(player => player.role);

        console.log(`\nFound ${playersWithRoles.length} players with defined roles`);

        // Analyze each player
        const results = [];
        for (const player of playersWithRoles) {
            const result = await analyzePlayerPerformance(player, rolePerformanceService);
            if (result) results.push(result);
        }

        // Generate role comparison
        await generateRoleComparison(playersWithRoles, results);

        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(__dirname, '../../data', `rps_analysis_${timestamp}.json`);
        
        const analysisResults = {
            timestamp: new Date().toISOString(),
            players: playersWithRoles.map((player, index) => ({
                name: player.player_name,
                role: player.role,
                team: player.team_name,
                agents: player.agents,
                ...results[index]
            })),
            roleStats: Object.entries(
                results.reduce((acc, result, index) => {
                    const role = playersWithRoles[index].role;
                    if (!acc[role]) acc[role] = { scores: [], sdiff: [] };
                    acc[role].scores.push(result.finalScore);
                    acc[role].sdiff.push(result.sdiff);
                    return acc;
                }, {})
            ).map(([role, data]) => ({
                role,
                averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                medianScore: data.scores.sort((a, b) => a - b)[Math.floor(data.scores.length / 2)],
                scoreRange: {
                    min: Math.min(...data.scores),
                    max: Math.max(...data.scores)
                },
                averageSdiff: data.sdiff.reduce((a, b) => a + b, 0) / data.sdiff.length,
                medianSdiff: data.sdiff.sort((a, b) => a - b)[Math.floor(data.sdiff.length / 2)],
                sdiffRange: {
                    min: Math.min(...data.sdiff),
                    max: Math.max(...data.sdiff)
                }
            }))
        };

        fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2));
        console.log(`\nAnalysis complete. Results saved to ${outputPath}`);

    } catch (error) {
        console.error('Error in RPS Live Test:', error);
    }
}

// Run the test
runLiveTest(); 