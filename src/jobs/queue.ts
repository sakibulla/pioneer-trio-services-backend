import Queue from 'bull';
import { env } from '../config/env';
import { logger } from '../config/logger';

const redisUrl = env.REDIS_URL;

const queueOptions: Queue.QueueOptions = {
  redis: redisUrl,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
};

export const emailQueue = new Queue('pioneer:email', queueOptions);
export const documentQueue = new Queue('pioneer:document', queueOptions);
export const cleanupQueue = new Queue('pioneer:cleanup', queueOptions);

// Error listeners
[emailQueue, documentQueue, cleanupQueue].forEach((queue) => {
  queue.on('error', (error) => {
    logger.error(`Bull Queue [${queue.name}] error`, { error: error.message });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Bull Queue [${queue.name}] job ${job.id} failed`, { error: err.message, data: job.data });
  });
});
