const axios = require('axios');
const cache = require('./cache.service');
const dns = require('dns');

// Configure DNS to use Google's DNS server
dns.setServers(['8.8.8.8', '8.8.4.4']);

class RiotService {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY;
    if (!this.apiKey) {
      throw new Error('RIOT_API_KEY environment variable is required');
    }

    this.baseUrl = 'https://172.64.146.28/valorant';
    this.headers = {
      'X-Riot-Token': this.apiKey,
      'Accept': 'application/json',
      'Host': 'americas.api.riotgames.com'
    };

    // Rate limiting configuration
    this.shortTermLimit = {
      requests: 20,
      window: 1000, // 1 second in ms
      current: 0,
      resetTime: Date.now()
    };

    this.longTermLimit = {
      requests: 100,
      window: 120000, // 2 minutes in ms
      current: 0,
      resetTime: Date.now()
    };

    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Reset rate limit counters if the window has passed
   */
  resetLimitsIfNeeded() {
    const now = Date.now();

    // Reset short-term limit
    if (now >= this.shortTermLimit.resetTime + this.shortTermLimit.window) {
      this.shortTermLimit.current = 0;
      this.shortTermLimit.resetTime = now;
    }

    // Reset long-term limit
    if (now >= this.longTermLimit.resetTime + this.longTermLimit.window) {
      this.longTermLimit.current = 0;
      this.longTermLimit.resetTime = now;
    }
  }

  /**
   * Check if we can make a request within rate limits
   */
  canMakeRequest() {
    this.resetLimitsIfNeeded();
    return (
      this.shortTermLimit.current < this.shortTermLimit.requests &&
      this.longTermLimit.current < this.longTermLimit.requests
    );
  }

  /**
   * Calculate delay needed before next request
   */
  getDelayForNextRequest() {
    const now = Date.now();
    let delay = 0;

    if (this.shortTermLimit.current >= this.shortTermLimit.requests) {
      delay = Math.max(delay, this.shortTermLimit.resetTime + this.shortTermLimit.window - now);
    }

    if (this.longTermLimit.current >= this.longTermLimit.requests) {
      delay = Math.max(delay, this.longTermLimit.resetTime + this.longTermLimit.window - now);
    }

    return delay;
  }

  /**
   * Process the request queue
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (!this.canMakeRequest()) {
        const delay = this.getDelayForNextRequest();
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const { config, resolve, reject } = this.requestQueue.shift();
      
      try {
        this.shortTermLimit.current++;
        this.longTermLimit.current++;
        
        const response = await axios(config);
        resolve(response.data);
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limit hit, add request back to queue
          this.requestQueue.unshift({ config, resolve, reject });
          const retryAfter = parseInt(error.response.headers['retry-after']) * 1000 || 5000;
          await new Promise(r => setTimeout(r, retryAfter));
        } else {
          reject(error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Make a request to the Riot API with rate limiting
   */
  async makeRequest(endpoint, params = {}) {
    const config = {
      url: `${this.baseUrl}${endpoint}`,
      method: 'get',
      params,
      headers: this.headers,
      // Add DNS configuration to axios request
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, options, (err, address, family) => {
          if (err) {
            console.error('DNS lookup error:', err);
            callback(err);
            return;
          }
          callback(null, address, family);
        });
      }
    };

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ config, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Get player account by name and tag
   */
  async getAccountByName(name, tag) {
    try {
      const cacheKey = `riot:account:${name}:${tag}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const data = await this.makeRequest('/riot/account/v1/accounts/by-riot-id', {
        name,
        tag
      });

      await cache.set(cacheKey, data, cache.durations.MEDIUM);
      return data;
    } catch (error) {
      console.error(`Error getting account for ${name}#${tag}:`, error);
      throw error;
    }
  }

  /**
   * Get player match history with tournament filtering
   */
  async getTournamentMatches(puuid, tournamentName = null, size = 5) {
    try {
      const cacheKey = `riot:tournament:${puuid}:${tournamentName || 'all'}:${size}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Get match history
      const matchIds = await this.makeRequest('/match/v3/matches/by-puuid', {
        puuid,
        size: 20 // Get more matches to filter for tournament ones
      });

      // Get match details for each match
      const matches = await Promise.all(
        matchIds.map(matchId => this.getMatchDetails(matchId))
      );

      // Filter matches for the specific tournament if provided
      let tournamentMatches = matches;
      if (tournamentName) {
        tournamentMatches = matches.filter(match => 
          match.info.tournamentName?.toLowerCase().includes(tournamentName.toLowerCase())
        );
      }

      // Take the most recent matches up to the size limit
      tournamentMatches = tournamentMatches.slice(0, size);

      await cache.set(cacheKey, tournamentMatches, cache.durations.SHORT);
      return tournamentMatches;
    } catch (error) {
      console.error(`Error getting tournament matches for ${puuid}:`, error);
      throw error;
    }
  }

  /**
   * Get match details by ID
   */
  async getMatchDetails(matchId) {
    try {
      const cacheKey = `riot:match:${matchId}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const data = await this.makeRequest(`/match/v3/matches/${matchId}`);

      await cache.set(cacheKey, data, cache.durations.SHORT);
      return data;
    } catch (error) {
      console.error(`Error getting match details for ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Extract utility usage data from match details
   */
  extractUtilityData(matchDetails, puuid) {
    const player = matchDetails.info.players.find(p => p.puuid === puuid);
    if (!player) return null;

    const agent = player.characterId;
    const stats = player.stats;

    // Define utility usage based on agent type
    let utilityData = {
      smokes: 0,
      flashes: 0,
      recon: 0,
      traps: 0,
      postPlantKills: 0,
      flashAssists: 0,
      clutches: 0,
      // Success rates
      smokeSuccessRate: 0,
      flashSuccessRate: 0,
      trapSuccessRate: 0,
      // Additional metrics
      smokeKills: 0,
      flashKills: 0,
      trapKills: 0,
      smokesUsed: 0,
      flashesUsed: 0,
      trapsUsed: 0
    };

    // Extract utility usage based on agent type
    switch (agent) {
      case 'Controller': // Brimstone, Omen, Viper, Astra
        utilityData.smokes = stats.ability1Casts || 0;
        utilityData.smokesUsed = stats.ability1Casts || 0;
        utilityData.smokeKills = stats.smokeKills || 0;
        utilityData.smokeSuccessRate = utilityData.smokesUsed > 0 
          ? (utilityData.smokeKills / utilityData.smokesUsed) * 100 
          : 0;
        break;
      case 'Initiator': // Sova, Breach, Skye, KAY/O, Fade
        utilityData.recon = stats.ability2Casts || 0;
        utilityData.flashes = stats.ability1Casts || 0;
        utilityData.flashesUsed = stats.ability1Casts || 0;
        utilityData.flashKills = stats.flashKills || 0;
        utilityData.flashSuccessRate = utilityData.flashesUsed > 0 
          ? (utilityData.flashKills / utilityData.flashesUsed) * 100 
          : 0;
        break;
      case 'Sentinel': // Cypher, Killjoy, Chamber
        utilityData.traps = stats.ability1Casts || 0;
        utilityData.trapsUsed = stats.ability1Casts || 0;
        utilityData.trapKills = stats.trapKills || 0;
        utilityData.trapSuccessRate = utilityData.trapsUsed > 0 
          ? (utilityData.trapKills / utilityData.trapsUsed) * 100 
          : 0;
        break;
    }

    // Extract additional stats
    utilityData.postPlantKills = stats.postPlantKills || 0;
    utilityData.flashAssists = stats.flashAssists || 0;
    utilityData.clutches = stats.clutches || 0;

    return utilityData;
  }
}

module.exports = RiotService; 