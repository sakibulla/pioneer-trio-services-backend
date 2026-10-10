import { emailQueue } from '../queue';
import { emailService } from '../../services/email.service';
import { logger } from '../../config/logger';

export const initEmailWorker = (): void => {
  emailQueue.process(async (job) => {
    const { type, payload } = job.data;
    logger.info(`[Worker] Processing email job type: ${type}`, { jobId: job.id });

    switch (type) {
      case 'WELCOME_EMAIL':
        await emailService.sendWelcomeEmail(payload.to, payload.name);
        break;

      case 'IMMIGRATION_ASSESSMENT_RECEIVED':
        await emailService.sendImmigrationAssessmentReceived(
          payload.to,
          payload.name,
          payload.caseReference,
          payload.destination
        );
        break;

      case 'COORDINATOR_NEW_CASE':
        await emailService.sendCoordinatorNewCaseNotification(
          payload.to,
          payload.coordinatorName,
          payload.clientName,
          payload.caseReference,
          payload.destination
        );
        break;

      case 'MATRIMONIAL_PROFILE_SUBMITTED':
        await emailService.sendMatrimonialProfileSubmitted(payload.to, payload.name);
        break;

      case 'MATCH_PROPOSAL_NOTIFICATION':
        await emailService.sendMatchProposalNotification(payload.to, payload.name, payload.rationale);
        break;

      case 'PASSWORD_RESET':
        await emailService.sendPasswordResetEmail(payload.to, payload.resetUrl);
        break;

      case 'GENERIC_EMAIL':
        await emailService.sendMail(payload.to, payload.subject, payload.content);
        break;

      default:
        logger.warn(`Unknown email job type: ${type}`);
    }

    return { success: true };
  });

  logger.info('⚙️ Email worker initialized and listening for jobs');
};
