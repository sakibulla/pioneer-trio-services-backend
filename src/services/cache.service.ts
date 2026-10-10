import { redis } from '../config/redis';
import { logger } from '../config/logger';

export class CacheService {
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      logger.warn(`Redis get failed for key "${key}"`, { error: err.message });
      return null;
    }
  }

  public static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err: any) {
      logger.warn(`Redis set failed for key "${key}"`, { error: err.message });
    }
  }

  public static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err: any) {
      logger.warn(`Redis del failed for key "${key}"`, { error: err.message });
    }
  }

  public static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err: any) {
      logger.warn(`Redis invalidatePattern failed for "${pattern}"`, { error: err.message });
    }
  }

  public static async flush(): Promise<void> {
    try {
      await redis.flushdb();
    } catch (err: any) {
      logger.warn('Redis flushdb failed', { error: err.message });
    }
  }
}
