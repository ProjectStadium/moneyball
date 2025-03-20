// __tests__/helpers/test-data.js
// Sample data for tests

const sampleTeams = [
    {
      id: '7c0c2a4a-bce4-4e29-8b9a-5271c938921a',
      team_abbreviation: 'TST',
      full_team_name: 'Test Team',
      tag: 'TST',
      region: 'NA',
      country: 'United States',
      country_code: 'us',
      rank: 100,
      score: 500,
      record: '10-5',
      earnings: 10000.00,
      founded_year: 2021,
      game: 'valorant',
      logo_url: 'https://example.com/logo.png'
    },
    {
      id: '8bac3b5b-cdf5-5f3a-9c0b-6382d049832b',
      team_abbreviation: 'TST2',
      full_team_name: 'Test Team 2',
      tag: 'TS2',
      region: 'EU',
      country: 'Germany',
      country_code: 'de',
      rank: 200,
      score: 400,
      record: '8-7',
      earnings: 8000.00,
      founded_year: 2020,
      game: 'valorant',
      logo_url: 'https://example.com/logo2.png'
    }
  ];
  
  const samplePlayers = [
    {
      id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      name: 'TestPlayer1',
      full_identifier: 'TestPlayer1#123',
      team_abbreviation: 'TST',
      is_free_agent: false,
      country_code: 'us',
      acs: 250.5,
      kd_ratio: 1.35,
      adr: 160.2,
      kpr: 0.85,
      apr: 0.65,
      fk_pr: 0.18,
      fd_pr: 0.12,
      hs_pct: 28.5,
      rating: 1.25,
      division: 'T1',
      estimated_value: 5000,
      playstyle: JSON.stringify({
        primary_roles: ['Duelist (65%)'],
        traits: ['Entry Fragger'],
        role_percentages: {
          'Duelist': 65,
          'Initiator': 20,
          'Controller': 10,
          'Sentinel': 5
        }
      }),
      agent_usage: JSON.stringify({
        'Jett': {
          playTime: '12h 34m',
          playCount: 45,
          winRate: '60%',
          acs: 265,
          kd: 1.4,
          adr: 165
        }
      })
    },
    {
      id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
      name: 'TestPlayer2',
      full_identifier: 'TestPlayer2#456',
      team_abbreviation: 'TST2',
      is_free_agent: false,
      country_code: 'de',
      acs: 220.5,
      kd_ratio: 1.15,
      adr: 140.8,
      kpr: 0.75,
      apr: 0.85,
      fk_pr: 0.15,
      fd_pr: 0.14,
      hs_pct: 24.5,
      rating: 1.1,
      division: 'T2',
      estimated_value: 3500,
      playstyle: JSON.stringify({
        primary_roles: ['Controller (55%)'],
        traits: ['Potential IGL'],
        role_percentages: {
          'Duelist': 15,
          'Initiator': 20,
          'Controller': 55,
          'Sentinel': 10
        }
      }),
      agent_usage: JSON.stringify({
        'Omen': {
          playTime: '10h 20m',
          playCount: 38,
          winRate: '55%',
          acs: 225,
          kd: 1.2,
          adr: 145
        }
      })
    },
    {
      id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
      name: 'FreeAgent1',
      full_identifier: 'FreeAgent1#789',
      is_free_agent: true,
      country_code: 'ca',
      acs: 235.0,
      kd_ratio: 1.25,
      adr: 150.5,
      kpr: 0.80,
      apr: 0.70,
      fk_pr: 0.17,
      fd_pr: 0.13,
      hs_pct: 26.5,
      rating: 1.18,
      division: 'T2',
      estimated_value: 4000,
      playstyle: JSON.stringify({
        primary_roles: ['Initiator (50%)', 'Duelist (30%)'],
        traits: ['Support-oriented'],
        role_percentages: {
          'Duelist': 30,
          'Initiator': 50,
          'Controller': 15,
          'Sentinel': 5
        }
      }),
      agent_usage: JSON.stringify({
        'Sova': {
          playTime: '8h 45m',
          playCount: 32,
          winRate: '58%',
          acs: 240,
          kd: 1.3,
          adr: 155
        }
      })
    }
  ];
  
  module.exports = {
    sampleTeams,
    samplePlayers
  };