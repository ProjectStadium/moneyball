interface PlayerStats {
  rating: number;
  kd_ratio: number;
  headshot_percentage: number;
  first_blood_percentage: number;
  clutch_percentage: number;
  average_combat_score: number;
  win_rate: number;
}

interface TournamentResult {
  placement: number;
  total_teams: number;
  prize_pool: number;
  date: string;
}

interface SalaryFactors {
  base_salary: number;
  performance_multiplier: number;
  experience_multiplier: number;
  tournament_multiplier: number;
  region_multiplier: number;
  role_multiplier: number;
  superstar_multiplier: number;
  market_demand_multiplier: number;
}

interface PerformanceThreshold {
  min: number;
  max: number;
  multiplier: number;
}

// Base salaries by competitive tier (monthly in USD)
const TIER_BASE_SALARIES: { [key: string]: { min: number; max: number; avg: number } } = {
  'T1': { min: 4000, max: 10000, avg: 5500 },
  'T2': { min: 2500, max: 4000, avg: 3250 },
  'T3': { min: 600, max: 1750, avg: 1175 },
  'T4': { min: 0, max: 600, avg: 300 },
};

// Performance thresholds for each tier
const TIER_PERFORMANCE_THRESHOLDS: { [key: string]: PerformanceThreshold[] } = {
  'T1': [
    { min: 0.9, max: 1.0, multiplier: 1.5 }, // Superstar
    { min: 0.8, max: 0.9, multiplier: 1.3 }, // Elite
    { min: 0.7, max: 0.8, multiplier: 1.1 }, // Pro
    { min: 0.6, max: 0.7, multiplier: 1.0 }, // Standard
  ],
  'T2': [
    { min: 0.85, max: 1.0, multiplier: 1.4 }, // Elite
    { min: 0.75, max: 0.85, multiplier: 1.2 }, // Pro
    { min: 0.65, max: 0.75, multiplier: 1.0 }, // Standard
  ],
  'T3': [
    { min: 0.8, max: 1.0, multiplier: 1.3 }, // Pro
    { min: 0.7, max: 0.8, multiplier: 1.1 }, // Standard
  ],
  'T4': [
    { min: 0.7, max: 1.0, multiplier: 1.2 }, // Standard
  ],
};

const REGION_MULTIPLIERS: { [key: string]: number } = {
  'NA': 1.0,
  'EU': 0.9,
  'KR': 1.2,
  'CN': 1.1,
  'BR': 0.7,
  'LATAM': 0.6,
  'SEA': 0.8,
  'OCE': 0.7,
  'MENA': 0.8,
  'SA': 0.6,
};

const ROLE_MULTIPLIERS: { [key: string]: number } = {
  'duelist': 1.1,
  'sentinel': 1.0,
  'controller': 1.0,
  'initiator': 1.05,
};

// Market demand factors by role and region
const MARKET_DEMAND: { [key: string]: { [key: string]: number } } = {
  'NA': {
    'duelist': 1.2,
    'sentinel': 1.0,
    'controller': 1.1,
    'initiator': 1.15,
  },
  'EU': {
    'duelist': 1.1,
    'sentinel': 1.0,
    'controller': 1.15,
    'initiator': 1.1,
  },
  'KR': {
    'duelist': 1.3,
    'sentinel': 1.0,
    'controller': 1.0,
    'initiator': 1.2,
  },
  // Add other regions as needed
};

// Historical salary data tracking
interface SalaryHistory {
  date: string;
  salary: number;
  factors: SalaryFactors;
}

export class SalaryCalculator {
  private static salaryHistory: { [key: string]: SalaryHistory[] } = {};

  private static calculatePerformanceScore(stats: PlayerStats): number {
    const weights = {
      rating: 0.3,
      kd_ratio: 0.2,
      headshot_percentage: 0.15,
      first_blood_percentage: 0.1,
      clutch_percentage: 0.1,
      average_combat_score: 0.1,
      win_rate: 0.05,
    };

    return (
      stats.rating * weights.rating +
      stats.kd_ratio * weights.kd_ratio +
      stats.headshot_percentage * weights.headshot_percentage +
      stats.first_blood_percentage * weights.first_blood_percentage +
      stats.clutch_percentage * weights.clutch_percentage +
      stats.average_combat_score * weights.average_combat_score +
      stats.win_rate * weights.win_rate
    );
  }

  private static calculateTournamentScore(results: TournamentResult[]): number {
    if (results.length === 0) return 1.0;

    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      // Weight recent tournaments more heavily
      const daysAgo = (new Date().getTime() - new Date(result.date).getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-daysAgo / 180); // Exponential decay over 6 months
      const placementScore = 1 - (result.placement - 1) / result.total_teams;
      const prizePoolFactor = Math.log10(result.prize_pool) / 6;

      totalScore += (placementScore * 0.7 + prizePoolFactor * 0.3) * weight;
      totalWeight += weight;
    });

    return totalScore / totalWeight;
  }

  private static calculateExperienceMultiplier(tournamentExperience: number): number {
    return 1 + Math.min(Math.log10(tournamentExperience + 1), 1);
  }

  private static calculateRoleMultiplier(rolePerformance: { [key: string]: number }): number {
    if (Object.keys(rolePerformance).length === 0) return 1.0;

    const bestRole = Object.entries(rolePerformance).reduce((best, [role, score]) => {
      return score > best.score ? { role, score } : best;
    }, { role: '', score: 0 });

    return ROLE_MULTIPLIERS[bestRole.role] || 1.0;
  }

  private static calculateSuperstarMultiplier(
    performanceScore: number,
    competitiveTier: string,
    tournamentResults: TournamentResult[]
  ): number {
    const thresholds = TIER_PERFORMANCE_THRESHOLDS[competitiveTier];
    if (!thresholds) return 1.0;

    // Find the matching threshold
    const threshold = thresholds.find(t => 
      performanceScore >= t.min && performanceScore < t.max
    );

    if (!threshold) return 1.0;

    // Additional boost for exceptional tournament performance
    const tournamentScore = this.calculateTournamentScore(tournamentResults);
    const tournamentBoost = tournamentScore > 0.9 ? 0.2 : 0;

    return threshold.multiplier + tournamentBoost;
  }

  private static calculateMarketDemandMultiplier(
    region: string,
    rolePerformance: { [key: string]: number }
  ): number {
    if (!MARKET_DEMAND[region]) return 1.0;

    const bestRole = Object.entries(rolePerformance).reduce((best, [role, score]) => {
      return score > best.score ? { role, score } : best;
    }, { role: '', score: 0 });

    return MARKET_DEMAND[region][bestRole.role] || 1.0;
  }

  private static getBaseSalary(competitiveTier: string, performanceScore: number): number {
    const tierRange = TIER_BASE_SALARIES[competitiveTier];
    if (!tierRange) return TIER_BASE_SALARIES['T4'].avg;

    const range = tierRange.max - tierRange.min;
    const performanceOffset = performanceScore * range;
    
    return Math.min(Math.max(tierRange.min + performanceOffset, tierRange.min), tierRange.max);
  }

  public static calculateSalary(
    playerId: string,
    stats: PlayerStats,
    region: string,
    competitiveTier: string,
    tournamentExperience: number,
    tournamentResults: TournamentResult[],
    rolePerformance: { [key: string]: number }
  ): number {
    const performanceScore = this.calculatePerformanceScore(stats);
    const tournamentScore = this.calculateTournamentScore(tournamentResults);
    const experienceMultiplier = this.calculateExperienceMultiplier(tournamentExperience);
    const roleMultiplier = this.calculateRoleMultiplier(rolePerformance);
    const superstarMultiplier = this.calculateSuperstarMultiplier(
      performanceScore,
      competitiveTier,
      tournamentResults
    );
    const marketDemandMultiplier = this.calculateMarketDemandMultiplier(
      region,
      rolePerformance
    );

    const baseSalary = this.getBaseSalary(competitiveTier, performanceScore);

    const factors: SalaryFactors = {
      base_salary: baseSalary,
      performance_multiplier: 1 + performanceScore * 0.5,
      experience_multiplier: experienceMultiplier,
      tournament_multiplier: 1 + tournamentScore * 0.3,
      region_multiplier: REGION_MULTIPLIERS[region] || 1.0,
      role_multiplier: roleMultiplier,
      superstar_multiplier: superstarMultiplier,
      market_demand_multiplier: marketDemandMultiplier,
    };

    let salary = factors.base_salary;
    salary *= factors.performance_multiplier;
    salary *= factors.experience_multiplier;
    salary *= factors.tournament_multiplier;
    salary *= factors.region_multiplier;
    salary *= factors.role_multiplier;
    salary *= factors.superstar_multiplier;
    salary *= factors.market_demand_multiplier;

    // Record salary history
    this.recordSalaryHistory(playerId, salary, factors);

    return Math.round(salary / 100) * 100;
  }

  private static recordSalaryHistory(
    playerId: string,
    salary: number,
    factors: SalaryFactors
  ): void {
    if (!this.salaryHistory[playerId]) {
      this.salaryHistory[playerId] = [];
    }

    this.salaryHistory[playerId].push({
      date: new Date().toISOString(),
      salary,
      factors,
    });

    // Keep only last 12 months of history
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    this.salaryHistory[playerId] = this.salaryHistory[playerId].filter(
      record => new Date(record.date) > twelveMonthsAgo
    );
  }

  public static getSalaryHistory(playerId: string): SalaryHistory[] {
    return this.salaryHistory[playerId] || [];
  }

  public static getSalaryBreakdown(
    stats: PlayerStats,
    region: string,
    competitiveTier: string,
    tournamentExperience: number,
    tournamentResults: TournamentResult[],
    rolePerformance: { [key: string]: number }
  ): SalaryFactors {
    const performanceScore = this.calculatePerformanceScore(stats);
    const tournamentScore = this.calculateTournamentScore(tournamentResults);
    const experienceMultiplier = this.calculateExperienceMultiplier(tournamentExperience);
    const roleMultiplier = this.calculateRoleMultiplier(rolePerformance);
    const superstarMultiplier = this.calculateSuperstarMultiplier(
      performanceScore,
      competitiveTier,
      tournamentResults
    );
    const marketDemandMultiplier = this.calculateMarketDemandMultiplier(
      region,
      rolePerformance
    );
    const baseSalary = this.getBaseSalary(competitiveTier, performanceScore);

    return {
      base_salary: baseSalary,
      performance_multiplier: 1 + performanceScore * 0.5,
      experience_multiplier: experienceMultiplier,
      tournament_multiplier: 1 + tournamentScore * 0.3,
      region_multiplier: REGION_MULTIPLIERS[region] || 1.0,
      role_multiplier: roleMultiplier,
      superstar_multiplier: superstarMultiplier,
      market_demand_multiplier: marketDemandMultiplier,
    };
  }
} 