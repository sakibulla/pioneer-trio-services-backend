import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeS3Buckets } from './config/s3';
import { startWorkers } from './jobs/workers';

const bootstrap = async () => {
  try {
    logger.info('🚀 Bootstrapping Pioneer Trio Services Backend API...');

    // 1. Connect to PostgreSQL via Prisma
    await connectDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Initialize S3 / MinIO storage buckets (if enabled)
    if (env.STORAGE_PROVIDER !== 'disabled') {
      await initializeS3Buckets();
    }

    // 4. Start Bull Queue Background Workers
    startWorkers();

    // 5. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`🌟 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`📖 API Documentation available at http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
      logger.info(`🩺 Health check endpoint: http://localhost:${env.PORT}/health`);
      logger.info(`📊 Prometheus metrics: http://localhost:${env.PORT}/metrics`);
      logger.info(`🚦 Queue Dashboard: http://localhost:${env.PORT}/admin/queues`);
    });

    // 6. Graceful Shutdown Handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed.');

        try {
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('Clean shutdown completed.');
          process.exit(0);
        } catch (err: any) {
          logger.error('Error during shutdown cleanup', { error: err.message });
          process.exit(1);
        }
      });

      // Force shutdown if cleanup takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded. Forcing process exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason, stack: reason?.stack });
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception thrown', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('Fatal bootstrap error. Server cannot start.', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

bootstrap();
