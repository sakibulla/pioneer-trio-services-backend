import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health Check API Integration Tests', () => {
  const app = createApp();

  it('GET /health - should return 200 OK for liveness check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeDefined();
  });

  it('GET /api/v1/health - should return 200 OK from v1 route', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /metrics - should return prometheus formatted metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('pioneer_');
  });
});
