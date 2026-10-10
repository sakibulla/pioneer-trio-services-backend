import request from 'supertest';
import { createApp } from '../../src/app';

describe('Authentication API Endpoint Tests', () => {
  const app = createApp();

  it('POST /api/v1/auth/register - should reject invalid registration schemas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email-string',
        password: '123',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/v1/auth/login - should return 422 if credentials format is incomplete', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
