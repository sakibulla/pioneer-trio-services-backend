import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';

// Global API rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  max: env.RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many requests from this IP. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

// Strict rate limiter for Authentication (Login / Register / Password Reset)
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

// Document / Photo Upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'File upload rate limit reached. Please try again in an hour.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

// Contact & Inquiry form submission rate limiter
export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many form submissions. Please try again shortly.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});
