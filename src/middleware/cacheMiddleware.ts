import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export const cacheRoute = (ttlSeconds: number = 300, keyPrefix?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache safe GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const prefix = keyPrefix || 'route';
    const cacheKey = `cache:${prefix}:${req.originalUrl}:${req.user?.userId || 'anon'}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.parse(cached));
        return;
      }

      res.setHeader('X-Cache-Status', 'MISS');

      // Hook into res.json to cache response body
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) => {
            logger.warn('Failed to save to Redis cache', { error: err.message });
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err: any) {
      logger.warn('Redis route cache read error, proceeding without cache', { error: err.message });
      next();
    }
  };
};

export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Invalidated ${keys.length} cache keys matching pattern: cache:${pattern}`);
    }
  } catch (err: any) {
    logger.warn('Failed to invalidate Redis cache pattern', { pattern, error: err.message });
  }
};
