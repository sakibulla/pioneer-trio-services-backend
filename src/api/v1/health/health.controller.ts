import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../../../config/database';
import { checkRedisHealth } from '../../../config/redis';
import { checkS3Health } from '../../../config/s3';
import { HTTP_STATUS } from '../../../config/constants';

export class HealthController {
  /**
   * Fast liveness probe for Kubernetes / Load Balancers
   */
  public static liveness = (_req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };

  /**
   * Readiness probe verifying active database, redis, and storage dependencies
   */
  public static readiness = async (_req: Request, res: Response) => {
    const [db, redisStatus, s3Status] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkS3Health(),
    ]);

    const isReady = db.status === 'healthy';
    const statusCode = isReady ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: db,
        redis: redisStatus,
        objectStorage: s3Status,
      },
    });
  };

  /**
   * Detailed diagnostic system telemetry
   */
  public static details = async (_req: Request, res: Response) => {
    const memory = process.memoryUsage();
    const [db, redisStatus, s3Status] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkS3Health(),
    ]);

    res.status(HTTP_STATUS.OK).json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rssMb: (memory.rss / (1024 * 1024)).toFixed(2),
        heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(2),
      },
      dependencies: {
        database: db,
        redis: redisStatus,
        s3: s3Status,
      },
    });
  };
}
