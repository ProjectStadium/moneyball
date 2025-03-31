import { useQuery, useQueryClient } from '@tanstack/react-query';
import { playerApi } from '@/lib/api/players';
import type { GetPlayersParams } from '@/lib/api/players';
import type { Player, PlayerRole } from '@/types/player';

// Query keys
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (filters: GetPlayersParams) => [...playerKeys.lists(), filters] as const,
  featured: () => [...playerKeys.all, 'featured'] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: string) => [...playerKeys.details(), id] as const,
  leaders: () => [...playerKeys.all, 'leaders'] as const,
  leadersByRole: (role: PlayerRole) => [...playerKeys.leaders(), role] as const,
  stories: () => [...playerKeys.all, 'stories'] as const,
};

// Hooks
export function usePlayers(params: GetPlayersParams = {}) {
  return useQuery({
    queryKey: playerKeys.list(params),
    queryFn: () => playerApi.getPlayers(params),
  });
}

export function useFeaturedPlayer() {
  return useQuery({
    queryKey: playerKeys.featured(),
    queryFn: playerApi.getFeaturedPlayer,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => playerApi.getPlayerById(id),
    enabled: !!id,
  });
}

export function useLeagueLeaders(role: PlayerRole) {
  return useQuery({
    queryKey: playerKeys.leadersByRole(role),
    queryFn: () => playerApi.getLeagueLeaders(role),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlayerStories() {
  return useQuery({
    queryKey: playerKeys.stories(),
    queryFn: playerApi.getPlayerStories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 