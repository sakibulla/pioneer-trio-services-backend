import { initEmailWorker } from './email.worker';
import { initDocumentWorker } from './document.worker';
import { initCleanupWorker } from './cleanup.worker';
import { logger } from '../../config/logger';

export const startWorkers = (): void => {
  try {
    initEmailWorker();
    initDocumentWorker();
    initCleanupWorker();
    logger.info('🚀 All background Bull workers started successfully');
  } catch (err: any) {
    logger.error('Failed to initialize background workers', { error: err.message });
  }
};
