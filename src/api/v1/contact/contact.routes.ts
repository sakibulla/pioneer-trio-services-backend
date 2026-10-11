import { Router } from 'express';
import { ContactController } from './contact.controller';
import { validateRequest } from '../../../middleware/validation';
import { contactInquirySchema, newsletterSubscribeSchema } from '../../../validators/contact.validator';
import { contactRateLimiter } from '../../../middleware/rateLimiter';
import { verifyToken } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
  '/general',
  contactRateLimiter,
  validateRequest({ body: contactInquirySchema }),
  ContactController.submitInquiry
);

router.post(
  '/subscribe',
  contactRateLimiter,
  validateRequest({ body: newsletterSubscribeSchema }),
  ContactController.subscribeNewsletter
);

// Admin: Get all contact submissions
router.get(
  '/submissions',
  verifyToken,
  requireRole([UserRole.ADMIN]),
  ContactController.getAllSubmissions
);

export const contactRoutes = router;
