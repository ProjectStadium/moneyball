import { Player } from '../components/PlayerProfile';
import { playerApi } from './api';

interface RawPlayerData {
  player_name: string;
  player_url: string;
  player_flag: string;
  player_flag_title: string;
  country_code: string;
  team_name: string;
  team_abbr: string;
  rounds_played: number;
  rating: number;
  acs: number;
  kd_ratio: number;
  kast: number;
  adr: number;
  kpr: number;
  apr: number;
  fk_pr: number;
  fd_pr: number;
  hs_pct: number;
  clutch_won: number;
  clutch_total: number;
  agents: string[];
  additional_agents: number;
  country_name: string;
  region: string;
  is_free_agent: boolean;
}

export const transformRawPlayerData = (rawData: RawPlayerData): Partial<Player> => {
  return {
    name: rawData.player_name,
    team_name: rawData.team_name || '',
    team_abbreviation: rawData.team_abbr || '',
    country_name: rawData.country_name,
    country_code: rawData.country_code,
    rating: rawData.rating,
    acs: rawData.acs,
    kd_ratio: rawData.kd_ratio,
    adr: rawData.adr,
    kpr: rawData.kpr,
    apr: rawData.apr,
    fk_pr: rawData.fk_pr,
    fd_pr: rawData.fd_pr,
    hs_pct: rawData.hs_pct,
    rounds_played: rawData.rounds_played,
    clutches_won: rawData.clutch_won,
    clutches_played: rawData.clutch_total,
    is_free_agent: rawData.is_free_agent,
    division: rawData.region || 'Unknown',
    agent_usage: rawData.agents.reduce((acc, agent) => {
      acc[agent] = 1; // Default to 1 for now, we can calculate actual usage later
      return acc;
    }, {} as Record<string, number>),
    roles: rawData.agents, // Using agents as roles for now
    primary_role: rawData.agents[0] || 'Unknown'
  };
};

export const importPlayerData = async (): Promise<void> => {
  try {
    // Fetch raw data from the backend
    const response = await fetch('/api/data-import/raw-data');
    const rawData: RawPlayerData[] = await response.json();

    // Transform and import each player
    for (const player of rawData) {
      const transformedData = transformRawPlayerData(player);
      await playerApi.createPlayer(transformedData);
    }
  } catch (error) {
    console.error('Error importing player data:', error);
    throw error;
  }
};

export const updatePlayerData = async (): Promise<void> => {
  try {
    // Fetch latest raw data
    const response = await fetch('/api/data-import/raw-data');
    const rawData: RawPlayerData[] = await response.json();

    // Update each player's data
    for (const player of rawData) {
      const transformedData = transformRawPlayerData(player);
      // First try to find the player by name
      const existingPlayers = await playerApi.getPlayers({ name: player.player_name });
      if (existingPlayers.data && existingPlayers.data.length > 0) {
        const existingPlayer = existingPlayers.data[0];
        await playerApi.updatePlayer(existingPlayer.id, transformedData);
      } else {
        // If player doesn't exist, create them
        await playerApi.createPlayer(transformedData);
      }
    }
  } catch (error) {
    console.error('Error updating player data:', error);
    throw error;
  }
}; 