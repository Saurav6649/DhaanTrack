import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';

describe('Express Trust Proxy & Rate Limiter Configuration Tests', () => {
  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. Express application has trust proxy configured to 1 (or integer 1)', () => {
    const trustProxySetting = app.get('trust proxy');
    expect(trustProxySetting).toBeDefined();
    expect([1, '1']).toContain(trustProxySetting);
  });

  it('2. Request with X-Forwarded-For does NOT trigger ERR_ERL_UNEXPECTED_X_FORWARDED_FOR', async () => {
    // When deployed on Render, Render sets X-Forwarded-For
    const res = await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', '203.0.113.195');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toContain('DhaanTrack');
  });

  it('3. Standalone /health endpoint responds with 200 for cloud monitoring', async () => {
    const res = await request(app)
      .get('/health')
      .set('X-Forwarded-For', '198.51.100.25');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('4. Rate limited route processes requests with X-Forwarded-For header cleanly', async () => {
    // Request an actual rate-limited API endpoint with X-Forwarded-For
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('X-Forwarded-For', '203.0.113.50');

    // Should return 401 unauthorized (since unauthenticated) without crashing with rate-limit validation error
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
