import { Router } from 'express';
import { ContactController } from './contact.controller';
import { validateRequest } from '../../../middleware/validation';
import { contactInquirySchema, newsletterSubscribeSchema } from '../../../validators/contact.validator';
import { contactRateLimiter } from '../../../middleware/rateLimiter';

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

export const contactRoutes = router;
