import React from 'react';
import { cn } from '@/lib/utils';

type Filters = {
  region: string[];
  role: string[];
  freeAgentOnly: boolean;
  minRating: number | undefined;
  maxRating: number | undefined;
};

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  className?: string;
}

const REGIONS = ['NA', 'EMEA', 'APAC', 'BR', 'LATAM', 'KR', 'JP'];
const ROLES = ['Duelist', 'Controller', 'Initiator', 'Sentinel'];

export const FilterBar = ({ filters, onFilterChange, className }: FilterBarProps) => {
  const handleRegionChange = (region: string) => {
    const newRegions = filters.region.includes(region)
      ? filters.region.filter(r => r !== region)
      : [...filters.region, region];
    onFilterChange({ region: newRegions });
  };

  const handleRoleChange = (role: string) => {
    const newRoles = filters.role.includes(role)
      ? filters.role.filter(r => r !== role)
      : [...filters.role, role];
    onFilterChange({ role: newRoles });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Free Agent Toggle */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.freeAgentOnly}
            onChange={e => onFilterChange({ freeAgentOnly: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
          />
          <span>Free Agents Only</span>
        </label>
      </div>

      {/* Region Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Region</h3>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              className={cn(
                'px-3 py-1 text-sm rounded-full border transition-colors',
                filters.region.includes(region)
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-700 hover:border-gray-600'
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Role Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Role</h3>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={cn(
                'px-3 py-1 text-sm rounded-full border transition-colors',
                filters.role.includes(role)
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-700 hover:border-gray-600'
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Rating Range */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Rating Range</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={filters.minRating || ''}
            onChange={e => onFilterChange({ minRating: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Min"
            className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-700 focus:border-gray-600 focus:outline-none"
          />
          <span>to</span>
          <input
            type="number"
            value={filters.maxRating || ''}
            onChange={e => onFilterChange({ maxRating: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Max"
            className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-700 focus:border-gray-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFilterChange({
          region: [],
          role: [],
          freeAgentOnly: false,
          minRating: undefined,
          maxRating: undefined,
        })}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}; 