'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useLeagueLeaders } from '@/hooks/usePlayerData';
import { PlayerRole, Region } from '@/types/player';

export const LeagueLeaders = () => {
  const [selectedRole, setSelectedRole] = useState<PlayerRole>(PlayerRole.Duelist);
  const [selectedRegion, setSelectedRegion] = useState<Region | 'all'>('all');
  
  const { data: leaders, isLoading } = useLeagueLeaders(selectedRole);

  const filteredLeaders = selectedRegion === 'all' 
    ? leaders 
    : leaders?.filter(player => player.region === selectedRegion);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">League Leaders</h2>
        <div className="flex gap-2">
          <select
            className="bg-white/5 rounded px-3 py-2"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as Region | 'all')}
          >
            <option value="all">All Regions</option>
            {Object.values(Region).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select
            className="bg-white/5 rounded px-3 py-2"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as PlayerRole)}
          >
            {Object.values(PlayerRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <div className="w-full h-full" />
            </Card>
          ))
        ) : filteredLeaders?.slice(0, 3).map((player, index) => (
          <Card key={player.id} className="relative overflow-hidden">
            {/* Position Badge */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 
              flex items-center justify-center text-sm font-bold">
              #{index + 1}
            </div>

            <div className="p-4">
              {/* Player Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div>
                  <h3 className="font-bold">{player.name}</h3>
                  <p className="text-sm text-gray-400">{player.team || 'Free Agent'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold">{player.stats.rps.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">RPS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{player.stats.kda.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">KDA</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(player.stats.acs)}</div>
                  <div className="text-xs text-gray-400">ACS</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}; 