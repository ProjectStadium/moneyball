import React from 'react';
import { PlayerCard } from '@/components/ui/PlayerCard';

type Player = {
  id: string;
  name: string;
  team?: string;
  region?: string;
  imageUrl?: string;
  role?: string;
  stats: {
    kda: number;
    acs: number;
    kd: number;
    dpr: number;
    rps: number;
    impact: number;
  };
  recentPerformance: {
    lastNMatches: number;
    averageStats: {
      kda: number;
      acs: number;
      kd: number;
      dpr: number;
      rps: number;
      impact: number;
    };
    trend: 'up' | 'down' | 'stable';
  };
  estimatedValue?: number;
  isFreeAgent?: boolean;
};

type Filters = {
  region: string[];
  role: string[];
  freeAgentOnly: boolean;
  minRating: number | undefined;
  maxRating: number | undefined;
};

interface PlayerGridProps {
  players: Player[];
  filters: Filters;
}

export const PlayerGrid = ({ players, filters }: PlayerGridProps) => {
  // Apply filters
  const filteredPlayers = players.filter(player => {
    if (filters.freeAgentOnly && !player.isFreeAgent) return false;
    if (filters.region.length && !filters.region.includes(player.region || '')) return false;
    if (filters.role.length && !filters.role.includes(player.role || '')) return false;
    if (filters.minRating !== undefined && (player.stats.rps < filters.minRating)) return false;
    if (filters.maxRating !== undefined && (player.stats.rps > filters.maxRating)) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredPlayers.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
      {filteredPlayers.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-400">
          No players found matching the selected filters.
        </div>
      )}
    </div>
  );
}; 