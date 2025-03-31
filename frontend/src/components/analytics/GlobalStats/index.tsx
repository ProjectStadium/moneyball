'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { usePlayers } from '@/hooks/usePlayerData';
import { formatNumber, calculatePercentage } from '@/lib/utils';
import { Region } from '@/types/player';

export const GlobalStats = () => {
  const { data, isLoading } = usePlayers();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-white/5">
            <div className="w-full h-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { total, data: players } = data;
  
  // Calculate counts
  const freeAgentCount = players.filter(p => p.is_free_agent).length;
  const rookieCount = players.filter(p => p.is_rookie).length;
  
  // Calculate region counts
  const regionCounts = players.reduce((acc, player) => {
    const region = player.country_code;
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find region with most free agents
  const topRegion = Object.entries(regionCounts).reduce((a, b) => 
    a[1] > b[1] ? a : b)[0] as Region;

  const stats = [
    {
      label: 'Free Agents',
      value: freeAgentCount,
      subtext: `out of ${formatNumber(total)} players`,
    },
    {
      label: 'Rookie Rate',
      value: calculatePercentage(rookieCount, total),
      subtext: 'are Rookies (first events)',
    },
    {
      label: 'Top Region',
      value: topRegion,
      subtext: 'region w/ most free agents',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map(({ label, value, subtext }) => (
        <Card key={label} className="p-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 uppercase tracking-wider">
              {label}
            </span>
            <span className="text-4xl font-display font-bold mt-2">
              {value}
            </span>
            <span className="text-sm text-gray-400 mt-1">
              {subtext}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}; 