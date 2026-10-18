import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../../middleware/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleTokenSchema,
} from '../../../validators/auth.validator';
import { verifyToken } from '../../../middleware/auth';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post('/google', validateRequest({ body: googleTokenSchema }), AuthController.googleLogin);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), AuthController.refreshToken);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), AuthController.forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), AuthController.resetPassword);
router.get('/validate-reset-token', AuthController.validateResetToken);
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);

export const authRoutes = router;
