import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';
import { bootstrapAdmin } from '../src/services/authService.js';
import { getCookieOptions } from '../src/utils/jwt.js';
import { getCsrfCookieOptions } from '../src/middlewares/csrfMiddleware.js';

describe('Cross-Domain Authentication (Vercel Frontend + Render Backend) Tests', () => {
  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. CORS Origin Restriction & Verification', () => {
    it('allows configured Vercel frontend origin with credentials enabled', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://dhaantrack.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe('https://dhaantrack.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('allows Vercel preview subdomains for DhaanTrack', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://dhaantrack-preview-test.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe('https://dhaantrack-preview-test.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('blocks unauthorized origins and does NOT set allow-origin header', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://malicious-attacker-site.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('2. Cookie Settings for Cross-Site Deployment', () => {
    it('produces SameSite=None and Secure=true options when configured for production', () => {
      const options = getCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
      expect(['none', 'lax']).toContain(options.sameSite);
    });

    it('CSRF cookie options mirror production security settings', () => {
      const csrfOptions = getCsrfCookieOptions();
      expect(csrfOptions.httpOnly).toBe(false);
      expect(csrfOptions.path).toBe('/');
      expect(['none', 'lax']).toContain(csrfOptions.sameSite);
    });
  });

  describe('3. Login -> Protected API -> Token Resilience Flow', () => {
    let sessionCookie = '';
    let authToken = '';

    it('Login returns session token in response payload and sets cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'https://dhaantrack.vercel.app')
        .send({
          userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
          password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.token).toBeDefined();

      authToken = res.body.token;

      const setCookies = res.headers['set-cookie'];
      expect(setCookies).toBeDefined();
      const rawSession = setCookies.find((c) => c.startsWith('dhaantrack_session='));
      expect(rawSession).toBeDefined();
      sessionCookie = rawSession.split(';')[0];
    });

    it('Protected API GET /api/auth/me succeeds using HttpOnly cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'https://dhaantrack.vercel.app')
        .set('Cookie', [sessionCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.userId).toBe(ENV.BOOTSTRAP_ADMIN_USER_ID);
    });

    it('Protected API GET /api/auth/me succeeds using Bearer token fallback', async () => {
      // Simulating browser where third-party cross-site cookies are blocked (Safari / Incognito)
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'https://dhaantrack.vercel.app')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.userId).toBe(ENV.BOOTSTRAP_ADMIN_USER_ID);
    });

    it('Protected API rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'https://dhaantrack.vercel.app');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication required');
    });
  });
});
