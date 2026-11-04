import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Machine } from '../src/models/Machine.js';
import { WorkSession } from '../src/models/WorkSession.js';
import { Payment } from '../src/models/Payment.js';
import { bootstrapAdmin } from '../src/services/authService.js';
import { ENV } from '../src/config/env.js';
import { formatHoursAndMinutes } from '../src/utils/calculator.js';

describe('User Panel Enhancements & Bug Fixes Integration Tests', () => {
  let adminCookie = '';
  let adminCsrf = '';
  let operatorCookie = '';
  let operatorCsrf = '';

  let operatorUser = null;
  let testMachine = null;

  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();

    await User.deleteMany({ userId: 'enh_op' });
    await Machine.deleteMany({ machineNumber: 'ENH-HARV-01' });
    await WorkSession.deleteMany({ customerName: { $regex: /^Enh Farmer/ } });

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: ENV.BOOTSTRAP_ADMIN_USER_ID, password: ENV.BOOTSTRAP_ADMIN_PASSWORD });
    const cookies = adminRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    adminCookie = `${sessionCookie}; ${csrfCookie}`;
    adminCsrf = csrfCookie.split('=')[1];

    // Create Operator User
    const uRes = await request(app)
      .post('/api/users')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Enhancement Operator',
        userId: 'enh_op',
        password: 'Password@123',
        mobile: '9777777777',
        role: 'USER',
      });
    operatorUser = uRes.body.data.user;

    // Create Machine with default rate 2500 and capacity 1.0 Acre/hr
    const mRes = await request(app)
      .post('/api/machines')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        machineName: 'Enhancement Harvester',
        machineNumber: 'ENH-HARV-01',
        capacityPerHour: 1.0,
        customerHourlyRate: 2500,
        contractorHourlyRate: 1500,
        assignedUser: operatorUser._id,
      });
    testMachine = mRes.body.data.machine;

    // Login Operator
    const opRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'enh_op', password: 'Password@123' });
    const opCookies = opRes.headers['set-cookie'];
    const opSession = opCookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const opCsrfCookie = opCookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    operatorCookie = `${opSession}; ${opCsrfCookie}`;
    operatorCsrf = opCsrfCookie.split('=')[1];
  }, 20000);

  afterAll(async () => {
    await User.deleteMany({ userId: 'enh_op' });
    await Machine.deleteMany({ machineNumber: 'ENH-HARV-01' });
    await WorkSession.deleteMany({ customerName: { $regex: /^Enh Farmer/ } });
    await disconnectDB();
  });

  describe('1 & 2. Field Estimate Calculator & Hours/Minutes Duration', () => {
    it('formatHoursAndMinutes formats duration properly and avoids 0 hrs when under 1 hr', () => {
      expect(formatHoursAndMinutes(15)).toBe('15 Minutes');
      expect(formatHoursAndMinutes(30)).toBe('30 Minutes');
      expect(formatHoursAndMinutes(60)).toBe('1 Hour');
      expect(formatHoursAndMinutes(90)).toBe('1 Hour 30 Minutes');
      expect(formatHoursAndMinutes(135)).toBe('2 Hours 15 Minutes');
      expect(formatHoursAndMinutes(180)).toBe('3 Hours');
    });

    it('Calculator API accepts custom user rate and calculates time in minutes & formatted duration', async () => {
      // 2 Acres with Capacity 1.0 -> 2 Hours = 120 Minutes, Rate 5000 -> Expected 10000
      const res = await request(app)
        .post('/api/work-sessions/calc/field-estimate')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          acre: 2,
          capacityPerHour: 1.0,
          customerHourlyRate: 5000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalMinutes).toBe(120);
      expect(res.body.data.estimatedHours).toBe(2);
      expect(res.body.data.formattedDuration).toBe('2 Hours');
      expect(res.body.data.expectedAmount).toBe(10000);
    });

    it('Operator creates work session with user-entered custom rate (e.g. ₹5,000/hr)', async () => {
      const res = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer RateTest',
          customerMobile: '9988776655',
          fieldLocation: 'Plot 4A West',
          customerHourlyRate: 5000,
          fieldAreaAcre: 2.0,
        });

      expect(res.status).toBe(201);
      const session = res.body.data.workSession;
      expect(session.customerRateSnapshot).toBe(5000);
      expect(session.estimatedHours).toBe(2);
      expect(session.estimatedAmount).toBe(10000);

      // Verify that the global machine rate was NOT modified!
      const machineInDb = await Machine.findById(testMachine._id);
      expect(machineInDb.customerHourlyRate).toBe(2500);
    });
  });

  describe('3. Multiple Work Sessions & Active Timer Conflict Prevention', () => {
    let sessionA = null;
    let sessionB = null;

    it('Operator can create multiple bookings (drafts/pending) without conflict', async () => {
      const resA = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer MultiA',
          customerMobile: '9988771122',
          fieldLocation: 'Plot 10',
          customerHourlyRate: 4500,
          fieldAreaAcre: 1.0,
        });
      expect(resA.status).toBe(201);
      sessionA = resA.body.data.workSession;

      const resB = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer MultiB',
          customerMobile: '9988773344',
          fieldLocation: 'Plot 11',
          customerHourlyRate: 4500,
          fieldAreaAcre: 1.0,
        });
      expect(resB.status).toBe(201);
      sessionB = resB.body.data.workSession;

      expect(sessionA.status).toBe('PENDING');
      expect(sessionB.status).toBe('PENDING');
    });

    it('When sessionA is running, starting sessionB throws clear active session conflict error', async () => {
      // Start sessionA
      const startResA = await request(app)
        .post(`/api/work-sessions/${sessionA._id}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);
      expect(startResA.status).toBe(200);

      // Attempt to start sessionB
      const startResB = await request(app)
        .post(`/api/work-sessions/${sessionB._id}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(startResB.status).toBe(500);
      expect(startResB.body.message).toContain('already has an active work session');

      // Complete sessionA so machine becomes free
      await request(app)
        .post(`/api/work-sessions/${sessionA._id}/complete`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);
    });
  });

  describe('4. Work Session Partial Payment & Multiple Payment Entries', () => {
    let testSession = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer PaymentTest',
          customerMobile: '9988779900',
          fieldLocation: 'Sector East',
          customerHourlyRate: 4000,
          fieldAreaAcre: 1.0,
        });
      testSession = res.body.data.workSession;
    });

    it('Operator records Advance payment on work creation', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          workSessionId: testSession._id,
          paymentType: 'ADVANCE',
          paymentMode: 'UPI',
          amount: 1500,
          notes: 'Advance via GPay',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sessionSummary.advanceAmount).toBe(1500);
      expect(res.body.data.sessionSummary.totalPaidAmount).toBe(1500);
      expect(res.body.data.sessionSummary.paymentStatus).toBe('ADVANCE_PAID');
    });

    it('Operator completes work session and user-entered rate calculates final bill', async () => {
      await request(app)
        .post(`/api/work-sessions/${testSession._id}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      await request(app)
        .post(`/api/work-sessions/${testSession._id}/pause`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      // Simulate 3600 seconds (1 hour) of work
      await WorkSession.findByIdAndUpdate(testSession._id, {
        totalWorkedSeconds: 3600,
        lastResumeTime: null,
      });

      const compRes = await request(app)
        .post(`/api/work-sessions/${testSession._id}/complete`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(compRes.status).toBe(200);
      const completed = compRes.body.data.workSession;
      // 1 hour at 4000/hr = 4000
      expect(completed.finalAmount).toBe(4000);
      expect(completed.totalPaidAmount).toBe(1500);
      expect(completed.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('Prevents overpayment when payment amount exceeds remaining balance', async () => {
      // Remaining is 4000 - 1500 = 2500. Sending 3000 should fail!
      const res = await request(app)
        .post('/api/payments')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          workSessionId: testSession._id,
          paymentType: 'FINAL',
          paymentMode: 'Cash',
          amount: 3000,
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain('cannot exceed remaining balance');
    });

    it('Records partial payment and final settlement cleanly', async () => {
      // Record partial payment of 1500 -> total paid becomes 3000, remaining 1000
      const res1 = await request(app)
        .post('/api/payments')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          workSessionId: testSession._id,
          paymentType: 'PARTIAL',
          paymentMode: 'Cash',
          amount: 1500,
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.sessionSummary.totalPaidAmount).toBe(3000);
      expect(res1.body.data.sessionSummary.remainingBalance).toBe(1000);
      expect(res1.body.data.sessionSummary.paymentStatus).toBe('PARTIALLY_PAID');

      // Final settlement of remaining 1000 -> total paid becomes 4000, remaining 0
      const res2 = await request(app)
        .post('/api/payments')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          workSessionId: testSession._id,
          paymentType: 'FINAL',
          paymentMode: 'Bank Transfer',
          amount: 1000,
        });
      expect(res2.status).toBe(201);
      expect(res2.body.data.sessionSummary.totalPaidAmount).toBe(4000);
      expect(res2.body.data.sessionSummary.remainingBalance).toBe(0);
      expect(res2.body.data.sessionSummary.paymentStatus).toBe('PAID');
    });
  });

  describe('5. Work Session Deletion Workflow (Operator Direct / Admin Approval)', () => {
    let unstartedSession = null;
    let completedSession = null;

    beforeAll(async () => {
      // Create unstarted session
      const res1 = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer Unstarted',
          customerMobile: '9988770011',
          fieldLocation: 'Plot 1',
          customerHourlyRate: 3000,
          fieldAreaAcre: 1.0,
        });
      unstartedSession = res1.body.data.workSession;

      // Create and complete a session
      const res2 = await request(app)
        .post('/api/work-sessions')
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          customerName: 'Enh Farmer Completed',
          customerMobile: '9988770022',
          fieldLocation: 'Plot 2',
          customerHourlyRate: 3000,
          fieldAreaAcre: 1.0,
        });
      completedSession = res2.body.data.workSession;

      await request(app)
        .post(`/api/work-sessions/${completedSession._id}/start`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      await request(app)
        .post(`/api/work-sessions/${completedSession._id}/complete`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);
    });

    it('Scenario A: Operator directly deletes unstarted/pending session and it moves to Recycle Bin', async () => {
      const delRes = await request(app)
        .delete(`/api/work-sessions/${unstartedSession._id}`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(delRes.status).toBe(200);

      // Verify soft-delete
      const sessionInDb = await WorkSession.findById(unstartedSession._id);
      expect(sessionInDb.isDeleted).toBe(true);
      expect(sessionInDb.deletedByRole).toBe('USER');
    });

    it('Scenario C: Operator cannot directly delete completed session', async () => {
      const delRes = await request(app)
        .delete(`/api/work-sessions/${completedSession._id}`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf);

      expect(delRes.status).toBe(500);
      expect(delRes.body.message).toContain('Completed work sessions cannot be directly deleted');
    });

    it('Operator submits deletion request with reason -> status becomes PENDING', async () => {
      const reqRes = await request(app)
        .post(`/api/work-sessions/${completedSession._id}/request-deletion`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          reason: 'Accidental duplicate entry by operator during test',
        });

      expect(reqRes.status).toBe(200);
      const session = reqRes.body.data.workSession;
      expect(session.deletionRequest.isRequested).toBe(true);
      expect(session.deletionRequest.status).toBe('PENDING');
      expect(session.deletionRequest.reason).toContain('duplicate entry');
    });

    it('Admin can view pending deletion requests in listing', async () => {
      const listRes = await request(app)
        .get('/api/work-sessions/deletion-requests')
        .set('Cookie', [adminCookie]);

      expect(listRes.status).toBe(200);
      const requests = listRes.body.data.deletionRequests;
      expect(requests.length).toBeGreaterThanOrEqual(1);
      const found = requests.find((r) => String(r._id) === String(completedSession._id));
      expect(found).toBeDefined();
    });

    it('Admin can reject deletion request with explanation', async () => {
      const rejectRes = await request(app)
        .post(`/api/work-sessions/${completedSession._id}/review-deletion`)
        .set('Cookie', [adminCookie])
        .set('X-CSRF-Token', adminCsrf)
        .send({
          action: 'REJECT',
          rejectionReason: 'Billing already collected from customer. Cannot delete.',
        });

      expect(rejectRes.status).toBe(200);
      const session = rejectRes.body.data.workSession;
      expect(session.deletionRequest.status).toBe('REJECTED');
      expect(session.deletionRequest.rejectionReason).toContain('Billing already collected');
      expect(session.isDeleted).toBe(false);
    });

    it('Operator can re-request deletion and Admin can approve it moving to Recycle Bin', async () => {
      // Operator requests deletion again
      await request(app)
        .post(`/api/work-sessions/${completedSession._id}/request-deletion`)
        .set('Cookie', [operatorCookie])
        .set('X-CSRF-Token', operatorCsrf)
        .send({
          reason: 'Customer verified cancellation in person',
        });

      // Admin approves
      const approveRes = await request(app)
        .post(`/api/work-sessions/${completedSession._id}/review-deletion`)
        .set('Cookie', [adminCookie])
        .set('X-CSRF-Token', adminCsrf)
        .send({
          action: 'APPROVE',
        });

      expect(approveRes.status).toBe(200);
      const session = approveRes.body.data.workSession;
      expect(session.deletionRequest.status).toBe('APPROVED');
      expect(session.isDeleted).toBe(true);
      expect(session.deletedByRole).toBe('ADMIN');
    });
  });
});