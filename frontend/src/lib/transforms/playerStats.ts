import type { Player, PlayerStats } from '@/types/player';

// Calculate Role Performance Score (RPS)
export const calculateRPS = (stats: PlayerStats, role: Player['role']): number => {
  const weights = {
    duelist: {
      kda: 0.3,
      acs: 0.3,
      kpr: 0.2,
      impact: 0.2,
    },
    controller: {
      kda: 0.2,
      acs: 0.2,
      kpr: 0.1,
      impact: 0.3,
      clutchRating: 0.2,
    },
    sentinel: {
      kda: 0.25,
      acs: 0.2,
      kpr: 0.15,
      impact: 0.2,
      clutchRating: 0.2,
    },
    initiator: {
      kda: 0.25,
      acs: 0.25,
      kpr: 0.2,
      impact: 0.3,
    },
  };

  const roleWeights = weights[role.toLowerCase() as keyof typeof weights];
  
  let score = 0;
  for (const [stat, weight] of Object.entries(roleWeights)) {
    if (stat in stats) {
      score += (stats[stat as keyof PlayerStats] || 0) * weight;
    }
  }

  return Math.round(score * 100) / 100;
};

// Calculate Score Differential (SDIFF)
export const calculateSDIFF = (playerStats: PlayerStats, avgTeamStats: PlayerStats): number => {
  const metrics = ['kda', 'acs', 'kpr', 'impact'] as const;
  let totalDiff = 0;

  metrics.forEach(metric => {
    const diff = ((playerStats[metric] - avgTeamStats[metric]) / avgTeamStats[metric]) * 100;
    totalDiff += diff;
  });

  return Math.round(totalDiff / metrics.length * 100) / 100;
};

// Analyze performance trend
export const analyzePerformanceTrend = (
  recentMatches: { stats: PlayerStats }[],
  averageStats: PlayerStats
): 'up' | 'down' | 'stable' => {
  const recentAvg = recentMatches.reduce((acc, match) => {
    Object.keys(match.stats).forEach(key => {
      acc[key as keyof PlayerStats] = (acc[key as keyof PlayerStats] || 0) + 
        (match.stats[key as keyof PlayerStats] || 0);
    });
    return acc;
  }, {} as PlayerStats);

  Object.keys(recentAvg).forEach(key => {
    recentAvg[key as keyof PlayerStats] = 
      (recentAvg[key as keyof PlayerStats] || 0) / recentMatches.length;
  });

  const metrics = ['kda', 'acs', 'impact'];
  let improvements = 0;
  let declines = 0;

  metrics.forEach(metric => {
    const diff = ((recentAvg[metric as keyof PlayerStats] || 0) - 
      (averageStats[metric as keyof PlayerStats] || 0)) / 
      (averageStats[metric as keyof PlayerStats] || 1) * 100;
    
    if (diff > 10) improvements++;
    else if (diff < -10) declines++;
  });

  if (improvements > declines) return 'up';
  if (declines > improvements) return 'down';
  return 'stable';
}; 