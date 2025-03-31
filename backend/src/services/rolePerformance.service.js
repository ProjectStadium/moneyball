const RiotService = require('./riot.service');
const LiquipediaService = require('./liquipedia.service');
const db = require('../models');
const { Player, PlayerMatch, Match, Tournament } = require('../models');

class RolePerformanceService {
  constructor() {
    this.riotService = new RiotService();
    this.liquipediaService = new LiquipediaService();
    this.PlayerMatch = db.PlayerMatch;
    this.Match = db.Match;
    this.Tournament = db.Tournament;
    this.Player = db.Player;

    // Define validation thresholds
    this.validationThresholds = {
      minMatches: 3,           // Minimum number of matches required
      maxOutlierSD: 2.0,       // Standard deviations for outlier detection
      roleConsistency: 0.8,    // Minimum role consistency ratio
      confidenceThresholds: {
        high: 0.8,             // High confidence threshold
        medium: 0.6,           // Medium confidence threshold
        low: 0.4               // Low confidence threshold
      }
    };

    // Define role-specific stat ranges for outlier detection
    this.roleStatRanges = {
      'Duelist': {
        kills: { min: 5, max: 35 },
        deaths: { min: 5, max: 25 },
        assists: { min: 2, max: 15 },
        score: { min: 150, max: 450 },
        firstBloods: { min: 0, max: 8 }
      },
      'Controller': {
        kills: { min: 3, max: 25 },
        deaths: { min: 3, max: 20 },
        assists: { min: 3, max: 20 },
        score: { min: 150, max: 350 },
        firstBloods: { min: 0, max: 5 }
      },
      'Initiator': {
        kills: { min: 3, max: 25 },
        deaths: { min: 3, max: 20 },
        assists: { min: 3, max: 20 },
        score: { min: 150, max: 350 },
        firstBloods: { min: 0, max: 5 }
      },
      'Sentinel': {
        kills: { min: 3, max: 25 },
        deaths: { min: 3, max: 20 },
        assists: { min: 3, max: 20 },
        score: { min: 150, max: 350 },
        firstBloods: { min: 0, max: 5 }
      }
    };

    // Define role-specific weights
    this.weights = {
      'Duelist': {
        kd_ratio: 0.40,       // Highest priority for Duelists
        acs: 0.30,            // Second priority 
        kda: 0.20,            // Third priority
        deaths_per_map: 0.05,  // Least relevant
        first_bloods: 0.05     // Bonus for entry fragging
      },
      'Controller': {
        kda: 0.35,            // Highest priority
        acs: 0.25,            // Second priority
        deaths_per_map: 0.20,  // More important for Controllers
        kd_ratio: 0.10,        // Less important
        utility_usage: 0.10    // Smoke/utility effectiveness
      },
      'Initiator': {
        kda: 0.35,            // Highest priority (balanced approach)
        acs: 0.25,            // Second priority
        kd_ratio: 0.20,        // Third priority
        deaths_per_map: 0.10,  // Less relevant
        utility_usage: 0.10    // Recon/flash effectiveness
      },
      'Sentinel': {
        kda: 0.35,            // Highest priority
        deaths_per_map: 0.30,  // Very important for site anchors
        acs: 0.20,            // Third priority
        kd_ratio: 0.05,        // Least important
        utility_usage: 0.10    // Trap/defensive utility effectiveness
      }
    };

    // Role-specific death modifiers
    this.deathModifiers = {
      'Duelist': 1.2,      // Duelists expected to have more deaths
      'Initiator': 1.1,
      'Controller': 0.9,
      'Sentinel': 0.8      // Sentinels expected to have fewer deaths
    };

    // Tournament stage weights
    this.tournamentStageWeights = {
      'finals': 1.3,        // Highest weight for finals
      'playoffs': 1.2,      // High weight for playoffs
      'group_stage': 1.0,   // Base weight for group stage
      'qualifiers': 0.9,    // Slightly lower weight for qualifiers
      'open_qualifiers': 0.8 // Lowest weight for open qualifiers
    };

    // Recent match weights
    this.recentMatchWeights = {
      last_3: 1.2,    // Last 3 matches get 20% boost
      last_5: 1.1,    // Last 5 matches get 10% boost
      last_10: 1.05   // Last 10 matches get 5% boost
    };

    // Define normalization ranges
    this.normalizationRanges = {
      kd_ratio: { min: 0.5, max: 2.0 },
      acs: { min: 150, max: 350 },
      kda: { min: 1.0, max: 3.0 },
      deaths_per_map: { min: 5, max: 25 },
      first_bloods: { min: 0, max: 5 }
    };
  }

  /**
   * Normalize K/D ratio
   */
  normalizeKD(kd) {
    // 0 KD = 0 points, 1.0 KD = 50 points, 2.0+ KD = 100 points
    return Math.min(100, kd * 50);
  }

  /**
   * Normalize ACS (Average Combat Score)
   */
  normalizeACS(acs) {
    // 150 ACS = 0 points, 250 ACS = 50 points, 350+ ACS = 100 points
    return Math.min(100, Math.max(0, (acs - 150) / 2));
  }

  /**
   * Normalize KDA ratio
   */
  normalizeKDA(kda) {
    // 1.0 KDA = 0 points, 2.0 KDA = 50 points, 3.0+ KDA = 100 points
    return Math.min(100, Math.max(0, (kda - 1) * 50));
  }

  /**
   * Normalize deaths per map with role-specific adjustments
   */
  normalizeDeathsPerMap(deaths, role) {
    // 20+ deaths = 0 points, 15 deaths = 50 points, 10 or fewer deaths = 100 points
    // Adjusted by role expectations
    const modifier = this.deathModifiers[role] || 1;
    return Math.min(100, Math.max(0, (20 - deaths) * 10)) * modifier;
  }

  /**
   * Normalize first bloods
   */
  normalizeFirstBloods(firstBloods) {
    // Scale based on typical first blood distribution
    return Math.min(100, firstBloods * 25);
  }

  /**
   * Get tournament stage from match data
   */
  getTournamentStage(match) {
    if (!match?.info?.tournamentName) return 'group_stage';
    
    const name = match.info.tournamentName.toLowerCase();
    if (name.includes('final')) return 'finals';
    if (name.includes('playoff') || name.includes('knockout')) return 'playoffs';
    if (name.includes('open qualifier')) return 'open_qualifiers';
    if (name.includes('qualifier')) return 'qualifiers';
    return 'group_stage';
  }

  /**
   * Calculate match weight based on recency and tournament stage
   */
  calculateMatchWeight(match, matchIndex, totalMatches) {
    const stage = this.getTournamentStage(match);
    const stageWeight = this.tournamentStageWeights[stage] || 1.0;
    
    // Calculate recency weight
    let recencyWeight = 1.0;
    if (matchIndex < 3) {
      recencyWeight = this.recentMatchWeights.last_3;
    } else if (matchIndex < 5) {
      recencyWeight = this.recentMatchWeights.last_5;
    } else if (matchIndex < 10) {
      recencyWeight = this.recentMatchWeights.last_10;
    }

    return stageWeight * recencyWeight;
  }

  /**
   * Calculate weighted average of matches based on recency and stage
   */
  calculateWeightedStats(matches, puuid) {
    if (!matches || matches.length === 0) return null;

    // Sort matches by date (most recent first)
    const sortedMatches = [...matches].sort((a, b) => {
      return new Date(b.info.gameStartTime) - new Date(a.info.gameStartTime);
    });

    let totalWeight = 0;
    let weightedStats = {
      kd_ratio: 0,
      acs: 0,
      kda: 0,
      deaths_per_map: 0,
      first_bloods: 0,
      first_deaths: 0,
      utility: {
        smokes: 0,
        flashes: 0,
        recon: 0,
        traps: 0,
        postPlantKills: 0,
        flashAssists: 0,
        clutches: 0
      }
    };

    sortedMatches.forEach((match, index) => {
      const player = match.info.players.find(p => p.puuid === puuid);
      if (!player) return;

      const stats = player.stats;
      const matchWeight = this.calculateMatchWeight(match, index, sortedMatches.length);
      totalWeight += matchWeight;

      // Add weighted stats
      weightedStats.kd_ratio += (stats.kills / (stats.deaths || 1)) * matchWeight;
      weightedStats.acs += stats.score * matchWeight;
      weightedStats.kda += ((stats.kills + stats.assists) / (stats.deaths || 1)) * matchWeight;
      weightedStats.deaths_per_map += stats.deaths * matchWeight;
      weightedStats.first_bloods += stats.firstBloods * matchWeight;
      weightedStats.first_deaths += stats.firstDeaths * matchWeight;

      // Add utility stats
      const utilityData = this.riotService.extractUtilityData(match, puuid);
      if (utilityData) {
        Object.keys(utilityData).forEach(key => {
          weightedStats.utility[key] += utilityData[key] * matchWeight;
        });
      }
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      Object.keys(weightedStats).forEach(key => {
        if (key === 'utility') {
          Object.keys(weightedStats.utility).forEach(utilKey => {
            weightedStats.utility[utilKey] /= totalWeight;
          });
        } else {
          weightedStats[key] /= totalWeight;
        }
      });
    }

    return weightedStats;
  }

  /**
   * Calculate utility effectiveness score
   */
  async calculateUtilityEffectiveness(playerMatches, role) {
    if (!playerMatches || playerMatches.length === 0) return 50;

    try {
      // Calculate utility stats from database records
      const utilityStats = playerMatches.reduce((acc, match) => {
        acc.smokes += match.smokes || 0;
        acc.flashes += match.flashes || 0;
        acc.recon += match.recon || 0;
        acc.traps += match.traps || 0;
        acc.postPlantKills += match.post_plant_kills || 0;
        acc.flashAssists += match.flash_assists || 0;
        acc.clutches += match.clutches || 0;
        return acc;
      }, {
        smokes: 0,
        flashes: 0,
        recon: 0,
        traps: 0,
        postPlantKills: 0,
        flashAssists: 0,
        clutches: 0
      });

      // Calculate role-specific effectiveness
      switch (role) {
        case 'Controller':
          return this.calculateControllerEffectiveness(utilityStats);
        case 'Initiator':
          return this.calculateInitiatorEffectiveness(utilityStats);
        case 'Sentinel':
          return this.calculateSentinelEffectiveness(utilityStats);
        default:
          return 50;
      }
    } catch (error) {
      console.error('Error calculating utility effectiveness:', error);
      return 50;
    }
  }

  calculateControllerEffectiveness(stats) {
    const smokeScore = Math.min(100, (stats.smokes / 5) * 100);
    const postPlantScore = Math.min(100, (stats.postPlantKills / 3) * 100);
    return (smokeScore + postPlantScore) / 2;
  }

  calculateInitiatorEffectiveness(stats) {
    const flashScore = Math.min(100, (stats.flashAssists / 4) * 100);
    const reconScore = Math.min(100, (stats.recon / 5) * 100);
    return (flashScore + reconScore) / 2;
  }

  calculateSentinelEffectiveness(stats) {
    const trapScore = Math.min(100, (stats.traps / 3) * 100);
    const clutchScore = Math.min(100, (stats.clutches / 2) * 100);
    return (trapScore + clutchScore) / 2;
  }

  /**
   * Get tournament tier from match data
   */
  getTournamentTier(match) {
    if (!match?.info?.tournamentName) return 'T3';
    
    const name = match.info.tournamentName.toLowerCase();
    if (name.includes('champions') || name.includes('masters')) return 'T1';
    if (name.includes('league') || name.includes('challengers')) return 'T2';
    return 'T3';
  }

  /**
   * Calculate SDIFF (Skill Differential Score)
   */
  async calculateSDIFF(player, playerMatches) {
    try {
      // Get role-specific averages from database
      const roleAverages = await this.getRoleAveragesFromDB(player.role);
      
      // Calculate base RPS
      const baseRPS = this.calculateBaseRPS(playerMatches);
      
      // Get tournament tier weight
      const tournamentTier = this.getTournamentTier(playerMatches[0].Match.Tournament);
      const tierWeight = this.getTierWeight(tournamentTier);
      
      // Calculate recent performance (last 3 matches)
      const recentRPS = this.calculateRecentRPS(playerMatches);
      
      // Calculate SDIFF
      let sdiff = 0;
      
      // Compare with role average
      if (roleAverages) {
        sdiff += (baseRPS - roleAverages) * tierWeight;
      }
      
      // Add recent performance weight
      sdiff += (recentRPS - baseRPS) * 0.3;
      
      // Normalize to -10 to +10 range
      sdiff = Math.max(-10, Math.min(10, sdiff));
      
      return sdiff;
    } catch (error) {
      console.error(`Error calculating SDIFF for player ${player.name}:`, error);
      return 0;
    }
  }

  /**
   * Get weight for tournament tier
   */
  getTierWeight(tier) {
    const tierWeights = {
      'T1': 2.0,  // S-Tier tournaments (doubled weight)
      'T2': 1.5,  // A-Tier + B-Tier tournaments (50% boost)
      'T3': 1.0,  // B-Tier + C-Tier tournaments (base weight)
      'T4': 0.7   // Qualifying events (30% reduction)
    };
    return tierWeights[tier] || 1.0;
  }

  /**
   * Calculate RPS for recent matches
   */
  calculateRecentRPS(matches) {
    if (!matches || matches.length === 0) return 50;

    // Sort matches by date (most recent first)
    const sortedMatches = [...matches].sort((a, b) => {
      const dateA = a.match_date || a.info?.gameStartTime || new Date(0);
      const dateB = b.match_date || b.info?.gameStartTime || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    // Get last 3 matches
    const recentMatches = sortedMatches.slice(0, 3);

    // Calculate base stats for recent matches
    const stats = recentMatches.reduce((acc, match) => {
      // Handle both Riot API and database formats
      const kills = match.kills || match.stats?.kills || 0;
      const deaths = match.deaths || match.stats?.deaths || 0;
      const assists = match.assists || match.stats?.assists || 0;
      const score = match.score || match.stats?.score || 0;
      const firstBloods = match.first_bloods || match.stats?.firstBloods || 0;

      acc.kills += kills;
      acc.deaths += deaths;
      acc.assists += assists;
      acc.score += score;
      acc.firstBloods += firstBloods;
      return acc;
    }, { kills: 0, deaths: 0, assists: 0, score: 0, firstBloods: 0 });

    const matchCount = recentMatches.length;
    const avgKills = stats.kills / matchCount;
    const avgDeaths = stats.deaths / matchCount;
    const avgAssists = stats.assists / matchCount;
    const avgScore = stats.score / matchCount;
    const avgFirstBloods = stats.firstBloods / matchCount;

    // Calculate RPS with higher weight for recent performance
    return (
      this.normalizeKD(avgKills / (avgDeaths || 1)) * 0.4 +
      this.normalizeACS(avgScore) * 0.3 +
      this.normalizeKDA((avgKills + avgAssists) / (avgDeaths || 1)) * 0.2 +
      this.normalizeFirstBloods(avgFirstBloods) * 0.1
    ) * 1.2; // 20% boost for recent matches
  }

  /**
   * Validate match data and calculate confidence score
   */
  validateMatchData(matches, puuid, role) {
    const validationResults = {
      isValid: true,
      confidence: 0,
      issues: [],
      details: {
        matchCount: matches?.length || 0,
        roleConsistency: 0,
        outliers: [],
        statRanges: {}
      }
    };

    if (!matches || matches.length === 0) {
      validationResults.isValid = false;
      validationResults.issues.push('No matches provided');
      return validationResults;
    }

    // Check minimum match requirement
    if (matches.length < this.validationThresholds.minMatches) {
      validationResults.isValid = false;
      validationResults.issues.push(`Insufficient matches (${matches.length}/${this.validationThresholds.minMatches} required)`);
    }

    // Check role consistency
    const roleConsistency = this.calculateRoleConsistency(matches, puuid, role);
    validationResults.details.roleConsistency = roleConsistency;
    if (roleConsistency < this.validationThresholds.roleConsistency) {
      validationResults.issues.push(`Low role consistency (${(roleConsistency * 100).toFixed(1)}%)`);
    }

    // Check for outliers
    const outliers = this.detectOutliers(matches, puuid, role);
    validationResults.details.outliers = outliers;
    if (outliers.length > 0) {
      validationResults.issues.push(`Found ${outliers.length} statistical outliers`);
    }

    // Calculate confidence score
    validationResults.confidence = this.calculateConfidenceScore(validationResults);

    return validationResults;
  }

  /**
   * Calculate role consistency across matches
   */
  calculateRoleConsistency(matches, puuid, expectedRole) {
    if (!matches || matches.length === 0) return 0;

    const roleCount = matches.reduce((count, match) => {
      const player = match.info.players.find(p => p.puuid === puuid);
      return count + (player?.role === expectedRole ? 1 : 0);
    }, 0);

    return roleCount / matches.length;
  }

  /**
   * Detect statistical outliers in match data
   */
  detectOutliers(matches, puuid, role) {
    const outliers = [];
    const statRanges = this.roleStatRanges[role];

    matches.forEach((match, index) => {
      const player = match.info.players.find(p => p.puuid === puuid);
      if (!player) return;

      const stats = player.stats;
      const outlierStats = {};

      // Check each stat against role-specific ranges
      Object.entries(statRanges).forEach(([stat, range]) => {
        const value = stats[stat];
        if (value < range.min || value > range.max) {
          outlierStats[stat] = {
            value,
            expected: range,
            matchIndex: index
          };
        }
      });

      if (Object.keys(outlierStats).length > 0) {
        outliers.push({
          matchIndex: index,
          stats: outlierStats
        });
      }
    });

    return outliers;
  }

  /**
   * Calculate confidence score based on validation results
   */
  calculateConfidenceScore(validationResults) {
    let score = 1.0;
    const { details, issues } = validationResults;

    // Penalize for insufficient matches
    if (details.matchCount < this.validationThresholds.minMatches) {
      score *= 0.7;
    }

    // Penalize for low role consistency
    if (details.roleConsistency < this.validationThresholds.roleConsistency) {
      score *= details.roleConsistency;
    }

    // Penalize for outliers
    if (details.outliers.length > 0) {
      const outlierPenalty = Math.max(0.5, 1 - (details.outliers.length / details.matchCount));
      score *= outlierPenalty;
    }

    // Determine confidence level
    let confidenceLevel = 'low';
    if (score >= this.validationThresholds.confidenceThresholds.high) {
      confidenceLevel = 'high';
    } else if (score >= this.validationThresholds.confidenceThresholds.medium) {
      confidenceLevel = 'medium';
    }

    return {
      score,
      level: confidenceLevel,
      issues: issues.length
    };
  }

  /**
   * Calculate RPS for a player
   */
  async calculateRPS(player, match = null, options = {}) {
    try {
      // Get player matches from database
      const playerMatches = await this.PlayerMatch.findAll({
        where: { player_id: player.id },
        include: [
          {
            model: this.Match,
            as: 'Match',
            include: [
              {
                model: this.Tournament,
                attributes: ['name', 'tier', 'start_date']
              }
            ]
          }
        ],
        order: [['match_date', 'DESC']],
        limit: 10
      });

      // If no matches found, return null
      if (!playerMatches || playerMatches.length === 0) {
        return null;
      }

      // Calculate base stats from database
      const stats = this.calculateBaseStats(playerMatches);
      
      // Calculate role-specific metrics
      const roleMetrics = this.calculateRoleMetrics(playerMatches, player.role);
      
      // Calculate tournament stage weights
      const stageWeights = this.calculateTournamentStageWeights(playerMatches);
      
      // Use database-only calculations
      const utilityEffectiveness = this.calculateBasicUtilityEffectiveness(playerMatches, player.role);
      const sdiff = await this.calculateSDIFFFromDB(player, playerMatches);

      // Calculate final score
      const finalScore = this.calculateFinalScore(stats, roleMetrics, stageWeights, utilityEffectiveness);

      // Validate match data
      const validationResults = this.validateMatchData(playerMatches, player.puuid, player.role);

      return {
        score: finalScore,
        sdiff: sdiff,
        confidence: validationResults.confidence,
        validation: validationResults,
        details: {
          baseStats: stats,
          roleMetrics,
          stageWeights,
          utilityEffectiveness,
          matches: playerMatches.map(m => ({
            id: m.match_id,
            date: m.match_date,
            tournament: m.Match.Tournament.name,
            tier: m.Match.Tournament.tier,
            stats: {
              kills: m.kills,
              deaths: m.deaths,
              assists: m.assists,
              score: m.score,
              first_bloods: m.first_bloods,
              first_deaths: m.first_deaths,
              first_touches: m.first_touches,
              plants: m.plants,
              defuses: m.defuses
            }
          }))
        }
      };
    } catch (error) {
      console.error(`Error calculating RPS for player ${player.name}:`, error);
      return null;
    }
  }

  calculateBasicUtilityEffectiveness(matches, role) {
    if (!matches || matches.length === 0) return 50;

    // Calculate basic utility stats from database records
    const utilityStats = matches.reduce((acc, match) => {
      acc.smokes += match.smokes || 0;
      acc.flashes += match.flashes || 0;
      acc.recon += match.recon || 0;
      acc.traps += match.traps || 0;
      acc.postPlantKills += match.post_plant_kills || 0;
      acc.flashAssists += match.flash_assists || 0;
      acc.clutches += match.clutches || 0;
      return acc;
    }, {
      smokes: 0,
      flashes: 0,
      recon: 0,
      traps: 0,
      postPlantKills: 0,
      flashAssists: 0,
      clutches: 0
    });

    // Calculate role-specific effectiveness
    switch (role) {
      case 'Controller':
        return this.calculateControllerEffectiveness(utilityStats);
      case 'Initiator':
        return this.calculateInitiatorEffectiveness(utilityStats);
      case 'Sentinel':
        return this.calculateSentinelEffectiveness(utilityStats);
      default:
        return 50;
    }
  }

  async calculateSDIFFFromDB(player, playerMatches) {
    try {
      // Get role-specific averages from database
      const roleAverages = await this.getRoleAveragesFromDB(player.role);
      
      // Calculate base RPS
      const baseRPS = this.calculateBaseRPS(playerMatches);
      
      // Get tournament tier weight
      const tournamentTier = this.getTournamentTier(playerMatches[0]?.Match?.Tournament || playerMatches[0]?.info?.tournament);
      const tierWeight = this.getTierWeight(tournamentTier);
      
      // Calculate recent performance (last 3 matches)
      const recentRPS = this.calculateRecentRPS(playerMatches);
      
      // Calculate SDIFF
      let sdiff = 0;
      
      // Compare with role average
      if (roleAverages) {
        sdiff += (baseRPS - roleAverages) * tierWeight;
      } else {
        // If no role averages available, use a baseline value
        sdiff += (baseRPS - 50) * tierWeight;
      }
      
      // Add recent performance weight
      sdiff += (recentRPS - baseRPS) * 0.3;
      
      // Normalize to -10 to +10 range
      sdiff = Math.max(-10, Math.min(10, sdiff));
      
      return sdiff;
    } catch (error) {
      console.error(`Error calculating SDIFF from DB for player ${player.name}:`, error);
      // Return a default value instead of 0 to indicate performance is unknown
      return null;
    }
  }

  /**
   * Apply weights based on tournament stage
   */
  applyStageWeights(matches, tournamentStage) {
    if (!tournamentStage) return matches;

    const stageWeights = {
      finals: 1.2,
      playoffs: 1.1,
      group_stage: 1.0
    };

    return matches.map(match => ({
      ...match,
      weight: stageWeights[this.getTournamentStage(match)] || 1.0
    }));
  }

  /**
   * Apply weights to recent matches
   */
  applyRecentMatchWeights(matches) {
    const recentMatchCount = Math.min(3, matches.length);
    const weightMultiplier = 1.2;

    return matches.map((match, index) => ({
      ...match,
      weight: (match.weight || 1.0) * (index < recentMatchCount ? weightMultiplier : 1.0)
    }));
  }

  /**
   * Calculate impact of recent matches on final score
   */
  calculateRecentMatchesImpact(matches) {
    const recentMatchCount = Math.min(3, matches.length);
    const recentMatches = matches.slice(0, recentMatchCount);
    const olderMatches = matches.slice(recentMatchCount);

    const recentStats = this.calculateBaseStats(recentMatches);
    const olderStats = this.calculateBaseStats(olderMatches);

    return {
      recentMatches: recentStats,
      olderMatches: olderStats,
      difference: {
        kd: recentStats.kd - olderStats.kd,
        acs: recentStats.acs - olderStats.acs,
        adr: recentStats.adr - olderStats.adr
      }
    };
  }

  /**
   * Get weight applied to recent matches
   */
  getRecentMatchesWeight(matches) {
    const recentMatchCount = Math.min(3, matches.length);
    return {
      count: recentMatchCount,
      multiplier: 1.2,
      matches: matches.slice(0, recentMatchCount).map(match => ({
        date: match.info.gameStartTime,
        weight: 1.2
      }))
    };
  }

  /**
   * Normalize a value to a 0-100 scale (generic helper)
   */
  normalizeValue(value, min, max) {
    if (max === min) return 50; // Return middle value if range is 0
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * Get tournament matches for a player
   */
  async getTournamentMatches(puuid, tournamentName) {
    try {
      const matches = await this.riotService.getTournamentMatches(puuid, tournamentName);
      return matches;
    } catch (error) {
      console.error('Error getting tournament matches:', error);
      throw error;
    }
  }

  /**
   * Calculate base stats from matches
   */
  calculateBaseStats(matches) {
    if (!matches || matches.length === 0) {
      return {
        kd_ratio: 1.0,
        acs: 200,
        kda: 1.0,
        deaths_per_map: 15,
        first_bloods: 0
      };
    }

    const stats = matches.reduce((acc, match) => {
      acc.kills += match.kills || 0;
      acc.deaths += match.deaths || 0;
      acc.assists += match.assists || 0;
      acc.score += match.score || 0;
      acc.first_bloods += match.first_bloods || 0;
      acc.maps += 1;
      return acc;
    }, {
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0,
      first_bloods: 0,
      maps: 0
    });

    // Get player from first match to check for Liquipedia data
    const player = matches[0]?.Player;
    const hasLiquipediaData = player?.liquipedia_stats && Object.keys(player.liquipedia_stats).length > 0;
    
    // Calculate deaths per map with Liquipedia data if available
    let deathsPerMap = stats.deaths / stats.maps;
    if (hasLiquipediaData) {
      const liquipediaDeaths = player.liquipedia_stats.deaths_per_map;
      if (liquipediaDeaths !== undefined && liquipediaDeaths !== null) {
        // Weight Liquipedia data more heavily (70%) when available
        deathsPerMap = (liquipediaDeaths * 0.7) + (deathsPerMap * 0.3);
      }
    }

    return {
      kd_ratio: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills,
      acs: stats.score / stats.maps,
      kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : (stats.kills + stats.assists),
      deaths_per_map: deathsPerMap,
      first_bloods: stats.first_bloods / stats.maps,
      data_source: hasLiquipediaData ? 'liquipedia' : 'match_data'
    };
  }

  /**
   * Get role-specific weights
   */
  getRoleWeights(role) {
    return this.weights[role] || this.weights['Duelist']; // Default to Duelist weights
  }

  /**
   * Calculate stage adjustments
   */
  calculateStageAdjustments(matches, tournamentStage) {
    const stageWeights = {
      finals: 1.2,
      playoffs: 1.1,
      group_stage: 1.0,
      qualifiers: 0.9
    };

    if (!tournamentStage) {
      return {
        applied: false,
        multiplier: 1.0
      };
    }

    return {
      applied: true,
      multiplier: stageWeights[tournamentStage] || 1.0
    };
  }

  /**
   * Calculate final score
   */
  calculateFinalScore(stats, roleMetrics, stageWeights, utilityEffectiveness) {
    if (!stats || !roleMetrics || !stageWeights) return 50;

    const baseScore = Object.values(roleMetrics).reduce((sum, value) => sum + value, 0);
    const averageStageWeight = stageWeights.reduce((sum, w) => sum + w.weight, 0) / stageWeights.length;
    
    return Math.min(100, Math.max(0, (baseScore * averageStageWeight + utilityEffectiveness) / 2));
  }

  /**
   * Normalize metrics based on role and ranges
   */
  normalizeMetrics(stats, role) {
    const normalizedMetrics = {};

    // Normalize K/D ratio
    normalizedMetrics.kd_ratio = this.normalizeValue(
      stats.kd_ratio,
      this.normalizationRanges.kd_ratio.min,
      this.normalizationRanges.kd_ratio.max
    );

    // Normalize ACS
    normalizedMetrics.acs = this.normalizeValue(
      stats.acs,
      this.normalizationRanges.acs.min,
      this.normalizationRanges.acs.max
    );

    // Normalize KDA
    normalizedMetrics.kda = this.normalizeValue(
      stats.kda,
      this.normalizationRanges.kda.min,
      this.normalizationRanges.kda.max
    );

    // Normalize deaths per map (inverted - fewer deaths is better)
    normalizedMetrics.deaths_per_map = 100 - this.normalizeValue(
      stats.deaths_per_map,
      this.normalizationRanges.deaths_per_map.min,
      this.normalizationRanges.deaths_per_map.max
    );

    // Normalize first bloods
    normalizedMetrics.first_bloods = this.normalizeValue(
      stats.first_bloods,
      this.normalizationRanges.first_bloods.min,
      this.normalizationRanges.first_bloods.max
    );

    // Apply role-specific adjustments
    switch (role) {
      case 'Duelist':
        // Duelists get bonus for high first bloods and K/D
        normalizedMetrics.first_bloods *= 1.2;
        normalizedMetrics.kd_ratio *= 1.1;
        break;
      case 'Controller':
        // Controllers get bonus for staying alive and utility usage
        normalizedMetrics.deaths_per_map *= 1.2;
        break;
      case 'Initiator':
        // Initiators get balanced adjustments
        normalizedMetrics.kda *= 1.1;
        break;
      case 'Sentinel':
        // Sentinels get major bonus for staying alive
        normalizedMetrics.deaths_per_map *= 1.3;
        break;
    }

    // Ensure all metrics are between 0 and 100
    Object.keys(normalizedMetrics).forEach(key => {
      normalizedMetrics[key] = Math.min(100, Math.max(0, normalizedMetrics[key]));
    });

    return normalizedMetrics;
  }

  /**
   * Get utility data from matches
   */
  async getUtilityData(matches, puuid, role) {
    const utilityData = {
      smokes: 0,
      flashes: 0,
      recon: 0,
      traps: 0,
      postPlantKills: 0,
      flashAssists: 0,
      clutches: 0
    };

    if (!matches || matches.length === 0) {
      return utilityData;
    }

    let totalWeight = 0;

    matches.forEach(match => {
      const weight = match.weight || 1.0;
      totalWeight += weight;

      const matchUtility = this.riotService.extractUtilityData(match, puuid, role);
      if (matchUtility) {
        Object.keys(utilityData).forEach(key => {
          utilityData[key] += (matchUtility[key] || 0) * weight;
        });
      }
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      Object.keys(utilityData).forEach(key => {
        utilityData[key] /= totalWeight;
      });
    }

    // Add role-specific utility metrics
    switch (role) {
      case 'Controller':
        utilityData.smokeEfficiency = this.calculateSmokeEfficiency(matches, puuid);
        break;
      case 'Initiator':
        utilityData.flashEfficiency = this.calculateFlashEfficiency(matches, puuid);
        break;
      case 'Sentinel':
        utilityData.trapEfficiency = this.calculateTrapEfficiency(matches, puuid);
        break;
    }

    return utilityData;
  }

  /**
   * Calculate smoke efficiency (kills through/after smoke)
   */
  calculateSmokeEfficiency(matches, puuid) {
    let smokeKills = 0;
    let totalSmokes = 0;

    matches.forEach(match => {
      const player = match.info.players.find(p => p.puuid === puuid);
      if (!player || !player.stats) return;

      smokeKills += player.stats.smokeKills || 0;
      totalSmokes += player.stats.smokesUsed || 0;
    });

    return totalSmokes > 0 ? (smokeKills / totalSmokes) * 100 : 0;
  }

  /**
   * Calculate flash efficiency (kills during flash)
   */
  calculateFlashEfficiency(matches, puuid) {
    let flashKills = 0;
    let totalFlashes = 0;

    matches.forEach(match => {
      const player = match.info.players.find(p => p.puuid === puuid);
      if (!player || !player.stats) return;

      flashKills += player.stats.flashKills || 0;
      totalFlashes += player.stats.flashesUsed || 0;
    });

    return totalFlashes > 0 ? (flashKills / totalFlashes) * 100 : 0;
  }

  /**
   * Calculate trap efficiency (kills from traps)
   */
  calculateTrapEfficiency(matches, puuid) {
    let trapKills = 0;
    let totalTraps = 0;

    matches.forEach(match => {
      const player = match.info.players.find(p => p.puuid === puuid);
      if (!player || !player.stats) return;

      trapKills += player.stats.trapKills || 0;
      totalTraps += player.stats.trapsUsed || 0;
    });

    return totalTraps > 0 ? (trapKills / totalTraps) * 100 : 0;
  }

  /**
   * Get role-specific averages from tournament data
   */
  getRoleAverages(matches, role) {
    if (!matches || matches.length === 0) {
      return {
        averageRPS: 50,
        tournamentCount: 0,
        playerCount: 0
      };
    }

    // Group matches by tournament
    const tournamentGroups = {};
    matches.forEach(match => {
      const tournamentName = match.info.tournamentName;
      if (!tournamentGroups[tournamentName]) {
        tournamentGroups[tournamentName] = [];
      }
      tournamentGroups[tournamentName].push(match);
    });

    // Calculate averages for each tournament
    const tournamentAverages = Object.entries(tournamentGroups).map(([tournament, tournamentMatches]) => {
      const rolePlayers = tournamentMatches.flatMap(match => 
        match.info.players.filter(p => p.role === role)
      );

      if (rolePlayers.length === 0) return null;

      const averageRPS = rolePlayers.reduce((sum, player) => {
        const stats = player.stats;
        const kd = stats.kills / (stats.deaths || 1);
        const acs = stats.score;
        const kda = (stats.kills + stats.assists) / (stats.deaths || 1);
        const deathsPerMap = stats.deaths;
        const firstBloods = stats.firstBloods;

        // Calculate RPS using role-specific weights
        const weights = this.weights[role];
        const rps = (
          this.normalizeKD(kd) * weights.kd_ratio +
          this.normalizeACS(acs) * weights.acs +
          this.normalizeKDA(kda) * weights.kda +
          this.normalizeDeathsPerMap(deathsPerMap, role) * weights.deaths_per_map +
          this.normalizeFirstBloods(firstBloods) * weights.first_bloods
        );

        return sum + rps;
      }, 0) / rolePlayers.length;

      // Get tournament tier and weight
      const tier = this.getTournamentTier([{ info: { tournamentName: tournament } }]);
      const tierWeight = this.getTierWeight(tier);

      return {
        tournament,
        averageRPS,
        playerCount: rolePlayers.length,
        tier,
        tierWeight
      };
    }).filter(Boolean);

    if (tournamentAverages.length === 0) {
      return {
        averageRPS: 50,
        tournamentCount: 0,
        playerCount: 0
      };
    }

    // Calculate weighted average based on tournament tier and player count
    const totalWeightedSum = tournamentAverages.reduce((sum, avg) => 
      sum + (avg.averageRPS * avg.tierWeight * avg.playerCount), 0);
    const totalWeightedCount = tournamentAverages.reduce((sum, avg) => 
      sum + (avg.tierWeight * avg.playerCount), 0);

    return {
      averageRPS: totalWeightedSum / totalWeightedCount,
      tournamentCount: tournamentAverages.length,
      playerCount: tournamentAverages.reduce((sum, avg) => sum + avg.playerCount, 0),
      tournamentTiers: tournamentAverages.map(avg => ({
        tournament: avg.tournament,
        tier: avg.tier,
        weight: avg.tierWeight
      }))
    };
  }

  async getRoleAveragesFromDB(role) {
    try {
      // Get all players with their recent matches
      const players = await this.Player.findAll({
        include: [{
          model: this.PlayerMatch,
          as: 'player_matches',
          include: [{
            model: this.Match,
            include: [{
              model: this.Tournament,
              attributes: ['name', 'tier', 'start_date']
            }]
          }]
        }],
        where: {
          role: role
        }
      });

      if (!players || players.length === 0) {
        return null;
      }

      // Calculate averages for each stat
      const stats = players.reduce((acc, player) => {
        if (player.player_matches && player.player_matches.length > 0) {
          acc.kills += player.kills_per_map || 0;
          acc.deaths += player.deaths_per_map || 0;
          acc.assists += player.assists_per_map || 0;
          acc.acs += player.acs || 0;
          acc.count++;
        }
        return acc;
      }, { kills: 0, deaths: 0, assists: 0, acs: 0, count: 0 });

      if (stats.count === 0) {
        return null;
      }

      return {
        kills_per_map: stats.kills / stats.count,
        deaths_per_map: stats.deaths / stats.count,
        assists_per_map: stats.assists / stats.count,
        acs: stats.acs / stats.count,
        kd_ratio: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills,
        kda: stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : (stats.kills + stats.assists)
      };
    } catch (error) {
      console.error('Error getting role averages from DB:', error);
      return null;
    }
  }

  calculateBaseRPS(matches) {
    if (!matches || matches.length === 0) return 50;

    const stats = matches.reduce((acc, match) => {
      // Handle both Riot API and database formats
      const kills = match.kills || match.stats?.kills || 0;
      const deaths = match.deaths || match.stats?.deaths || 0;
      const assists = match.assists || match.stats?.assists || 0;
      const score = match.score || match.stats?.score || 0;
      const firstBloods = match.first_bloods || match.stats?.firstBloods || 0;

      acc.kills += kills;
      acc.deaths += deaths;
      acc.assists += assists;
      acc.score += score;
      acc.firstBloods += firstBloods;
      return acc;
    }, { kills: 0, deaths: 0, assists: 0, score: 0, firstBloods: 0 });

    const matchCount = matches.length;
    const avgKills = stats.kills / matchCount;
    const avgDeaths = stats.deaths / matchCount;
    const avgAssists = stats.assists / matchCount;
    const avgScore = stats.score / matchCount;
    const avgFirstBloods = stats.firstBloods / matchCount;

    return (
      this.normalizeKD(avgKills / (avgDeaths || 1)) * 0.4 +
      this.normalizeACS(avgScore) * 0.3 +
      this.normalizeKDA((avgKills + avgAssists) / (avgDeaths || 1)) * 0.2 +
      this.normalizeFirstBloods(avgFirstBloods) * 0.1
    );
  }

  calculateRoleMetrics(matches, role) {
    if (!matches || matches.length < this.validationThresholds.minMatches) {
      return {
        kd_ratio: 50,
        acs: 50,
        kda: 50,
        deaths_per_map: 50,
        first_bloods: 50,
        data_source: 'insufficient_data',
        confidence: {
          level: 'low',
          score: 0.4,
          issues: 1
        }
      };
    }

    const stats = this.calculateBaseStats(matches);
    const weights = this.weights[role] || this.weights['Duelist'];
    
    // Get player from first match to check for Liquipedia data
    const player = matches[0]?.Player;
    const hasLiquipediaData = player?.liquipedia_stats && Object.keys(player.liquipedia_stats).length > 0;
    
    // Adjust weights based on data source reliability
    const adjustedWeights = { ...weights };
    if (hasLiquipediaData) {
      // Increase weight for deaths_per_map when Liquipedia data is available
      adjustedWeights.deaths_per_map *= 1.5;
      // Normalize other weights to maintain total of 1
      const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
      Object.keys(adjustedWeights).forEach(key => {
        adjustedWeights[key] /= totalWeight;
      });
    }

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(matches, role, hasLiquipediaData);

    return {
      kd_ratio: stats.kd_ratio * adjustedWeights.kd_ratio,
      acs: stats.acs * adjustedWeights.acs,
      kda: stats.kda * adjustedWeights.kda,
      deaths_per_map: stats.deaths_per_map * adjustedWeights.deaths_per_map,
      first_bloods: stats.first_bloods * adjustedWeights.first_bloods,
      data_source: hasLiquipediaData ? 'liquipedia' : 'match_data',
      confidence
    };
  }

  calculateConfidence(matches, role, hasLiquipediaData) {
    const matchCount = matches.length;
    const roleConsistency = this.calculateRoleConsistency(matches, role);
    const dataQuality = hasLiquipediaData ? 1.0 : 0.8;
    
    let confidenceScore = 0.5; // Base confidence
    
    // Adjust based on match count
    if (matchCount >= 10) confidenceScore += 0.2;
    else if (matchCount >= 5) confidenceScore += 0.1;
    
    // Adjust based on role consistency
    if (roleConsistency >= this.validationThresholds.roleConsistency) {
      confidenceScore += 0.2;
    }
    
    // Adjust based on data quality
    confidenceScore *= dataQuality;
    
    // Determine confidence level
    let level = 'low';
    if (confidenceScore >= this.validationThresholds.confidenceThresholds.high) {
      level = 'high';
    } else if (confidenceScore >= this.validationThresholds.confidenceThresholds.medium) {
      level = 'medium';
    }
    
    // Count issues
    const issues = [];
    if (matchCount < this.validationThresholds.minMatches) issues.push('insufficient_matches');
    if (roleConsistency < this.validationThresholds.roleConsistency) issues.push('inconsistent_role');
    if (!hasLiquipediaData) issues.push('no_liquipedia_data');
    
    return {
      level,
      score: confidenceScore,
      issues: issues.length
    };
  }

  calculateTournamentStageWeights(matches) {
    if (!matches || matches.length === 0) return null;

    return matches.map(match => ({
      match_id: match.match_id,
      weight: this.tournamentStageWeights[match.Match.Tournament.stage] || 1.0
    }));
  }
}

module.exports = RolePerformanceService; 