'use client';

import React, { useState } from 'react';
import { usePlayers } from '@/hooks/usePlayerData';
import { Card } from '@/components/ui/Card';
import { Region, PlayerRole } from '@/types/player';

interface FilterState {
  region?: Region;
  role?: PlayerRole;
  search?: string;
}

export const PlayerStats = () => {
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePlayers({
    ...filters,
    offset: (page - 1) * 10,
    limit: 10,
  });

  const columns = [
    { key: 'name', label: 'PLAYER' },
    { key: 'role', label: 'ROLE' },
    { key: 'playstyle', label: 'PLAYSTYLE' },
    { key: 'kda', label: 'KDA' },
    { key: 'kd', label: 'K/D' },
    { key: 'acs', label: 'ACS' },
    { key: 'dpr', label: 'D/MAP' },
    { key: 'rps', label: 'ROLE PERFORMANCE' },
    { key: 'sdiff', label: 'SKILL DIFF' },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Player Stats</h2>
          <div className="flex gap-2">
            <select
              className="bg-white/5 rounded px-3 py-2"
              onChange={(e) => setFilters(f => ({ ...f, region: e.target.value as Region }))}
              value={filters.region}
            >
              <option value="">All Regions</option>
              {Object.values(Region).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select
              className="bg-white/5 rounded px-3 py-2"
              onChange={(e) => setFilters(f => ({ ...f, role: e.target.value as PlayerRole }))}
              value={filters.role}
            >
              <option value="">All Roles</option>
              {Object.values(PlayerRole).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/5 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-3 text-center text-red-400">
                  Error loading player data. Please try again later.
                </td>
              </tr>
            ) : !data?.data?.length ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-3 text-center text-gray-400">
                  No players found.
                </td>
              </tr>
            ) : (
              data.data.map((player) => (
                <tr key={player.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">{player.name}</td>
                  <td className="px-4 py-3">{player.role}</td>
                  <td className="px-4 py-3">Aggressive</td>
                  <td className="px-4 py-3">{player.recentPerformance?.averageStats?.kda?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3">{(player.recentPerformance?.averageStats?.kd || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{Math.round(player.recentPerformance?.averageStats?.acs || 0)}</td>
                  <td className="px-4 py-3">{(player.recentPerformance?.averageStats?.dpr || 0).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${(player.recentPerformance?.averageStats?.rps || 0) >= 85 ? 'text-green-400' : 
                      (player.recentPerformance?.averageStats?.rps || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {(player.recentPerformance?.averageStats?.rps || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${(player.recentPerformance?.averageStats?.sdiff || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(player.recentPerformance?.averageStats?.sdiff || 0).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 10 && (
        <div className="p-4 border-t border-white/10 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-white/5 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {Math.ceil(data.total / 10)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(data.total / 10), p + 1))}
            disabled={page >= Math.ceil(data.total / 10)}
            className="px-3 py-1 rounded bg-white/5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}; 