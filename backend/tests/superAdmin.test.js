import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';
import { restoreSuperAdmin, SUPER_ADMIN_DETAILS } from '../src/scripts/restoreSuperAdmin.js';
import { User } from '../src/models/User.js';

describe('Super Admin Account & Privilege Boundary Tests', () => {
  let superAdminSessionCookie = '';
  let standardAdminCookie = '';
  let standardAdminCsrf = '';

  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    // Ensure Super Admin exists
    await restoreSuperAdmin();
  }, 20000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. restoreSuperAdmin is idempotent and does not create duplicate accounts', async () => {
    const res = await restoreSuperAdmin();
    expect(res.created).toBe(false);
    expect(res.user.userId).toBe(SUPER_ADMIN_DETAILS.userId);
    expect(res.user.email).toBe(SUPER_ADMIN_DETAILS.email);
    expect(res.user.role).toBe('SUPER_ADMIN');

    // Confirm only 1 Super Admin in database
    const count = await User.countDocuments({ role: 'SUPER_ADMIN', isDeleted: false });
    expect(count).toBe(1);
  });

  it('2. Super Admin can log in using email address', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        userId: 'superadmin@dhaantrack.com',
        password: 'SuperAdmin@Dhaan2026!Sec',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    expect(res.body.data.user.email).toBe('superadmin@dhaantrack.com');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    superAdminSessionCookie = `${sessionCookie}; ${csrfCookie}`;
  });

  it('3. Super Admin can log in using userId', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        userId: 'superadmin',
        password: 'SuperAdmin@Dhaan2026!Sec',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
  });

  it('4. Super Admin can access requireSuperAdmin protected endpoints', async () => {
    const res = await request(app)
      .get('/api/auth/superadmin/verify')
      .set('Cookie', [superAdminSessionCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('SUPER_ADMIN');
  });

  it('5. Standard Admin receives 403 Forbidden on requireSuperAdmin endpoints', async () => {
    // Login as standard admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
        password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('ADMIN');

    const cookies = loginRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    standardAdminCookie = `${sessionCookie}; ${csrfCookie}`;
    standardAdminCsrf = csrfCookie.split('=')[1];

    // Attempt to access Super Admin restricted endpoint
    const forbiddenRes = await request(app)
      .get('/api/auth/superadmin/verify')
      .set('Cookie', [standardAdminCookie]);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);
    expect(forbiddenRes.body.message).toMatch(/insufficient permissions|forbidden/i);
  });

  it('6. Standard Admin cannot delete or disable Super Admin account', async () => {
    const superAdminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    expect(superAdminUser).toBeDefined();

    // Attempt to delete Super Admin by standard Admin
    const deleteRes = await request(app)
      .delete(`/api/users/${superAdminUser._id}`)
      .set('Cookie', [standardAdminCookie])
      .set('X-CSRF-Token', standardAdminCsrf);

    expect([400, 403, 500]).toContain(deleteRes.status);
    expect(deleteRes.body.message).toMatch(/cannot be deleted/i);
  });
});
