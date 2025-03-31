export interface Player {
  id: string;
  name: string;
  team?: string;
  region: Region;
  role: PlayerRole;
  experience: PlayerExperience;
  stats: PlayerStats;
  recentPerformance: RecentPerformance;
  liquipediaUrl?: string;
  imageUrl?: string;
}

export interface PlayerExperience {
  yearsActive: number;
  isRookie: boolean;
  totalEarnings: number;
  notableAchievements?: string[];
}

export interface PlayerStats {
  kda: number;
  acs: number;         // Average Combat Score
  kpr: number;         // Kills per Round
  rps: number;         // Role Performance Score
  sdiff: number;       // Score Differential
  impact: number;      // Impact Rating
  clutchRating?: number;
}

export interface RecentPerformance {
  lastNMatches: number;
  averageStats: PlayerStats;
  trend: PerformanceTrend;
  notableMatches?: {
    date: string;
    opponent: string;
    score: string;
    personalStats: Partial<PlayerStats>;
  }[];
}

export type PerformanceTrend = 'up' | 'down' | 'stable';

export enum PlayerRole {
  Duelist = 'duelist',
  Controller = 'controller',
  Sentinel = 'sentinel',
  Initiator = 'initiator'
}

export enum Region {
  NA = 'North America',
  EMEA = 'Europe',
  APAC = 'Asia Pacific',
  LATAM = 'Latin America'
} 