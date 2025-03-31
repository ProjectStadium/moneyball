'use client';

import React, { useState } from 'react';
import { GlobalStats } from '@/components/analytics/GlobalStats';
import { PlayerGrid } from '@/components/analytics/PlayerGrid';
import { FilterBar } from '@/components/analytics/FilterBar';

type Filters = {
  region: string[];
  role: string[];
  freeAgentOnly: boolean;
  minRating: number | undefined;
  maxRating: number | undefined;
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>({
    region: [],
    role: [],
    freeAgentOnly: false,
    minRating: undefined,
    maxRating: undefined,
  });

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-display font-bold">
            WINRVTE Analytics
          </h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 transition-colors">
              Build Roster
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              Compare Players
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <section className="mb-12">
          <GlobalStats />
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-12 gap-8">
          {/* Filters */}
          <div className="col-span-3">
            <div className="sticky top-8">
              <h2 className="text-xl font-bold mb-6">Filters</h2>
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                className="bg-gray-900/50 rounded-lg p-6 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Player Grid */}
          <div className="col-span-9">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Players</h2>
              <div className="flex items-center space-x-4">
                <select 
                  className="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 focus:border-gray-600 focus:outline-none"
                  defaultValue="rating"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="value">Sort by Value</option>
                  <option value="acs">Sort by ACS</option>
                  <option value="kda">Sort by KDA</option>
                </select>
              </div>
            </div>
            <PlayerGrid players={[]} filters={filters} />
          </div>
        </section>
      </div>
    </main>
  );
} 