import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/appError';
import { emailQueue } from '../jobs/queue';
import { env } from '../config/env';
import { AuditService } from './audit.service';
import { AuthUserPayload } from '../types';

export class AuthService {
  /**
   * Register new client or staff user
   */
  public static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
  }, clientIp?: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('A user account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || UserRole.CLIENT,
      },
    });

    const userPayload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    // Queue Welcome Email
    emailQueue.add({
      type: 'WELCOME_EMAIL',
      payload: { to: user.email, name: `${user.firstName} ${user.lastName}` },
    });

    await AuditService.log({
      userId: user.id,
      action: 'AUTH_REGISTER',
      resource: 'User',
      resourceId: user.id,
      ipAddress: clientIp,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * User login with 5-attempt account lockout mechanism
   */
  public static async login(email: string, password: string, clientIp?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.active) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Account locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minutes.`
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      await AuditService.log({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        resource: 'User',
        resourceId: user.id,
        details: { attempts },
        ipAddress: clientIp,
        userAgent,
      });

      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const userPayload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    await AuditService.log({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user.id,
      ipAddress: clientIp,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate access and refresh tokens
   */
  public static async refreshSession(token: string) {
    const payload = await verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    // Revoke previous refresh token JTI
    if (payload.jti) {
      await revokeRefreshToken(user.id, payload.jti);
    }

    const userPayload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = await generateRefreshToken(userPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by revoking refresh token
   */
  public static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload.jti) {
          await revokeRefreshToken(userId, payload.jti);
        }
      } catch {
        // Safe fallback
      }
    }
    await AuditService.log({
      userId,
      action: 'AUTH_LOGOUT',
      resource: 'User',
      resourceId: userId,
    });
  }

  /**
   * Forgot password request
   */
  public static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't leak user existence
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in audit or cache with 1-hour expiration
    const resetUrl = `https://pioneertrioservices.com/reset-password?token=${resetTokenHash}&email=${encodeURIComponent(user.email)}`;

    emailQueue.add({
      type: 'PASSWORD_RESET',
      payload: { to: user.email, resetUrl },
    });
  }
}
