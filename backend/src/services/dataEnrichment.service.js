const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

class DataEnrichmentService {
  constructor() {
    this.teamsData = new Map();
    this.logFile = path.join(__dirname, '../../../logs/role_determination.log');
    
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Clear the log file on service start
    fs.writeFileSync(this.logFile, '', 'utf8');
    
    this.log('DataEnrichmentService initialized');
    this.regions = {
      'NA': ['US', 'CA', 'MX'],
      'APAC': ['KR', 'JP', 'CN', 'AU', 'SG', 'IN', 'PH', 'VN', 'TH', 'ID', 'MY', 'HK', 'TW'],
      'EU': ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'PL', 'SE', 'DK', 'NO', 'FI', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'UA', 'KZ'],
      'SA': ['BR', 'AR', 'CL', 'PE', 'CO', 'VE', 'EC', 'UY', 'PY', 'BO'],
      'MENA': ['TR', 'SA', 'AE', 'IL'],
      'OCE': ['AU', 'NZ'],
      'CIS': ['RU', 'KZ', 'UA'],
      'LATAM': ['MX', 'AR', 'CL', 'PE', 'CO', 'VE', 'EC', 'UY', 'PY', 'BO']
    };

    // Agent role mapping
    this.agentRoles = {
      'astra': 'Controller',
      'brimstone': 'Controller',
      'clove': 'Controller',
      'harbor': 'Controller',
      'omen': 'Controller',
      'viper': 'Controller',
      'breach': 'Initiator',
      'fade': 'Initiator',
      'gekko': 'Initiator',
      'kayo': 'Initiator',
      'skye': 'Initiator',
      'sova': 'Initiator',
      'tejo': 'Initiator',
      'chamber': 'Sentinel',
      'cypher': 'Sentinel',
      'deadlock': 'Sentinel',
      'killjoy': 'Sentinel',
      'sage': 'Sentinel',
      'vyse': 'Sentinel',
      'jett': 'Duelist',
      'neon': 'Duelist',
      'phoenix': 'Duelist',
      'raze': 'Duelist',
      'reyna': 'Duelist',
      'waylay': 'Duelist',
      'yoru': 'Duelist',
      'iso': 'Duelist'
    };
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`;
    fs.appendFileSync(this.logFile, logMessage);
    console.log(logMessage);
  }

  loadTeamsData() {
    try {
      const teamsFilePath = path.join(__dirname, '../../../data/updated_esport_teams.csv');
      console.log('Loading teams data from:', teamsFilePath);
      const fileContent = fs.readFileSync(teamsFilePath, 'utf-8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Create a map of team abbreviations to full team names
      this.teamsData = new Map(
        records.map(record => [record.team_abbreviation, record.full_team_name])
      );
      
      console.log('Loaded teams data:', this.teamsData.size, 'teams');
      return true;
    } catch (error) {
      console.error('Error loading teams data:', error);
      return false;
    }
  }

  getRegionFromCountryCode(countryCode) {
    if (!countryCode) return null;
    
    for (const [region, countries] of Object.entries(this.regions)) {
      if (countries.includes(countryCode)) {
        return region;
      }
    }
    return null;
  }

  getCountryNameFromCode(countryCode) {
    // This would be better handled with a proper country code library
    // For now, we'll use a simple mapping
    const countryNames = {
      'US': 'United States',
      'CA': 'Canada',
      'MX': 'Mexico',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'SE': 'Sweden',
      'DK': 'Denmark',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'IE': 'Ireland',
      'FI': 'Finland',
      'EE': 'Estonia',
      'CZ': 'Czech Republic',
      'RS': 'Serbia',
      'LT': 'Lithuania',
      'IS': 'Iceland',
      'HR': 'Croatia',
      'BY': 'Belarus',
      'UA': 'Ukraine',
      'KR': 'South Korea',
      'CN': 'China',
      'JP': 'Japan',
      'TW': 'Taiwan',
      'HK': 'Hong Kong',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'PH': 'Philippines',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'MN': 'Mongolia',
      'LA': 'Laos',
      'BR': 'Brazil',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'EC': 'Ecuador',
      'PR': 'Puerto Rico',
      'HN': 'Honduras',
      'SA': 'Saudi Arabia',
      'EG': 'Egypt',
      'PS': 'Palestine',
      'AE': 'United Arab Emirates',
      'AU': 'Australia',
      'IN': 'India',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
      'RU': 'Russia',
      'UZ': 'Uzbekistan',
      'KZ': 'Kazakhstan',
      'AZ': 'Azerbaijan',
      'GE': 'Georgia',
      'AM': 'Armenia',
      'ZA': 'South Africa',
      'MA': 'Morocco',
      'TN': 'Tunisia',
      'DZ': 'Algeria'
    };
    
    return countryNames[countryCode] || countryCode;
  }

  enrichPlayerData(player) {
    // Enrich country information
    if (player.country_code) {
      player.country_name = this.getCountryNameFromCode(player.country_code);
      player.region = this.getRegionFromCountryCode(player.country_code);
    }

    // Set flag title if it's null
    if (!player.player_flag_title && player.country_name) {
      player.player_flag_title = player.country_name;
    }

    // Any non-empty team_abbr means the player is signed
    player.is_free_agent = !player.team_abbr || player.team_abbr.trim() === '';

    // Try to get full team name from our database if available
    if (player.team_abbr && this.teamsData) {
      const trimmedAbbr = player.team_abbr.trim();
      console.log('Looking up team name for abbreviation:', trimmedAbbr);
      const teamName = this.teamsData.get(trimmedAbbr);
      if (teamName) {
        console.log('Found team name:', teamName);
        player.team_name = teamName;
      } else {
        console.log('No team name found, using abbreviation:', trimmedAbbr);
        player.team_name = trimmedAbbr;
      }
    }

    return player;
  }

  enrichPlayersData(players) {
    // Load teams data if not already loaded
    if (!this.teamsData) {
      this.loadTeamsData();
    }

    return players.map(player => this.enrichPlayerData(player));
  }

  calculatePlayerValue(stats) {
    // Weights for different stats that indicate team compatibility
    const weights = {
      rating: 0.25,    // Overall performance rating
      acs: 0.2,        // Average Combat Score - shows consistent impact
      kd: 0.15,        // Kill/Death ratio - shows survivability
      kast: 0.25,      // KAST - shows team play and utility
      adr: 0.15        // Average Damage per Round - shows consistent damage
    };

    // Normalize each stat to a 0-100 scale and apply weights
    const normalizedValue = 
      (stats.rating * 50 * weights.rating) +  // Rating typically 0-2, so multiply by 50
      (stats.acs / 3 * weights.acs) +         // ACS typically 0-300, so divide by 3
      (stats.kd * 50 * weights.kd) +          // K/D typically 0-2, so multiply by 50
      (stats.kast * weights.kast) +           // KAST already 0-100
      (stats.adr / 2 * weights.adr);          // ADR typically 0-200, so divide by 2

    // Round to 2 decimal places
    return Math.round(normalizedValue * 100) / 100;
  }

  estimatePlayerValue(stats) {
    if (!stats.acs || !stats.kd || !stats.adr) return null;
    
    // Base value for a professional player
    let baseValue = 2000; // $2000/month as base
    
    // Performance multipliers
    const acsMultiplier = stats.acs > 250 ? 1.5 : (stats.acs > 200 ? 1.2 : (stats.acs > 150 ? 1 : 0.8));
    const kdMultiplier = stats.kd > 1.3 ? 1.4 : (stats.kd > 1.1 ? 1.2 : (stats.kd > 0.9 ? 1 : 0.8));
    const adrMultiplier = stats.adr > 160 ? 1.3 : (stats.adr > 140 ? 1.2 : (stats.adr > 120 ? 1 : 0.9));
    const ratingMultiplier = stats.rating > 1.5 ? 1.3 : (stats.rating > 1.2 ? 1.2 : (stats.rating > 1.0 ? 1 : 0.9));
    
    // Calculate estimated value
    const estimatedValue = baseValue * acsMultiplier * kdMultiplier * adrMultiplier * ratingMultiplier;
    
    return Math.round(estimatedValue);
  }

  /**
   * Determines a player's playstyles based on their agent usage
   * @param {Object} agentUsage - Object containing agent usage data
   * @param {string} source - Source of the data (vlr, riot, liquipedia)
   * @param {string} playerName - Name of the player for logging
   * @returns {Object} Object containing primary roles and role percentages
   */
  determinePlaystylesFromAgents(agentUsage, source = 'vlr', playerName = 'Unknown') {
    const logPrefix = `[${playerName}]`;
    console.log(`${logPrefix} Processing agent usage for source: ${source}`);
    console.log(`${logPrefix} Input agent usage:`, JSON.stringify(agentUsage, null, 2));
    console.log(`${logPrefix} Agent roles mapping:`, JSON.stringify(this.agentRoles, null, 2));

    if (!agentUsage || typeof agentUsage !== 'object' || Object.keys(agentUsage).length === 0) {
      console.log(`${logPrefix} No valid agent usage data provided`);
      return {
        primary_roles: ['Unknown'],
        role_percentages: {},
        insufficient_data: true,
        source
      };
    }

    // Initialize role counts
    const roleCounts = {};
    let totalPlays = 0;

    // Process each agent's usage
    Object.entries(agentUsage).forEach(([agent, data]) => {
      const agentLower = agent.toLowerCase();
      const role = this.agentRoles[agentLower];
      const count = typeof data === 'number' ? data : 
                   typeof data === 'object' && data.playCount ? data.playCount :
                   typeof data === 'object' && data.percentage ? data.percentage : 0;

      console.log(`${logPrefix} Processing agent ${agent}:`);
      console.log(`${logPrefix}   - Role:`, role);
      console.log(`${logPrefix}   - Count:`, count);

      if (role) {
        roleCounts[role] = (roleCounts[role] || 0) + count;
        console.log(`${logPrefix}   - Added ${count} to role ${role}`);
        totalPlays += count;
      } else {
        console.log(`${logPrefix}   - Unknown role for agent ${agent}`);
      }
    });

    console.log(`${logPrefix} Role counts:`, roleCounts);
    console.log(`${logPrefix} Total plays:`, totalPlays);

    if (totalPlays === 0) {
      console.log(`${logPrefix} No valid plays found`);
      return {
        primary_roles: ['Unknown'],
        role_percentages: {},
        insufficient_data: true,
        source
      };
    }

    // Calculate percentages for each role
    const rolePercentages = {};
    Object.entries(roleCounts).forEach(([role, count]) => {
      rolePercentages[role] = (count / totalPlays) * 100;
    });

    console.log(`${logPrefix} Role percentages:`, rolePercentages);

    // Sort roles by percentage
    const sortedRoles = Object.entries(rolePercentages)
      .sort(([, a], [, b]) => b - a);

    console.log(`${logPrefix} Sorted roles:`, sortedRoles);

    // Determine primary roles (roles with >20% usage)
    const primaryRoles = sortedRoles
      .filter(([, percentage]) => percentage >= 20)
      .map(([role]) => role);

    console.log(`${logPrefix} Primary roles:`, primaryRoles);

    // If no roles meet the threshold, use the highest percentage role
    if (primaryRoles.length === 0 && sortedRoles.length > 0) {
      primaryRoles.push(sortedRoles[0][0]);
      console.log(`${logPrefix} Using highest percentage role:`, sortedRoles[0][0]);
    }

    // If still no primary roles, mark as Unknown
    if (primaryRoles.length === 0) {
      console.log(`${logPrefix} No primary roles found`);
      return {
        primary_roles: ['Unknown'],
        role_percentages: rolePercentages,
        insufficient_data: true,
        source
      };
    }

    const result = {
      primary_roles: primaryRoles,
      role_percentages: rolePercentages,
      source
    };

    console.log(`${logPrefix} Final result:`, JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Calculate confidence level for a playstyle trait
   * @param {Object} metrics - Object containing relevant metrics
   * @returns {string} Confidence level: 'high', 'medium', or 'low'
   */
  calculateConfidence(metrics) {
    // Convert all metrics to 0-1 scale
    const normalizedMetrics = Object.entries(metrics).map(([key, value]) => {
      if (key.includes('percentage') || key.includes('pct') || key.includes('rate')) {
        return value; // Already 0-1
      }
      if (key.includes('rating')) {
        return (value - 0.5) / 1.5; // Convert 0.5-2.0 to 0-1
      }
      if (key === 'role_spread') {
        return 1 - (value / 100); // Convert spread to similarity
      }
      return value > 1 ? value / 100 : value; // Default normalization
    });

    // Calculate average confidence
    const avgConfidence = normalizedMetrics.reduce((a, b) => a + b, 0) / normalizedMetrics.length;

    // Return confidence level
    if (avgConfidence > 0.7) return 'high';
    if (avgConfidence > 0.4) return 'medium';
    return 'low';
  }

  determinePlayerDivision(tournamentHistory) {
    // Lists of tournaments by tier
    const t1Tournaments = [
      'VCT', 'Masters', 'Champions', 'LOCK//IN', 'Challengers', 'VALORANT Champions'
    ];
    
    const t2Tournaments = [
      'Challengers Ascension', 'Ascension', 'Challengers League', 'Contenders'
    ];
    
    const t3Tournaments = [
      'Game Changers', 'GC', 'Rising', 'Valorant Regional League'
    ];
    
    const t4Tournaments = [
      'Collegiate', 'University', 'College', 'Campus'
    ];

    // Check tournament history against each tier
    for (const tournament of tournamentHistory) {
      // Check for T1
      if (t1Tournaments.some(t => tournament.includes(t))) {
        return 'T1';
      }
      
      // Check for T2
      if (t2Tournaments.some(t => tournament.includes(t))) {
        return 'T2';
      }
      
      // Check for T3
      if (t3Tournaments.some(t => tournament.includes(t))) {
        return 'T3';
      }
      
      // Check for T4
      if (t4Tournaments.some(t => tournament.includes(t))) {
        return 'T4';
      }
    }

    // Default if no matching tournaments found
    return 'Unranked';
  }

  calculateRoleDistribution(agentUsage) {
    const distribution = {};
    let total = 0;

    // Count total usage
    Object.values(agentUsage).forEach(count => {
      total += count;
    });

    // Calculate distribution
    Object.entries(agentUsage).forEach(([agent, count]) => {
      const role = this.agentRoles[agent.toLowerCase()];
      if (role) {
        distribution[role] = (distribution[role] || 0) + (count / total);
      }
    });

    return distribution;
  }
}

module.exports = DataEnrichmentService; 