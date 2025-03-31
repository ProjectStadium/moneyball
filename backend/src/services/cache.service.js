const Redis = require('ioredis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.durations = {
      SHORT: 300,    // 5 minutes
      MEDIUM: 3600,  // 1 hour
      LONG: 86400,   // 24 hours
      EXTRA_LONG: 604800  // 1 week
    };

    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.redis.on('error', (error) => {
        console.warn('Redis connection error, falling back to memory cache:', error.message);
        this.redis = null;
      });
    } catch (error) {
      console.warn('Failed to initialize Redis, using memory cache:', error.message);
      this.redis = null;
    }
  }

  /**
   * Get cached data
   */
  async get(key) {
    try {
      if (this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        const cached = this.memoryCache.get(key);
        if (!cached) return null;
        
        // Check if cache has expired
        if (cached.expiry && Date.now() > cached.expiry) {
          this.memoryCache.delete(key);
          return null;
        }
        
        return cached.value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with expiration
   */
  async set(key, data, duration = this.durations.MEDIUM) {
    try {
      if (this.redis) {
        await this.redis.setex(key, duration, JSON.stringify(data));
      } else {
        this.memoryCache.set(key, {
          value: data,
          expiry: Date.now() + (duration * 1000)
        });
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key) {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.redis) {
        await this.redis.flushall();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Generate cache key for player data
   */
  getPlayerKey(playerName) {
    return `liquipedia:player:${playerName.toLowerCase()}`;
  }

  /**
   * Generate cache key for tournament list
   */
  getTournamentListKey(limit, offset) {
    return `liquipedia:tournaments:${limit}:${offset}`;
  }

  /**
   * Generate cache key for player search
   */
  getPlayerSearchKey(query) {
    return `liquipedia:search:${query.toLowerCase()}`;
  }
}

module.exports = new CacheService(); 