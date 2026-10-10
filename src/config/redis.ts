import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    logger.warn(`Redis connection retry attempt ${times} in ${delay}ms`);
    return delay;
  },
};

export const redis = new Redis(env.REDIS_URL, redisOptions);

redis.on('connect', () => {
  logger.info('⚡ Redis connection established');
});

redis.on('ready', () => {
  logger.info('⚡ Redis is ready for commands');
});

redis.on('error', (err) => {
  logger.error('Redis encountered an error', { error: err.message });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
  } catch (err: any) {
    logger.error('Failed to connect to Redis initially', { error: err.message });
  }
};

export const checkRedisHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs?: number; error?: string }> => {
  const start = Date.now();
  try {
    const res = await redis.ping();
    const latencyMs = Date.now() - start;
    return { status: res === 'PONG' ? 'healthy' : 'unhealthy', latencyMs };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('⚡ Redis disconnected gracefully');
  } catch (err: any) {
    logger.error('Error disconnecting Redis', { error: err.message });
  }
};
