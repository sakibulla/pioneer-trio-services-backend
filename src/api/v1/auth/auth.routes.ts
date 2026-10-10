import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../../middleware/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
} from '../../../validators/auth.validator';
import { authRateLimiter } from '../../../middleware/rateLimiter';
import { verifyToken } from '../../../middleware/auth';

const router = Router();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), AuthController.refreshToken);
router.post('/forgot-password', authRateLimiter, validateRequest({ body: forgotPasswordSchema }), AuthController.forgotPassword);
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);

export const authRoutes = router;
