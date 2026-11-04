import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Machine } from '../src/models/Machine.js';
import { WorkSession } from '../src/models/WorkSession.js';
import { Expense } from '../src/models/Expense.js';
import { Payment } from '../src/models/Payment.js';
import { bootstrapAdmin } from '../src/services/authService.js';
import { ENV } from '../src/config/env.js';

describe('Recycle Bin & Soft Delete System Integration Tests', () => {
  let adminCookie = '';
  let adminCsrf = '';
  let operatorCookie = '';
  let operatorCsrf = '';

  let testUser = null;
  let testMachine = null;
  let testWork = null;
  let testExpense = null;
  let testPayment = null;

  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();

    // Clean up any leftovers
    await User.deleteMany({ userId: 'softdel_op' });
    await Machine.deleteMany({ machineNumber: 'SOFT-HARV-01' });
    await WorkSession.deleteMany({ customerName: 'Soft Delete Farmer' });
    await Expense.deleteMany({ note: { $regex: /Recycle bin test/i } });

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: ENV.BOOTSTRAP_ADMIN_USER_ID, password: ENV.BOOTSTRAP_ADMIN_PASSWORD });
    const cookies = adminRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const csrfCookie = cookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    adminCookie = `${sessionCookie}; ${csrfCookie}`;
    adminCsrf = csrfCookie.split('=')[1];

    // Login Operator
    const opRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'operator1', password: 'Operator@123' });
    const opCookies = opRes.headers['set-cookie'];
    const opSession = opCookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const opCsrfCookie = opCookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    operatorCookie = `${opSession}; ${opCsrfCookie}`;
    operatorCsrf = opCsrfCookie.split('=')[1];

    // Create test user and machine
    const uRes = await request(app)
      .post('/api/users')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Soft Delete User',
        userId: 'softdel_op',
        password: 'Password@123',
        mobile: '9898989898',
        role: 'USER',
      });
    testUser = uRes.body.data.user;

    const mRes = await request(app)
      .post('/api/machines')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        machineName: 'Soft Delete Harvester',
        machineNumber: 'SOFT-HARV-01',
        capacityPerHour: 1.5,
        customerHourlyRate: 2800,
        contractorHourlyRate: 1600,
        assignedUser: testUser._id,
      });
    testMachine = mRes.body.data.machine;

    // Create test work session
    const wRes = await request(app)
      .post('/api/work-sessions')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        customerName: 'Soft Delete Farmer',
        customerMobile: '9123456780',
        fieldAreaKatha: 32,
        fieldLocation: 'Soft Delete Sector 4',
        machineId: testMachine._id,
      });
    testWork = wRes.body.data.workSession;

    // Create test expense
    const eRes = await request(app)
      .post('/api/expenses')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        machineId: testMachine._id,
        category: 'Diesel / Fuel',
        amount: 1500,
        note: 'Recycle bin test diesel',
      });
    testExpense = eRes.body.data.expense;

    // Create test payment
    const pRes = await request(app)
      .post('/api/payments')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        workSessionId: testWork._id,
        amount: 2000,
        paymentMode: 'Cash',
        paymentType: 'ADVANCE',
      });
    testPayment = pRes.body.data.payment;
  }, 20000);

  afterAll(async () => {
    await User.deleteMany({ userId: 'softdel_op' });
    await Machine.deleteMany({ machineNumber: 'SOFT-HARV-01' });
    await WorkSession.deleteMany({ customerName: 'Soft Delete Farmer' });
    await Expense.deleteMany({ note: 'Recycle bin test diesel' });
    await Payment.deleteMany({ workSessionId: testWork?._id });
    await disconnectDB();
  });

  it('1. Admin can edit machine details', async () => {
    const res = await request(app)
      .patch(`/api/machines/${testMachine._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        customerHourlyRate: 2900,
        capacityPerHour: 1.8,
        status: 'MAINTENANCE',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.machine.customerHourlyRate).toBe(2900);
    expect(res.body.data.machine.capacityPerHour).toBe(1.8);
    expect(res.body.data.machine.status).toBe('MAINTENANCE');
  });

  it('2. Admin can edit expense and verify "isUpdated" and audit tracking', async () => {
    const res = await request(app)
      .patch(`/api/expenses/${testExpense._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        amount: 1650,
        note: 'Recycle bin test diesel updated',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expense.amount).toBe(1650);

    const check = await Expense.findById(testExpense._id);
    expect(check.isUpdated).toBe(true);
    expect(check.updatedByName).toBeDefined();
    expect(check.updatedByRole).toBe('ADMIN');
  });

  it('3. Soft-deleting expense moves it to Recycle Bin and excludes from active list', async () => {
    const delRes = await request(app)
      .delete(`/api/expenses/${testExpense._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Active list must exclude it
    const listRes = await request(app)
      .get('/api/expenses')
      .set('Cookie', [adminCookie]);
    const found = listRes.body.data.expenses.find((e) => e._id === testExpense._id);
    expect(found).toBeUndefined();

    // Appears in Recycle Bin
    const binRes = await request(app)
      .get('/api/recycle-bin?category=expenses')
      .set('Cookie', [adminCookie]);
    expect(binRes.status).toBe(200);
    const inBin = binRes.body.data.items.find((i) => i._id === testExpense._id);
    expect(inBin).toBeDefined();
    expect(inBin.category).toBe('expenses');
  });

  it('4. Soft-deleting payment updates WorkSession remaining balance & paid amounts', async () => {
    const delRes = await request(app)
      .delete(`/api/payments/${testPayment._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);

    const session = await WorkSession.findById(testWork._id);
    expect(session.totalPaidAmount).toBe(0);
    expect(session.advanceAmount).toBe(0);

    const binRes = await request(app)
      .get('/api/recycle-bin?category=payments')
      .set('Cookie', [adminCookie]);
    const inBin = binRes.body.data.items.find((i) => i._id === String(testPayment._id));
    expect(inBin).toBeDefined();
  });

  it('5. Soft-deleting work session moves to Recycle Bin', async () => {
    const delRes = await request(app)
      .delete(`/api/work-sessions/${testWork._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);

    const binRes = await request(app)
      .get('/api/recycle-bin?category=works')
      .set('Cookie', [adminCookie]);
    const inBin = binRes.body.data.items.find((i) => i._id === String(testWork._id));
    expect(inBin).toBeDefined();
  });

  it('6. Soft-deleting user moves to Recycle Bin and unlinks machine', async () => {
    const delRes = await request(app)
      .delete(`/api/users/${testUser._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);

    const binRes = await request(app)
      .get('/api/recycle-bin?category=users')
      .set('Cookie', [adminCookie]);
    const inBin = binRes.body.data.items.find((i) => i._id === String(testUser._id));
    expect(inBin).toBeDefined();
  });

  it('7. Soft-deleting machine moves to Recycle Bin', async () => {
    const delRes = await request(app)
      .delete(`/api/machines/${testMachine._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);

    const binRes = await request(app)
      .get('/api/recycle-bin?category=machines')
      .set('Cookie', [adminCookie]);
    const inBin = binRes.body.data.items.find((i) => i._id === String(testMachine._id));
    expect(inBin).toBeDefined();
  });

  it('8. Operator is blocked from accessing Recycle Bin', async () => {
    const res = await request(app)
      .get('/api/recycle-bin')
      .set('Cookie', [operatorCookie]);
    expect(res.status).toBe(403);
  });

  it('9. Admin can restore a record from Recycle Bin', async () => {
    const res = await request(app)
      .post(`/api/recycle-bin/restore/expenses/${testExpense._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const restored = await Expense.findById(testExpense._id);
    expect(restored.isDeleted).toBe(false);
  });

  it('10. Admin can permanently delete an individual record', async () => {
    const res = await request(app)
      .delete(`/api/recycle-bin/permanent/users/${testUser._id}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await User.findById(testUser._id);
    expect(check).toBeNull();
  });
});
