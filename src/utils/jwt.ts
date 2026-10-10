import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { CACHE_KEYS, CACHE_TTL } from '../config/constants';
import { AuthUserPayload, JwtTokenPayload } from '../types';

const ACCESS_SECRET: Secret = env.JWT_SECRET;
const REFRESH_SECRET: Secret = `${env.JWT_SECRET}_refresh`;

export const generateAccessToken = (user: AuthUserPayload): string => {
  const payload: JwtTokenPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRATION as any,
    issuer: 'pioneer-trio-services',
    subject: user.userId,
  };

  return jwt.sign(payload, ACCESS_SECRET, options);
};

export const generateRefreshToken = async (user: AuthUserPayload): Promise<string> => {
  const jti = uuidv4();
  const payload: JwtTokenPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRATION as any,
    issuer: 'pioneer-trio-services',
    subject: user.userId,
    jwtid: jti,
  };

  const token = jwt.sign(payload, REFRESH_SECRET, options);

  // Store refresh token JTI in Redis whitelist for fast revocation
  try {
    const key = CACHE_KEYS.REFRESH_TOKEN(user.userId, jti);
    await redis.setex(key, CACHE_TTL.SESSION, 'active');
  } catch {
    // Redis unavailable fallback: JWT verification still checks signature and expiry
  }

  return token;
};

export const verifyAccessToken = (token: string): JwtTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET, { issuer: 'pioneer-trio-services' }) as JwtTokenPayload;
};

export const verifyRefreshToken = async (token: string): Promise<JwtTokenPayload> => {
  const decoded = jwt.verify(token, REFRESH_SECRET, { issuer: 'pioneer-trio-services' }) as JwtTokenPayload;

  if (decoded.jti) {
    try {
      const key = CACHE_KEYS.REFRESH_TOKEN(decoded.userId, decoded.jti);
      const exists = await redis.get(key);
      if (!exists) {
        throw new Error('Refresh token has been revoked or expired');
      }
    } catch (err: any) {
      if (err.message.includes('revoked')) throw err;
    }
  }

  return decoded;
};

export const revokeRefreshToken = async (userId: string, jti: string): Promise<void> => {
  try {
    const key = CACHE_KEYS.REFRESH_TOKEN(userId, jti);
    await redis.del(key);
  } catch {
    // Fallback safely
  }
};
