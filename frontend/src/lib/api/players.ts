import { apiClient } from './config';
import type { Player, Region, PlayerRole } from '@/types/player';

interface GetPlayersParams {
  region?: Region;
  role?: PlayerRole;
  isFreeAgent?: boolean;
  isRookie?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

interface GetPlayersResponse {
  data: Player[];
  total: number;
  limit: number;
  offset: number;
}

export const playerApi = {
  // Get players with filtering and pagination
  getPlayers: async (params: GetPlayersParams = {}): Promise<GetPlayersResponse> => {
    const { data } = await apiClient.get('/api/players', { params });
    return data;
  },

  // Get featured player
  getFeaturedPlayer: async (): Promise<Player> => {
    const { data } = await apiClient.get('/api/players/featured');
    return data;
  },

  // Get player details by ID
  getPlayerById: async (id: string): Promise<Player> => {
    const { data } = await apiClient.get(`/api/players/${id}`);
    return data;
  },

  // Get league leaders by role
  getLeagueLeaders: async (role: PlayerRole): Promise<Player[]> => {
    const { data } = await apiClient.get('/api/players/leaders', {
      params: { role }
    });
    return data;
  },

  // Get player stories (unique achievements, trends, etc.)
  getPlayerStories: async (): Promise<{
    playerId: string;
    title: string;
    description: string;
    type: 'achievement' | 'trend' | 'comparison';
  }[]> => {
    const { data } = await apiClient.get('/api/players/stories');
    return data;
  }
}; 