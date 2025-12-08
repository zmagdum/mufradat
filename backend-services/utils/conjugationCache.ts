import { VerbConjugation, ConjugationForms } from '../types/content';

// Mock Redis client interface for now - in production this would use actual Redis
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Mock implementation - in production, this would be replaced with actual Redis client
class MockRedisClient implements RedisClient {
  private cache = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export class ConjugationCacheService {
  private redis: RedisClient;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly KEY_PREFIX = 'conjugation:';

  constructor(redisClient?: RedisClient) {
    // In production, this would be initialized with actual Redis client
    this.redis = redisClient || new MockRedisClient();
  }

  /**
   * Get conjugation from cache
   */
  async getConjugation(verbId: string): Promise<VerbConjugation | null> {
    try {
      const key = this.getConjugationKey(verbId);
      const cached = await this.redis.get(key);
      
      if (cached) {
        return JSON.parse(cached) as VerbConjugation;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting conjugation from cache:', error);
      return null;
    }
  }

  /**
   * Cache conjugation data
   */
  async cacheConjugation(conjugation: VerbConjugation): Promise<void> {
    try {
      const key = this.getConjugationKey(conjugation.verbId);
      const value = JSON.stringify(conjugation);
      
      await this.redis.set(key, value, { EX: this.CACHE_TTL });
    } catch (error) {
      console.error('Error caching conjugation:', error);
      // Don't throw error - caching failure shouldn't break the application
    }
  }

  /**
   * Get generated conjugation forms from cache
   */
  async getGeneratedConjugations(rootForm: string, pattern: string): Promise<ConjugationForms | null> {
    try {
      const key = this.getGeneratedKey(rootForm, pattern);
      const cached = await this.redis.get(key);
      
      if (cached) {
        return JSON.parse(cached) as ConjugationForms;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting generated conjugations from cache:', error);
      return null;
    }
  }

  /**
   * Cache generated conjugation forms
   */
  async cacheGeneratedConjugations(rootForm: string, pattern: string, conjugations: ConjugationForms): Promise<void> {
    try {
      const key = this.getGeneratedKey(rootForm, pattern);
      const value = JSON.stringify(conjugations);
      
      // Cache generated conjugations for longer since they don't change
      await this.redis.set(key, value, { EX: this.CACHE_TTL * 24 }); // 24 hours
    } catch (error) {
      console.error('Error caching generated conjugations:', error);
    }
  }

  /**
   * Invalidate conjugation cache
   */
  async invalidateConjugation(verbId: string): Promise<void> {
    try {
      const key = this.getConjugationKey(verbId);
      await this.redis.del(key);
    } catch (error) {
      console.error('Error invalidating conjugation cache:', error);
    }
  }

  /**
   * Check if conjugation exists in cache
   */
  async hasConjugation(verbId: string): Promise<boolean> {
    try {
      const key = this.getConjugationKey(verbId);
      return await this.redis.exists(key);
    } catch (error) {
      console.error('Error checking conjugation cache:', error);
      return false;
    }
  }

  /**
   * Cache multiple conjugations at once
   */
  async cacheMultipleConjugations(conjugations: VerbConjugation[]): Promise<void> {
    const cachePromises = conjugations.map(conjugation => 
      this.cacheConjugation(conjugation)
    );
    
    await Promise.allSettled(cachePromises);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; size: number }> {
    // This would be implemented with actual Redis commands in production
    // For now, return mock stats
    return {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  /**
   * Warm up cache with frequently used conjugations
   */
  async warmUpCache(frequentVerbs: string[]): Promise<void> {
    // This would pre-load frequently accessed conjugations
    // Implementation would depend on the specific caching strategy
    console.log(`Warming up cache for ${frequentVerbs.length} verbs`);
  }

  /**
   * Clear all conjugation cache
   */
  async clearCache(): Promise<void> {
    // In production, this would use Redis SCAN and DEL commands
    // to remove all keys with the conjugation prefix
    console.log('Clearing conjugation cache');
  }

  private getConjugationKey(verbId: string): string {
    return `${this.KEY_PREFIX}verb:${verbId}`;
  }

  private getGeneratedKey(rootForm: string, pattern: string): string {
    // Create a normalized key for generated conjugations
    const normalizedRoot = rootForm.replace(/[َُِْ]/g, ''); // Remove diacritics
    return `${this.KEY_PREFIX}generated:${normalizedRoot}:${pattern}`;
  }
}

// Singleton instance for use across the application
export const conjugationCache = new ConjugationCacheService();