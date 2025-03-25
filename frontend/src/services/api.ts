import axios from 'axios';
import { SalaryCalculator } from './salaryCalculator';
import { API_BASE_URL } from '../config';

interface DatabaseStats {
  players: {
    total: number;
    free_agents: number;
    divisions: Record<string, number>;
  };
  teams: {
    total: number;
  };
  last_updated: string;
}

interface Player {
  id: string;
  name: string;
  player_img_url?: string;
  team_name?: string;
  team_abbreviation?: string;
  country_name?: string;
  country_code?: string;
  // Performance stats
  rating?: number;
  acs?: number;
  kd_ratio?: number;
  adr?: number;
  kpr?: number;
  apr?: number;
  fk_pr?: number;
  fd_pr?: number;
  hs_pct?: number;
  // Agent and role information
  agent_usage?: Record<string, number>;
  roles?: string[];
  primary_role?: string;
  role_distribution?: Record<string, number>;
  // Game stats
  rounds_played?: number;
  clutches_won?: number;
  clutches_played?: number;
  // Status and value
  is_free_agent?: boolean;
  division?: string;
  estimated_value?: number;
  compatibility_score?: number;
  // Tournament and earnings
  total_earnings?: number;
  earnings_by_year?: Record<string, number>;
  tournament_history?: {
    name: string;
    date: string;
    placement: string;
    earnings: number;
  }[];
  last_updated?: string;
}

interface Team {
  id: string;
  team_abbreviation: string;
  full_team_name: string;
  tag?: string;
  region: string;
  country?: string;
  country_code?: string;
  rank?: number;
  score?: number;
  record?: string;
  earnings?: number;
  founded_year?: number;
  game?: string;
  logo_url?: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
  prize_pool: number;
}

interface ApiResponse<T> {
  data: T;
  total: number;
}

interface GetTopPlayersParams {
  limit: number;
  region?: string;
  country_code?: string;
  division?: string;
  is_free_agent?: boolean;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Player endpoints
export const playerApi = {
  getAll: async (params?: any): Promise<ApiResponse<Player[]>> => {
    try {
      const response = await api.get('/players', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },
  getById: (id: string) => api.get(`/players/${id}`),
  getTopPlayers: async (params: GetTopPlayersParams): Promise<Player[]> => {
    const response = await api.get('/players/top', { params });
    return response.data;
  },
  getPlayers: async (params?: any) => {
    const response = await api.get('/players', { params });
    return response.data;
  },
  create: (data: any) => api.post('/players', data),
  update: (id: string, data: any) => api.put(`/players/${id}`, data),
  delete: (id: string) => api.delete(`/players/${id}`),
  getStats: (id: string) => api.get(`/players/${id}/stats`),
  getPlayerProfile: async (id: string): Promise<Player> => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },
  createPlayer: async (data: any) => {
    const response = await api.post('/players', data);
    return response.data;
  },
  updatePlayer: async (id: string, data: any) => {
    const response = await api.put(`/players/${id}`, data);
    return response.data;
  },
  deletePlayer: async (id: string) => {
    const response = await api.delete(`/players/${id}`);
    return response.data;
  },
};

// Team endpoints
export const teamApi = {
  getAll: (params?: any) => api.get('/teams', { params }),
  getOne: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  getStats: (id: string) => api.get(`/teams/${id}/stats`),
  getTopTeams: async (params: { limit: number }): Promise<Team[]> => {
    const response = await api.get('/teams/top', { params });
    return response.data;
  },
  getTeams: async (params?: any) => {
    const response = await api.get('/teams', { params });
    return response.data;
  },
  getTeamProfile: async (id: string) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  createTeam: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  updateTeam: async (id: string, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },
  deleteTeam: async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
};

// Tournament endpoints
export const tournamentApi = {
  getAll: async (params: { limit: number }): Promise<Tournament[]> => {
    const response = await api.get('/tournaments', { params });
    return response.data.data || [];
  },
  getOne: (id: string) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post('/tournaments', data),
  update: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  getStandings: (id: string) => api.get(`/tournaments/${id}/standings`),
  getStats: (id: string) => api.get(`/tournaments/${id}/stats`),
  getTournaments: async (params?: any) => {
    const response = await api.get('/tournaments', { params });
    return response.data;
  },
  getTournamentDetails: async (id: string) => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },
  createTournament: async (data: any) => {
    const response = await api.post('/tournaments', data);
    return response.data;
  },
  updateTournament: async (id: string, data: any) => {
    const response = await api.put(`/tournaments/${id}`, data);
    return response.data;
  },
  deleteTournament: async (id: string) => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },
};

// Analysis endpoints
export const analysisApi = {
  getFreeAgentMarket: async (params?: any) => {
    const response = await api.get('/analysis/market/free-agents', { params });
    return response.data;
  },
  generateOptimalRoster: (params?: any) => api.post('/analysis/optimal-roster', params),
  comparePlayers: async (params: { player_ids: string[] }) => {
    const response = await api.post('/analysis/compare', params);
    return response.data;
  },
  getPlayerValuation: (id: string) => api.get(`/analysis/player-value/${id}`),
  getStats: (params?: any) => api.get('/analysis/stats', { params }),
  getTrends: (params?: any) => api.get('/analysis/trends', { params }),
  getDistribution: (params?: any) => api.get('/analysis/distribution', { params }),
  generateRosterAnalysis: async (params: { player_ids: string[] }) => {
    const response = await api.post('/analysis/roster', params);
    return response.data;
  },
  getMarketAnalysis: async (params?: any) => {
    const response = await api.get('/analysis/market', { params });
    return response.data;
  },
};

// Admin endpoints
export const adminApi = {
  getScraperStatus: () => api.get('/admin/scraper/status'),
  getDatabaseStats: async (): Promise<DatabaseStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  updateSystemSettings: async (data: any) => {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },
};

export default api;