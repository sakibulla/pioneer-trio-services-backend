import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_TEST_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  // File Encryption
  ENCRYPTION_MASTER_KEY: z.string().min(32, 'ENCRYPTION_MASTER_KEY must be a 32-byte (64 hex char) key or string').default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // Object Storage
  STORAGE_PROVIDER: z.enum(['minio', 's3', 'local', 'disabled']).default('minio'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_BUCKET_DOCUMENTS: z.string().default('pioneer-documents'),
  S3_BUCKET_PHOTOS: z.string().default('pioneer-photos'),
  S3_FORCE_PATH_STYLE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),

  // Email — Resend API (production/Render) takes priority over SMTP (local dev)
  // Render blocks all outbound SMTP ports; use Resend for production
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_ADDRESS: z.string().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Pioneer Trio Services <noreply@pioneertrioservices.com>'),
  IMMIGRATION_COORDINATOR_EMAIL: z.string().default('immigration@pioneertrioservices.com'),
  MATRIMONIAL_MATCHMAKER_EMAIL: z.string().default('matrimonial@pioneertrioservices.com'),
  ADMIN_EMAIL: z.string().default('admin@pioneertrioservices.com'),

  // Sentry & Observability
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(100),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().default(900000),

  // Frontend URL (used for generating password reset links in emails)
  FRONTEND_URL: z.string().default('https://pioneertrioservices.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  // In non-test environments throw error, fallback safely in tests
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Invalid environment configuration');
  }
}

export const env = parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>);
