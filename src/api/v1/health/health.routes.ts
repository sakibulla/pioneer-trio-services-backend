import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

router.get('/', HealthController.liveness);
router.get('/ready', HealthController.readiness);
router.get('/details', HealthController.details);

export const healthRoutes = router;
