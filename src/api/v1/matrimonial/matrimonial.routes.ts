import { Router } from 'express';
import { MatrimonialController } from './matrimonial.controller';
import { verifyToken, optionalAuth } from '../../../middleware/auth';
import { requireRole, requireProfileOwnership } from '../../../middleware/rbac';
import { validateRequest } from '../../../middleware/validation';
import {
  createMatrimonialProfileSchema,
  createInterviewRecordSchema,
  respondMatchSchema,
  declineProfileSchema,
} from '../../../validators/matrimonial.validator';
import { uploadPhoto } from '../../../middleware/upload';
import { uploadRateLimiter } from '../../../middleware/rateLimiter';
import { UserRole } from '@prisma/client';

const router = Router();

// Public Profile Intake
router.post(
  '/profiles',
  optionalAuth,
  validateRequest({ body: createMatrimonialProfileSchema }),
  MatrimonialController.submitProfile
);

// Profile Listing & Public View
router.get('/profiles', optionalAuth, MatrimonialController.listProfiles);
router.get('/profiles/:id', optionalAuth, MatrimonialController.getProfileById);

// Protected Operations
router.use(verifyToken);

// Get user's own profile
router.get('/my-profile', MatrimonialController.getMyProfile);

// Photo Upload (2-Photo limit enforced in controller and DB)
router.post(
  '/profiles/:profileId/photos',
  requireProfileOwnership,
  uploadRateLimiter,
  uploadPhoto.single('photo'),
  MatrimonialController.uploadPhoto
);

// Staff-Only Interview Records
router.post(
  '/profiles/:profileId/interview',
  requireRole([UserRole.ADMIN, UserRole.MATCHMAKER]),
  validateRequest({ body: createInterviewRecordSchema }),
  MatrimonialController.createInterviewRecord
);

// Decline Profile (Compliance)
router.post(
  '/profiles/:id/decline',
  requireRole([UserRole.ADMIN, UserRole.MATCHMAKER]),
  validateRequest({ body: declineProfileSchema }),
  MatrimonialController.declineProfile
);

// Client Match Viewing & Response
router.get('/my-matches', MatrimonialController.getMyMatches);
router.post(
  '/matches/:id/respond',
  validateRequest({ body: respondMatchSchema }),
  MatrimonialController.respondToMatch
);

export const matrimonialRoutes = router;
