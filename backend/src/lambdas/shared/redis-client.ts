/**
 * Redis Client for Caching
 * Provides caching utilities for frequently accessed data
 */

import { createClient } from 'redis';

const isLocal = process.env.STAGE === 'local';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis client
 */
const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }

  return redisClient;
};

/**
 * Get cached data
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export const getCachedData = async (key: string): Promise<any | null> => {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Redis get error:', error);
    return null; // Fail gracefully
  }
};

/**
 * Set cached data
 * @param key Cache key
 * @param value Data to cache
 * @param ttl Time to live in seconds
 */
export const setCachedData = async (
  key: string,
  value: any,
  ttl: number = 3600
): Promise<void> => {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
    // Fail gracefully - don't throw error
  }
};

/**
 * Delete cached data
 * @param key Cache key
 */
export const deleteCachedData = async (key: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

/**
 * Delete cached data by pattern
 * @param pattern Cache key pattern (e.g., 'conjugation:*')
 */
export const deleteCachedDataByPattern = async (pattern: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis delete by pattern error:', error);
  }
};

/**
 * Check if data exists in cache
 * @param key Cache key
 * @returns true if exists
 */
export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
};

/**
 * Close Redis connection (for cleanup)
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

