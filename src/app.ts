import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { correlationIdMiddleware } from './middleware/correlationId';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { v1Router } from './api/v1';
import { healthRoutes } from './api/v1/health/health.routes';
import { metricsRoutes, httpRequestDurationMicroseconds, httpRequestsTotal } from './api/v1/metrics/metrics.routes';
import { bullBoardRouter } from './jobs/bullBoard';
import { verifyToken } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import { UserRole } from '@prisma/client';

export const createApp = (): Application => {
  const app = express();

  // 1. Initialize Sentry (if DSN provided)
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  // 2. Security Headers & CORS
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked request from origin ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-request-id'],
    })
  );

  // 3. Compression & Body Parsers
  app.use(compression());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // 4. Request Correlation ID & Telemetry
  app.use(correlationIdMiddleware);

  // Prometheus Metrics Tracking Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      const route = req.route ? req.route.path : req.path;
      httpRequestDurationMicroseconds.observe(
        { method: req.method, route, status_code: res.statusCode },
        durationInSeconds
      );
      httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Morgan HTTP Access Logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      morgan(':method :url :status :res[content-length] - :response-time ms [CID: :req[x-correlation-id]]')
    );
  }

  // 5. Root Health, Metrics & Rate Limiting
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Pioneer Trio Services API',
      version: '1.0.0',
      status: 'active',
      documentation: `http://localhost:${env.PORT}${env.API_PREFIX}/docs`,
      endpoints: {
        health: `http://localhost:${env.PORT}/health`,
        metrics: `http://localhost:${env.PORT}/metrics`,
        api_v1: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        swagger_docs: `http://localhost:${env.PORT}${env.API_PREFIX}/docs`,
      },
    });
  });

  app.use('/health', healthRoutes);
  app.use('/metrics', metricsRoutes);

  // Global Rate Limiter
  app.use(globalRateLimiter);

  // 6. Bull Board Admin Queue Monitoring Dashboard (Protected by ADMIN role in production)
  if (env.NODE_ENV === 'development') {
    app.use('/admin/queues', bullBoardRouter);
  } else {
    app.use('/admin/queues', verifyToken, requireRole([UserRole.ADMIN]), bullBoardRouter);
  }

  // 7. Mount API v1
  app.use(env.API_PREFIX, v1Router);

  // 8. Error Handling & 404
  if (env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
