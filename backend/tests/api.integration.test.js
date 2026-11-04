import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Machine } from '../src/models/Machine.js';
import { WorkSession } from '../src/models/WorkSession.js';
import { Expense } from '../src/models/Expense.js';
import { Payment } from '../src/models/Payment.js';
import { bootstrapAdmin } from '../src/services/authService.js';
import { ENV } from '../src/config/env.js';

describe('DhaanTrack Full API Integration Tests', () => {
  let adminCookie = '';
  let adminCsrf = '';
  let operatorCookie = '';
  let operatorCsrf = '';
  let operatorUser = null;
  let testMachine = null;
  let workSessionId = '';

  beforeAll(async () => {
    // Connect to test database
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();
  }, 20000);

  afterAll(async () => {
    // Clean up test documents created during testing
    await WorkSession.deleteMany({ customerName: { $regex: /Test Customer/i } });
    await Expense.deleteMany({ note: { $regex: /Test Expense/i } });
    await User.deleteMany({ userId: { $regex: /testoperator|disableduser/i } });
    await Machine.deleteMany({ machineNumber: { $regex: /TEST-HARV/i } });
    await disconnectDB();
  });

  describe('1. Authentication & Security Tests', () => {
    it('Admin can login with valid credentials and receive HttpOnly cookie + CSRF token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
          password: ENV.BOOTSTRAP_ADMIN_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.csrfToken).toBeDefined();

      // Extract cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
      const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];

      expect(sessionCookie).toBeDefined();
      expect(csrfCookie).toBeDefined();

      adminCookie = `${sessionCookie}; ${csrfCookie}`;
      adminCsrf = csrfCookie.split('=')[1];
    });

    it('Rejects login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          userId: ENV.BOOTSTRAP_ADMIN_USER_ID,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(500); // Handled by service error -> 500 or 400
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid User ID or Password/i);
    });

    it('Rejects unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/users/combined');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Allows Admin to access /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('2. Machine & User Management Tests', () => {
    it('Admin can create a new harvester machine', async () => {
      const res = await request(app)
        .post('/api/machines')
        .set('Cookie', [adminCookie])
        .set('X-CSRF-Token', adminCsrf)
        .send({
          machineName: 'Kubota Harvester Pro',
          machineNumber: 'TEST-HARV-01',
          capacityPerHour: 1.2,
          customerHourlyRate: 2500,
          contractorHourlyRate: 1500,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.machine.machineNumber).toBe('TEST-HARV-01');
      testMachine = res.body.data.machine;
    });

    it('Admin can create an Operator user and assign the machine', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Cookie', [adminCookie])
        .set('X-CSRF-Token', adminCsrf)
        .send({
          name: 'Ramesh Operator',
          userId: 'testoperator1',
          password: 'Password@123',
          mobile: '9812345678',
          assignedMachine: testMachine._id,
          role: 'USER',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.userId).toBe('testoperator1');
      expect(res.body.data.user.assignedMachine).toBeDefined();
      operatorUser = res.body.data.user;
    });

    it('Disabled user is blocked from logging in', async () => {
      // Create disabled user
      const disabledRes = await request(app)
        .post('/api/users')
        .set('Cookie', [adminCookie])
        .set('X-CSRF-Token', adminCsrf)
        .send({
          name: 'Disabled User',
          userId: 'disableduser1',
          password: 'Password@123',
          mobile: '9812345679',
          role: 'USER',
          status: 'DISABLED',
        });

      expect(disabledRes.status).toBe(201);

      // Attempt login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'disableduser1',
          password: 'Password@123',
        });

      expect(loginRes.status).toBe(500);
      expect(loginRes.body.message).toMatch(/account has been disabled/i);
    });

    it('Operator can login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'testoperator1',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('USER');

      const cookies = res.headers['set-cookie'];
      const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
      const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
      operatorCookie = `${sessionCookie}; ${csrfCookie}`;
      operatorCsrf = csrfCookie.split('=')[1];
    });
  });

  describe('3. Role Authorization & Isolation Tests', () => {
    it('Operator is FORBIDDEN from accessing Admin Combined Users API', async () => {
      const res = await request(app)
        .get('/api/users/combined')
        .set('Cookie', [operatorCookie]);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('Operator is FORBIDDEN from accessing Admin Dashboard Analytics API', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Cookie', [operatorCookie]);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('Operator cannot change their own role or status via user update', async () => {
      const res = await request(app)
        .patch(`/api/users/${operatorUser._id}`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({ role: 'ADMIN', status: 'ACTIVE' });

      // Non-admin attempting to access user update route is blocked
      expect(res.status).toBe(403);
    });
  });

  describe('4. Work Session & Persistent Timer Tests', () => {
    it('Operator can create a new work session with automatic machine attachment', async () => {
      const res = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Test Customer Farmer',
          customerMobile: '9876543211',
          fieldLocation: 'North Paddy Sector 4',
          fieldAreaKatha: 32, // 1 Acre
          notes: 'Standard harvesting task',
        });

      expect(res.status).toBe(201);
      const session = res.body.data.workSession;
      expect(session.customerName).toBe('Test Customer Farmer');
      expect(session.status).toBe('PENDING');
      expect(session.customerRateSnapshot).toBe(2500);
      workSessionId = session._id;
    });

    it('Operator can START work session', async () => {
      const res = await request(app)
        .post(`/api/work-sessions/${workSessionId}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(res.status).toBe(200);
      expect(res.body.data.workSession.status).toBe('IN_PROGRESS');
      expect(res.body.data.workSession.startedAt).toBeDefined();
    });

    it('Prevents starting another session concurrently on the same machine', async () => {
      // Create a second pending work session
      const secondRes = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Test Customer 2',
          customerMobile: '9876543212',
          fieldLocation: 'East Paddy Sector 2',
        });

      expect(secondRes.status).toBe(201);
      const secondId = secondRes.body.data.workSession._id;

      // Try starting second while first is IN_PROGRESS
      const startFailRes = await request(app)
        .post(`/api/work-sessions/${secondId}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(startFailRes.status).toBe(500);
      expect(startFailRes.body.message).toMatch(/already has an active work session/i);
    });

    it('Operator can PAUSE work session', async () => {
      const res = await request(app)
        .post(`/api/work-sessions/${workSessionId}/pause`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(res.status).toBe(200);
      expect(res.body.data.workSession.status).toBe('PAUSED');
      expect(res.body.data.workSession.pauseIntervals.length).toBeGreaterThan(0);
    });

    it('Operator can RESUME work session', async () => {
      const res = await request(app)
        .post(`/api/work-sessions/${workSessionId}/resume`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(res.status).toBe(200);
      expect(res.body.data.workSession.status).toBe('IN_PROGRESS');
    });

    it('Active work session endpoint returns live elapsed duration without contractor split for operator', async () => {
      const res = await request(app)
        .get('/api/work-sessions/active')
        .set('Cookie', [operatorCookie]);

      expect(res.status).toBe(200);
      const active = res.body.data.activeSession;
      expect(active).toBeDefined();
      expect(active._id).toBe(workSessionId);
      expect(active.liveWorkedSeconds).toBeDefined();
      // Operator MUST NOT see contractor rates or contractor amounts
      expect(active.contractorRateSnapshot).toBeUndefined();
      expect(active.contractorAmount).toBeUndefined();
    });

    it('Operator can COMPLETE work session and calculate final customer amount', async () => {
      const res = await request(app)
        .post(`/api/work-sessions/${workSessionId}/complete`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(res.status).toBe(200);
      const completed = res.body.data.workSession;
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();
      expect(completed.finalAmount).toBeGreaterThanOrEqual(0);
    });

    it('Prevents duplicate completion request on completed work session', async () => {
      const res = await request(app)
        .post(`/api/work-sessions/${workSessionId}/complete`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/already completed/i);
    });
  });

  describe('5. Payments, Expenses & Balances Tests', () => {
    it('Operator can record advance payment on a work session', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          workSessionId,
          paymentType: 'ADVANCE',
          paymentMode: 'Cash',
          amount: 1000,
          notes: 'Advance in cash',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sessionSummary.advanceAmount).toBe(1000);
      expect(res.body.data.sessionSummary.totalPaidAmount).toBe(1000);
    });

    it('Operator can add an expense for their assigned machine', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          category: 'Diesel / Fuel',
          amount: 800,
          note: 'Test Expense 20L Diesel',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.expense.createdByRole).toBe('USER');
      expect(res.body.data.expense.amount).toBe(800);
    });

    it('Operator expense totals returns daily and monthly totals', async () => {
      const res = await request(app)
        .get('/api/expenses/totals')
        .set('Cookie', [operatorCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.dailyTotal).toBeGreaterThanOrEqual(800);
      expect(res.body.data.monthlyTotal).toBeGreaterThanOrEqual(800);
    });
  });

  describe('6. Admin Dashboard & Reports Tests', () => {
    it('Admin dashboard returns complete analytics and charts with Gross vs Net profit modes', async () => {
      // Test Gross Profit mode
      const grossRes = await request(app)
        .get('/api/reports/dashboard?filterType=this_month&profitMode=gross')
        .set('Cookie', [adminCookie]);

      expect(grossRes.status).toBe(200);
      expect(grossRes.body.data.cards.totalProjects).toBeGreaterThanOrEqual(1);
      expect(grossRes.body.data.cards.grossProfit).toBeDefined();
      expect(grossRes.body.data.cards.netProfit).toBeDefined();
      expect(grossRes.body.data.charts.dailyOverview).toBeDefined();
      expect(grossRes.body.data.quickSummary.completedWorks).toBeGreaterThanOrEqual(1);

      // Test Net Profit mode
      const netRes = await request(app)
        .get('/api/reports/dashboard?filterType=this_month&profitMode=net')
        .set('Cookie', [adminCookie]);

      expect(netRes.status).toBe(200);
      expect(netRes.body.data.profitMode).toBe('net');
    });

    it('Admin can export Excel report with actual data', async () => {
      const res = await request(app)
        .get('/api/reports/work/export?filterType=this_month')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.body).toBeDefined();
    });
  });
});
