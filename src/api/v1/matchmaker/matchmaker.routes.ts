import { Router } from 'express';
import { MatchmakerController } from './matchmaker.controller';
import { verifyToken } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { validateRequest } from '../../../middleware/validation';
import {
  createMatchProposalSchema,
  createMatchCheckInSchema,
} from '../../../validators/matrimonial.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(verifyToken);
router.use(requireRole([UserRole.ADMIN, UserRole.MATCHMAKER]));

router.get('/dashboard/stats', MatchmakerController.getDashboardStats);
router.post(
  '/matches',
  validateRequest({ body: createMatchProposalSchema }),
  MatchmakerController.createMatchProposal
);
router.get('/matches', MatchmakerController.listAllMatches);
router.post(
  '/matches/:matchId/checkins',
  validateRequest({ body: createMatchCheckInSchema }),
  MatchmakerController.addCheckIn
);
router.post('/profiles/:id/approve', MatchmakerController.approveProfile);
router.post('/profiles/:id/reject', MatchmakerController.rejectProfile);

export const matchmakerRoutes = router;
