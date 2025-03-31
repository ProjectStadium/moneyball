const RolePerformanceService = require('../services/rolePerformance.service');

// Mock match data for testing
const mockMatches = {
  'test-puuid-duelist': [
    {
      info: {
        tournamentName: 'VCT 2024 Playoffs',
        players: [
          {
            puuid: 'test-puuid-duelist',
            teamId: 'team1',
            stats: {
              kills: 25,
              deaths: 15,
              assists: 8,
              score: 320,
              firstBloods: 3,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 18,
              deaths: 12,
              assists: 10,
              score: 280,
              firstBloods: 2,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 20,
              deaths: 14,
              assists: 6,
              score: 290,
              firstBloods: 2,
              firstDeaths: 3
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    },
    {
      info: {
        tournamentName: 'VCT 2024 Finals',
        players: [
          {
            puuid: 'test-puuid-duelist',
            teamId: 'team1',
            stats: {
              kills: 28,
              deaths: 12,
              assists: 10,
              score: 350,
              firstBloods: 4,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 22,
              deaths: 14,
              assists: 12,
              score: 310,
              firstBloods: 2,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 24,
              deaths: 16,
              assists: 8,
              score: 300,
              firstBloods: 3,
              firstDeaths: 4
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    }
  ],
  'test-puuid-controller': [
    {
      info: {
        tournamentName: 'VCT 2024 Playoffs',
        players: [
          {
            puuid: 'test-puuid-controller',
            teamId: 'team1',
            stats: {
              kills: 20,
              deaths: 10,
              assists: 15,
              score: 280,
              firstBloods: 1,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 18,
              deaths: 12,
              assists: 10,
              score: 270,
              firstBloods: 2,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 22,
              deaths: 14,
              assists: 8,
              score: 290,
              firstBloods: 2,
              firstDeaths: 3
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    },
    {
      info: {
        tournamentName: 'VCT 2024 Finals',
        players: [
          {
            puuid: 'test-puuid-controller',
            teamId: 'team1',
            stats: {
              kills: 22,
              deaths: 8,
              assists: 18,
              score: 300,
              firstBloods: 2,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 20,
              deaths: 14,
              assists: 12,
              score: 290,
              firstBloods: 2,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 24,
              deaths: 16,
              assists: 8,
              score: 310,
              firstBloods: 3,
              firstDeaths: 4
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    }
  ],
  'test-puuid-initiator': [
    {
      info: {
        tournamentName: 'VCT 2024 Playoffs',
        players: [
          {
            puuid: 'test-puuid-initiator',
            teamId: 'team1',
            stats: {
              kills: 22,
              deaths: 12,
              assists: 16,
              score: 290,
              firstBloods: 2,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 18,
              deaths: 12,
              assists: 10,
              score: 270,
              firstBloods: 2,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 20,
              deaths: 14,
              assists: 8,
              score: 280,
              firstBloods: 2,
              firstDeaths: 3
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    },
    {
      info: {
        tournamentName: 'VCT 2024 Finals',
        players: [
          {
            puuid: 'test-puuid-initiator',
            teamId: 'team1',
            stats: {
              kills: 24,
              deaths: 10,
              assists: 20,
              score: 310,
              firstBloods: 3,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 20,
              deaths: 14,
              assists: 12,
              score: 290,
              firstBloods: 2,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 22,
              deaths: 16,
              assists: 8,
              score: 300,
              firstBloods: 3,
              firstDeaths: 4
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    }
  ],
  'test-puuid-sentinel': [
    {
      info: {
        tournamentName: 'VCT 2024 Playoffs',
        players: [
          {
            puuid: 'test-puuid-sentinel',
            teamId: 'team1',
            stats: {
              kills: 18,
              deaths: 8,
              assists: 12,
              score: 260,
              firstBloods: 1,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 20,
              deaths: 12,
              assists: 10,
              score: 280,
              firstBloods: 2,
              firstDeaths: 1
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 22,
              deaths: 14,
              assists: 8,
              score: 290,
              firstBloods: 2,
              firstDeaths: 3
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    },
    {
      info: {
        tournamentName: 'VCT 2024 Finals',
        players: [
          {
            puuid: 'test-puuid-sentinel',
            teamId: 'team1',
            stats: {
              kills: 20,
              deaths: 6,
              assists: 14,
              score: 280,
              firstBloods: 2,
              firstDeaths: 0
            }
          },
          {
            puuid: 'player2',
            teamId: 'team1',
            stats: {
              kills: 22,
              deaths: 14,
              assists: 12,
              score: 300,
              firstBloods: 2,
              firstDeaths: 2
            }
          },
          {
            puuid: 'player3',
            teamId: 'team2',
            stats: {
              kills: 24,
              deaths: 16,
              assists: 8,
              score: 310,
              firstBloods: 3,
              firstDeaths: 4
            }
          }
        ],
        teams: [
          { teamId: 'team1' },
          { teamId: 'team2' }
        ]
      }
    }
  ]
};

// Role-specific utility data
const roleUtilityData = {
  Duelist: {
    healthSteal: 4,
    grenades: 6,
    mobility: 3,
    postPlantKills: 5,
    entryKills: 8
  },
  Controller: {
    smokes: 8,
    grenades: 4,
    postPlantKills: 3,
    smokeKills: 2,
    siteControl: 6
  },
  Initiator: {
    flashes: 6,
    stuns: 4,
    recon: 5,
    flashAssists: 8,
    infoGathering: 7
  },
  Sentinel: {
    walls: 4,
    traps: 3,
    clutches: 2,
    siteControl: 5,
    infoGathering: 4
  }
};

// Mock RiotService for testing
class MockRiotService {
  async getTournamentMatches(puuid, tournamentName, limit) {
    return mockMatches[puuid] || [];
  }

  extractUtilityData(match, puuid, role) {
    return roleUtilityData[role] || {};
  }
}

async function testRPSCalculations() {
  const rolePerformanceService = new RolePerformanceService();
  
  // Replace RiotService with mock
  rolePerformanceService.riotService = new MockRiotService();

  // Test players for each role
  const testPlayers = [
    {
      puuid: 'test-puuid-duelist',
      role: 'Duelist',
      name: 'TestDuelist',
      team: 'TestTeam'
    },
    {
      puuid: 'test-puuid-controller',
      role: 'Controller',
      name: 'TestController',
      team: 'TestTeam'
    },
    {
      puuid: 'test-puuid-initiator',
      role: 'Initiator',
      name: 'TestInitiator',
      team: 'TestTeam'
    },
    {
      puuid: 'test-puuid-sentinel',
      role: 'Sentinel',
      name: 'TestSentinel',
      team: 'TestTeam'
    }
  ];

  for (const player of testPlayers) {
    try {
      console.log('\n========================================');
      console.log('Testing RPS calculations for:', player.name);
      console.log('Role:', player.role);
      console.log('Team:', player.team);
      console.log('----------------------------------------');

      const rps = await rolePerformanceService.calculateRPS(player, "VCT 2024");

      console.log('RPS Calculation Results:');
      console.log(`- Final RPS Score: ${rps.score.toFixed(2)}`);
      console.log(`- Original Score: ${rps.details.adjustments.originalScore.toFixed(2)}`);
      console.log(`- SDIFF: ${rps.details.adjustments.sdiff.toFixed(2)}`);
      
      console.log('\nBase Stats:');
      Object.entries(rps.details.baseStats).forEach(([metric, value]) => {
        if (typeof value === 'number') {
          console.log(`- ${metric}: ${value.toFixed(2)}`);
        }
      });

      console.log('\nNormalized Metrics:');
      Object.entries(rps.details.normalizedMetrics).forEach(([metric, value]) => {
        console.log(`- ${metric}: ${value.toFixed(2)}`);
      });

      console.log('\nRole-Specific Utility Data:');
      const utilityData = roleUtilityData[player.role];
      Object.entries(utilityData).forEach(([metric, value]) => {
        console.log(`- ${metric}: ${value}`);
      });

      console.log('\nTournament Context:');
      console.log(`- Matches Analyzed: ${rps.details.tournamentContext.matchesAnalyzed}`);
      console.log('- Stages:', rps.details.tournamentContext.stages.join(', '));

      console.log('\nRole-Specific Adjustments:');
      console.log(`- Applied: ${rps.details.adjustments.applied}`);
      if (rps.details.adjustments.applied) {
        console.log(`- Adjustment Amount: ${(rps.score - rps.details.adjustments.originalScore).toFixed(2)}`);
      }

      console.log('\nApplied Weights:');
      Object.entries(rps.details.weights).forEach(([metric, weight]) => {
        console.log(`- ${metric}: ${weight}`);
      });

    } catch (error) {
      console.error(`Error testing ${player.role}:`, error);
    }
  }
}

// Run the tests
testRPSCalculations(); 