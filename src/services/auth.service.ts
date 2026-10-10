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

    // Check if user has a password (null for Google-only accounts)
    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses Google Sign-In. Please use the Google button to log in.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
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

  /**
   * Google OAuth login — verify ID token and upsert user
   */
  public static async googleLogin(idToken: string, clientIp?: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedError('Google OAuth is not configured. Please contact support.');
    }

    const { OAuth2Client } = require('google-auth-library');

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

    // Verify the ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired Google ID token');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new UnauthorizedError('Google token missing required fields');
    }

    const { email, name, sub, given_name, family_name } = payload;
    const firstName = given_name || name?.split(' ')[0] || 'User';
    const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';

    // Upsert user: find by googleId first, then by email
    let user = await prisma.user.findUnique({
      where: { googleId: sub },
    });

    if (!user) {
      // Check if email already exists (from password registration)
      const existingByEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingByEmail) {
        // Link Google ID to existing email-based account
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: sub },
        });
      } else {
        // Create new user from Google profile
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: null,
            googleId: sub,
            firstName,
            lastName,
            role: UserRole.CLIENT,
          },
        });
      }
    }

    if (!user.active) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
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
      action: 'AUTH_GOOGLE_LOGIN',
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
}
