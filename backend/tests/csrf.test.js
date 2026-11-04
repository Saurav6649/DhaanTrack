import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';
import { bootstrapAdmin } from '../src/services/authService.js';
import { Machine } from '../src/models/Machine.js';
import { CSRF_COOKIE_NAME } from '../src/middlewares/csrfMiddleware.js';

describe('CSRF Protection & Token Lifecycle Tests', () => {
  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();
  }, 60000);

  afterAll(async () => {
    await Machine.deleteMany({ machineNumber: 'CSRF-OK-99' });
    await disconnectDB();
  });

  it('1. GET /api/auth/csrf-token returns a valid token, sets cookie and response header', async () => {
    const res = await request(app).get('/api/auth/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.csrfToken).toBeDefined();
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(16);

    // Verify response header
    const headerToken = res.headers['x-csrf-token'];
    expect(headerToken).toBe(res.body.csrfToken);

    // Verify set-cookie
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const csrfCookie = setCookie.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).toContain(res.body.csrfToken);
  });

  it('2. Exempt routes (e.g. POST /api/auth/login) pass without CSRF header', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
        password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.csrfToken).toBeDefined();
    expect(res.headers['x-csrf-token']).toBeDefined();
  });

  it('3. Protected POST request without CSRF cookie or header is rejected with 403', async () => {
    // Attempting state-changing request with valid session but without CSRF header
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
        password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
      });

    const sessionCookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('dhaantrack_session='))
      .split(';')[0];

    // Request with session cookie only, NO CSRF header or cookie
    const res = await request(app)
      .post('/api/machines')
      .set('Cookie', [sessionCookie])
      .send({
        machineName: 'Test Harvester Without CSRF',
        machineNumber: 'NO-CSRF-01',
        capacityPerHour: 1.0,
        customerHourlyRate: 2500,
        contractorHourlyRate: 1500,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('CSRF_INVALID');
    expect(res.body.message).toContain('CSRF token');
  });

  it('4. Protected POST request with mismatched CSRF token is rejected with 403', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
        password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
      });

    const sessionCookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('dhaantrack_session='))
      .split(';')[0];
    const csrfCookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('dhaantrack_csrf='))
      .split(';')[0];

    const res = await request(app)
      .post('/api/machines')
      .set('Cookie', [`${sessionCookie}; ${csrfCookie}`])
      .set('X-CSRF-Token', 'invalid_tampered_token_value_12345')
      .send({
        machineName: 'Test Harvester Invalid CSRF',
        machineNumber: 'BAD-CSRF-01',
        capacityPerHour: 1.0,
        customerHourlyRate: 2500,
        contractorHourlyRate: 1500,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('CSRF_INVALID');
  });

  it('5. Protected POST request with valid CSRF cookie and matching header succeeds', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
        password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
      });

    const sessionCookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('dhaantrack_session='))
      .split(';')[0];
    const csrfCookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('dhaantrack_csrf='))
      .split(';')[0];
    const validCsrfToken = csrfCookie.split('=')[1];

    const res = await request(app)
      .post('/api/machines')
      .set('Cookie', [`${sessionCookie}; ${csrfCookie}`])
      .set('X-CSRF-Token', validCsrfToken)
      .send({
        machineName: 'CSRF Verified Harvester',
        machineNumber: 'CSRF-OK-99',
        capacityPerHour: 1.0,
        customerHourlyRate: 2500,
        contractorHourlyRate: 1500,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.machine.machineNumber).toBe('CSRF-OK-99');
  });
});
