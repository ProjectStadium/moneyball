const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

class DataEnrichmentService {
  constructor() {
    this.teamsData = new Map();
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
      'harbor': 'Controller',
      'omen': 'Controller',
      'viper': 'Controller',
      'breach': 'Initiator',
      'fade': 'Initiator',
      'gekko': 'Initiator',
      'kayo': 'Initiator',
      'skye': 'Initiator',
      'sova': 'Initiator',
      'chamber': 'Sentinel',
      'cypher': 'Sentinel',
      'deadlock': 'Sentinel',
      'killjoy': 'Sentinel',
      'sage': 'Sentinel',
      'jett': 'Duelist',
      'neon': 'Duelist',
      'phoenix': 'Duelist',
      'raze': 'Duelist',
      'reyna': 'Duelist',
      'yoru': 'Duelist',
      'iso': 'Duelist'
    };
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

  determinePlaystylesFromAgents(agentUsage) {
    // Calculate total plays and role distribution
    let totalPlays = 0;
    const roleCounts = {
      'Duelist': 0,
      'Controller': 0,
      'Initiator': 0,
      'Sentinel': 0
    };

    // Count plays by role
    Object.entries(agentUsage).forEach(([agent, data]) => {
      const role = this.agentRoles[agent] || 'Unknown';
      if (role !== 'Unknown') {
        roleCounts[role] += data.playCount;
      }
      totalPlays += data.playCount;
    });

    if (totalPlays === 0) return null;

    // Calculate percentages
    const rolePercentages = {};
    Object.entries(roleCounts).forEach(([role, count]) => {
      rolePercentages[role] = Math.round((count / totalPlays) * 100);
    });

    // Determine primary and secondary playstyles
    let playstyles = Object.entries(rolePercentages)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, percentage]) => percentage > 20)
      .map(([role, percentage]) => `${role} (${percentage}%)`);

    // Determine special playstyle traits
    const traits = [];
    
    // Check for IGLs (common for Controller mains)
    if (rolePercentages['Controller'] > 40) {
      traits.push('Potential IGL');
    }
    
    // Check for support players (Initiator/Sentinel focus)
    if (rolePercentages['Initiator'] + rolePercentages['Sentinel'] > 60) {
      traits.push('Support-oriented');
    }
    
    // Check for entry fraggers (Duelist-heavy)
    if (rolePercentages['Duelist'] > 50) {
      traits.push('Entry Fragger');
    }
    
    // Check for flex players (balanced role distribution)
    const roleSpread = Math.max(...Object.values(rolePercentages)) - Math.min(...Object.values(rolePercentages));
    if (roleSpread < 30 && Object.values(rolePercentages).every(pct => pct > 15)) {
      traits.push('Flex Player');
    }

    // Combine playstyles and traits
    return {
      primary_roles: playstyles,
      traits: traits,
      role_percentages: rolePercentages
    };
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

module.exports = new DataEnrichmentService(); 