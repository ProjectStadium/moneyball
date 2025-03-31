const NodeCache = require('node-cache');

// Create a new cache instance
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour default TTL
  checkperiod: 600 // Check for expired keys every 10 minutes
});

// Cache durations in seconds
const durations = {
  SHORT: 300,        // 5 minutes
  MEDIUM: 3600,      // 1 hour
  LONG: 86400,       // 24 hours
  VERY_LONG: 604800  // 1 week
};

/**
 * Get a value from cache
 */
async function get(key) {
  return cache.get(key);
}

/**
 * Set a value in cache
 */
async function set(key, value, ttl = durations.MEDIUM) {
  return cache.set(key, value, ttl);
}

/**
 * Delete a value from cache
 */
async function del(key) {
  return cache.del(key);
}

/**
 * Clear all cache
 */
async function clear() {
  return cache.flushAll();
}

/**
 * Get cache stats
 */
function getStats() {
  return cache.getStats();
}

/**
 * Generate cache key for player search
 */
function getPlayerSearchKey(playerName) {
  return `player_search:${playerName.toLowerCase()}`;
}

/**
 * Generate cache key for player data
 */
function getPlayerDataKey(playerId) {
  return `player_data:${playerId}`;
}

/**
 * Generate cache key for tournament data
 */
function getTournamentDataKey(tournamentId) {
  return `tournament_data:${tournamentId}`;
}

module.exports = {
  get,
  set,
  del,
  clear,
  getStats,
  durations,
  getPlayerSearchKey,
  getPlayerDataKey,
  getTournamentDataKey
}; 