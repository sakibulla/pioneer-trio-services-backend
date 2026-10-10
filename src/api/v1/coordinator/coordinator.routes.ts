import { Router } from 'express';
import { CoordinatorController } from './coordinator.controller';
import { verifyToken } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(verifyToken);
router.use(requireRole([UserRole.ADMIN, UserRole.COORDINATOR]));

router.get('/dashboard', CoordinatorController.getDashboard);
router.get('/cases/pending-qc', CoordinatorController.getPendingQCQueue);
router.get('/workload/export', CoordinatorController.exportWorkloadCSV);

export const coordinatorRoutes = router;
