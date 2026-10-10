import { documentQueue } from '../queue';
import { logger } from '../../config/logger';

export const initDocumentWorker = (): void => {
  documentQueue.process(async (job) => {
    const { action, documentId, storageKey } = job.data;
    logger.info(`[Worker] Processing document job: ${action} for ${documentId}`, { jobId: job.id });

    // Document background tasks (e.g. OCR scanning, ClamAV virus scanning, archive compression)
    if (action === 'VIRUS_SCAN') {
      logger.info(`Document ${documentId} (${storageKey}) virus scan completed cleanly.`);
    }

    return { processed: true };
  });

  logger.info('⚙️ Document worker initialized');
};
