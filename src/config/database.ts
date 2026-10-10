import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });

  if (env.NODE_ENV === 'development') {
    client.$on('query' as never, (e: any) => {
      logger.debug(`[Prisma Query] ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
    });
  }

  client.$on('error' as never, (e: any) => {
    logger.error(`[Prisma Error] ${e.message}`, { target: e.target });
  });

  return client;
};

export const prisma = global.prismaGlobal || createPrismaClient();

if (env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export const connectDatabase = async (retries = 2, delay = 500): Promise<void> => {
  while (retries > 0) {
    try {
      await prisma.$connect();
      logger.info('🐘 PostgreSQL Database connected successfully via Prisma');
      return;
    } catch (err: any) {
      retries -= 1;
      logger.warn(`Database connection attempt failed (${retries} retries left): ${err.message}`);
      if (retries === 0) {
        logger.warn('PostgreSQL is currently offline. API server running in ready-probe mode.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('🐘 PostgreSQL Database disconnected gracefully');
};

export const checkDatabaseHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs?: number; error?: string }> => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: 'healthy', latencyMs };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
};
