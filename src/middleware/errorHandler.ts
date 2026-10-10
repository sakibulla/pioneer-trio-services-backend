import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/response';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { HTTP_STATUS } from '../config/constants';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Prisma Unique Constraint Violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = HTTP_STATUS.CONFLICT;
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : err.meta?.target;
      message = `Duplicate record conflict on unique field: ${target || 'resource'}`;
    } else if (err.code === 'P2025') {
      statusCode = HTTP_STATUS.NOT_FOUND;
      message = 'The requested record was not found in the database';
    } else if (err.code === 'P2003') {
      statusCode = HTTP_STATUS.BAD_REQUEST;
      message = 'Foreign key constraint violation on related entity';
    }
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size limit';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected form field for file upload: ${err.field}`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // JWT / Auth errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Malformed or invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Your session has expired. Please sign in again.';
  }

  // Log Error (with correlation ID)
  const isServerFault = statusCode >= 500;
  if (isServerFault) {
    logger.error(`[Server Error] ${req.method} ${req.originalUrl} - ${message}`, {
      correlationId: req.correlationId,
      stack: err.stack,
      body: req.body,
      user: req.user,
    });

    if (env.SENTRY_DSN) {
      Sentry.captureException(err, {
        extra: {
          correlationId: req.correlationId,
          url: req.originalUrl,
          method: req.method,
          user: req.user,
        },
      });
    }
  } else {
    logger.warn(`[Client Warning] ${req.method} ${req.originalUrl} (${statusCode}) - ${message}`, {
      correlationId: req.correlationId,
      errors,
    });
  }

  ApiResponse.error(res, message, statusCode, errors);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found on Pioneer Trio Backend API`,
    HTTP_STATUS.NOT_FOUND
  );
};
