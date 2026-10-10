import { Router, Request, Response } from 'express';
import client from 'prom-client';

const router = Router();

// Collect default Node.js runtime metrics
client.collectDefaultMetrics({ prefix: 'pioneer_' });

// Custom Prometheus Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

export const dbQueryDurationMicroseconds = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.005, 0.02, 0.05, 0.1, 0.5, 1],
});

router.get('/', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

export const metricsRoutes = router;
