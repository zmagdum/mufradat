/**
 * Cache Manager
 * Centralized Redis caching utilities
 */

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const DEFAULT_TTL = 3600; // 1 hour

/**
 * Get or create Redis client
 */
const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
};

/**
 * Get value from cache
 */
export const get = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in cache
 */
export const set = async (
  key: string,
  value: any,
  ttl: number = DEFAULT_TTL
): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete value from cache
 */
export const del = async (key: string): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple keys by pattern
 */
export const delPattern = async (pattern: string): Promise<number> => {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * Check if key exists
 */
export const exists = async (key: string): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result > 0;
  } catch (error) {
    console.error(`Cache exists error for key ${key}:`, error);
    return false;
  }
};

/**
 * Get or compute value with caching
 */
export const getOrCompute = async <T>(
  key: string,
  computeFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> => {
  // Try to get from cache
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await computeFn();

  // Store in cache
  await set(key, value, ttl);

  return value;
};

/**
 * Invalidate cache for a user
 */
export const invalidateUserCache = async (userId: string): Promise<number> => {
  return delPattern(`user:${userId}:*`);
};

/**
 * Invalidate cache for vocabulary
 */
export const invalidateVocabularyCache = async (): Promise<number> => {
  return delPattern('vocabulary:*');
};

/**
 * Close Redis connection
 */
export const closeConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

