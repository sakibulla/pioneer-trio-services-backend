import { Request, Response } from 'express';
import { AuthService } from '../../../services/auth.service';
import { ApiResponse } from '../../../utils/response';
import { HTTP_STATUS } from '../../../config/constants';
import { asyncHandler } from '../../../utils/asyncHandler';

export class AuthController {
  public static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body, req.ip);
    ApiResponse.created(res, result, 'User registered successfully');
  });

  public static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, req.ip, req.headers['user-agent']);
    ApiResponse.success(res, result, 'Login successful');
  });

  public static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshSession(refreshToken);
    ApiResponse.success(res, result, 'Session refreshed');
  });

  public static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId || '';
    const { refreshToken } = req.body;
    await AuthService.logout(userId, refreshToken);
    ApiResponse.success(res, null, 'Logged out successfully');
  });

  public static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body.email);
    ApiResponse.success(res, null, 'If that email exists in our records, a password reset link has been dispatched.');
  });

  public static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    ApiResponse.success(res, null, 'Password reset successful. You can now log in with your new password.');
  });

  public static validateResetToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }
    await AuthService.validateResetToken(token);
    ApiResponse.success(res, null, 'Token is valid');
  });

  public static getMe = asyncHandler(async (req: Request, res: Response) => {
    ApiResponse.success(res, req.user, 'Current user profile');
  });

  public static googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const result = await AuthService.googleLogin(idToken, req.ip);
    ApiResponse.success(res, result, 'Google login successful');
  });
}
