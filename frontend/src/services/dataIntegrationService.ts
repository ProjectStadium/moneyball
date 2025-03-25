import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface EnrichedPlayerData {
    id: string;
    name: string;
    full_identifier: string;
    player_img_url: string;
    team_name: string | null;
    team_abbreviation: string | null;
    team_logo_url: string | null;
    country_name: string | null;
    country_code: string | null;
    is_free_agent: boolean;
    acs: number | null;
    kd_ratio: number | null;
    adr: number | null;
    kpr: number | null;
    apr: number | null;
    fk_pr: number | null;
    fd_pr: number | null;
    hs_pct: number | null;
    rating: number | null;
    agent_usage: Record<string, any>;
    playstyle: Record<string, any>;
    division: string;
    estimated_value: number | null;
    tournament_history: any[];
    total_earnings: number | null;
    earnings_by_year: Record<string, number>;
    tournament_earnings: any[];
    earnings_last_updated: string | null;
    source: string | null;
    current_act: string | null;
    leaderboard_rank: number | null;
    ranked_rating: number | null;
    number_of_wins: number | null;
}

export class DataIntegrationService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    }

    async getFreeAgents(minRating: number = 0, limit: number = 100, offset: number = 0): Promise<EnrichedPlayerData[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/players/free-agents`, {
                params: {
                    min_rating: minRating,
                    limit,
                    offset
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching free agents:', error);
            throw error;
        }
    }

    async enrichPlayerData(playerId: string): Promise<EnrichedPlayerData> {
        try {
            const response = await axios.get(`${this.baseUrl}/players/${playerId}`);
            return response.data;
        } catch (error) {
            console.error('Error enriching player data:', error);
            throw error;
        }
    }
}

export const dataIntegrationService = new DataIntegrationService(); 