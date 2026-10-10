import { cleanupQueue } from '../queue';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export const initCleanupWorker = (): void => {
  cleanupQueue.process(async (job) => {
    logger.info(`[Worker] Running maintenance cleanup job`, { jobId: job.id });

    // Unlock accounts whose lock period has passed
    const now = new Date();
    const unlocked = await prisma.user.updateMany({
      where: {
        lockedUntil: { lte: now },
        failedLoginAttempts: { gt: 0 },
      },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    if (unlocked.count > 0) {
      logger.info(`[Cleanup Worker] Unlocked ${unlocked.count} expired locked user accounts.`);
    }

    return { unlockedAccounts: unlocked.count };
  });

  // Schedule recurring cron check every 15 minutes
  try {
    cleanupQueue.add({}, { repeat: { cron: '*/15 * * * *' } });
  } catch (err: any) {
    logger.warn('Could not register Bull cleanup cron schedule', { error: err.message });
  }
  logger.info('⚙️ Cleanup worker initialized');
};
