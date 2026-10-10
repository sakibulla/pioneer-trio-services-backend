import { Router } from 'express';
import { AdminController } from './admin.controller';
import { verifyToken } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { validateRequest } from '../../../middleware/validation';
import { createUserSchema } from '../../../validators/contact.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(verifyToken);
router.use(requireRole([UserRole.ADMIN]));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.listUsers);
router.post('/users', validateRequest({ body: createUserSchema }), AdminController.createUser);
router.get('/declined-files', AdminController.getDeclinedFiles);

export const adminRoutes = router;
