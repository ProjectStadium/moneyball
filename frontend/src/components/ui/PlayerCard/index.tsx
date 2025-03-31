import React from 'react';
import { Card } from '../Card';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: {
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
  className?: string;
}

export const PlayerCard = ({ player, className }: PlayerCardProps) => {
  return (
    <Card 
      variant={player.isFreeAgent ? 'featured' : 'default'} 
      className={cn('w-full max-w-sm', className)}
    >
      <div className="flex items-start space-x-4">
        {/* Player Image */}
        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-700">
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt={player.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-bold">
              {player.name[0]}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{player.name}</h3>
            {player.isFreeAgent && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500">
                Free Agent
              </span>
            )}
          </div>
          
          <div className="mt-1 text-sm text-gray-400">
            {player.team && <span>{player.team} • </span>}
            {player.region && <span>{player.region} • </span>}
            <span>{player.role || 'Unknown Role'}</span>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatBox label="KDA" value={player.stats.kda.toFixed(2)} />
            <StatBox label="ACS" value={player.stats.acs.toFixed(0)} />
            <StatBox label="Impact" value={player.stats.impact.toFixed(1)} />
          </div>

          {/* Recent Performance */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Last {player.recentPerformance.lastNMatches} Matches</h4>
            <div className="flex items-center space-x-2">
              <TrendIndicator trend={player.recentPerformance.trend} />
              <span className="text-sm">
                {player.recentPerformance.averageStats.acs.toFixed(0)} ACS
              </span>
            </div>
          </div>

          {/* Estimated Value */}
          {player.estimatedValue && (
            <div className="mt-4 text-right">
              <span className="text-sm text-gray-400">Estimated Value</span>
              <div className="text-lg font-bold text-green-400">
                ${player.estimatedValue.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center p-2 rounded bg-white/5">
    <div className="text-xs text-gray-400">{label}</div>
    <div className="font-bold">{value}</div>
  </div>
);

const TrendIndicator = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const colors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400'
  };

  const icons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  return (
    <span className={cn('text-sm font-bold', colors[trend])}>
      {icons[trend]}
    </span>
  );
}; 