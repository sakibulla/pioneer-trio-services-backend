import { Router } from 'express';
import { ImmigrationController } from './immigration.controller';
import { verifyToken } from '../../../middleware/auth';
import { requireRole, requireCaseOwnership, requireQCReviewer } from '../../../middleware/rbac';
import { validateRequest } from '../../../middleware/validation';
import {
  createAssessmentSchema,
  updateCaseStatusSchema,
  createQCReviewSchema,
  createCaseNoteSchema,
} from '../../../validators/immigration.validator';
import { uploadDocument } from '../../../middleware/upload';
import { uploadRateLimiter } from '../../../middleware/rateLimiter';
import { UserRole } from '@prisma/client';

const router = Router();

// Public / Lead Intake
router.post(
  '/assessments',
  validateRequest({ body: createAssessmentSchema }),
  ImmigrationController.submitAssessment
);

// Protected routes
router.use(verifyToken);

router.get(
  '/cases',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLIENT]),
  ImmigrationController.listCases
);

router.get(
  '/cases/:id',
  requireCaseOwnership,
  ImmigrationController.getCaseById
);

router.patch(
  '/cases/:id/status',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
  requireCaseOwnership,
  validateRequest({ body: updateCaseStatusSchema }),
  ImmigrationController.updateCaseStatus
);

// Documents
router.post(
  '/cases/:caseId/documents',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLIENT]),
  requireCaseOwnership,
  uploadRateLimiter,
  uploadDocument.single('file'),
  ImmigrationController.uploadDocument
);

router.get(
  '/documents/:id/download',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
  ImmigrationController.getDocumentDownload
);

// QC Reviews
router.post(
  '/cases/:caseId/qc-review',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR]),
  requireQCReviewer,
  validateRequest({ body: createQCReviewSchema }),
  ImmigrationController.submitQCReview
);

// Case Notes
router.post(
  '/cases/:caseId/notes',
  requireRole([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLIENT]),
  requireCaseOwnership,
  validateRequest({ body: createCaseNoteSchema }),
  ImmigrationController.addNote
);

router.get(
  '/cases/:caseId/notes',
  requireCaseOwnership,
  ImmigrationController.listNotes
);

export const immigrationRoutes = router;
