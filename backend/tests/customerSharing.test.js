import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Customer } from '../src/models/Customer.js';
import { Notification } from '../src/models/Notification.js';
import { bootstrapAdmin } from '../src/services/authService.js';

describe('Customer Management & User-to-User Sharing Integration Tests', () => {
  let adminCookie = '';
  let adminCsrf = '';
  let operatorACookie = '';
  let operatorACsrf = '';
  let operatorAUser = null;
  let operatorBCookie = '';
  let operatorBCsrf = '';
  let operatorBUser = null;
  let createdCustomerId = '';

  beforeAll(async () => {
    await connectDB(ENV.MONGODB_URI);
    await bootstrapAdmin();

    // Clean up test data
    await User.deleteMany({ userId: { $in: ['cust_op_a', 'cust_op_b'] } });
    await Customer.deleteMany({ customerName: { $regex: /^Test Farmer/ } });
    await Notification.deleteMany({});

    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: ENV.BOOTSTRAP_ADMIN_USER_ID, password: ENV.BOOTSTRAP_ADMIN_PASSWORD });
    const aCookies = adminRes.headers['set-cookie'];
    const aSession = aCookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const aCsrf = aCookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    adminCookie = `${aSession}; ${aCsrf}`;
    adminCsrf = aCsrf.split('=')[1];

    // 2. Create Operator A
    const resA = await request(app)
      .post('/api/users')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Operator Ramesh',
        userId: 'cust_op_a',
        password: 'Password@123',
        mobile: '9888811111',
        role: 'USER',
      });
    operatorAUser = resA.body.data.user;

    // 3. Create Operator B
    const resB = await request(app)
      .post('/api/users')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Operator Suresh',
        userId: 'cust_op_b',
        password: 'Password@123',
        mobile: '9888822222',
        role: 'USER',
      });
    operatorBUser = resB.body.data.user;

    // 4. Login Operator A
    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'cust_op_a', password: 'Password@123' });
    const opACookies = loginA.headers['set-cookie'];
    const opASession = opACookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const opACsrf = opACookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    operatorACookie = `${opASession}; ${opACsrf}`;
    operatorACsrf = opACsrf.split('=')[1];

    // 5. Login Operator B
    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'cust_op_b', password: 'Password@123' });
    const opBCookies = loginB.headers['set-cookie'];
    const opBSession = opBCookies.find((c) => c.startsWith('dhaantrack_session=')).split(';')[0];
    const opBCsrf = opBCookies.find((c) => c.startsWith('dhaantrack_csrf=')).split(';')[0];
    operatorBCookie = `${opBSession}; ${opBCsrf}`;
    operatorBCsrf = opBCsrf.split('=')[1];
  }, 60000);

  afterAll(async () => {
    await User.deleteMany({ userId: { $in: ['cust_op_a', 'cust_op_b'] } });
    await Customer.deleteMany({ customerName: { $regex: /^Test Farmer/ } });
    await Notification.deleteMany({});
    await disconnectDB();
  });

  it('1. Shareable users endpoint returns all eligible active users including User B for User A', async () => {
    const res = await request(app)
      .get('/api/customers/shareable-users')
      .set('Cookie', [operatorACookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const users = res.body.data.users || res.body.users;
    expect(Array.isArray(users)).toBe(true);

    const foundB = users.find((u) => u.userId === 'cust_op_b');
    expect(foundB).toBeDefined();
    expect(foundB.name).toBe('Operator Suresh');
  });

  it('2. Operator A creates a customer with 6.5 Acres (High Priority) and shares with Operator B', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', [operatorACookie])
      .set('X-CSRF-Token', operatorACsrf)
      .send({
        customerName: 'Test Farmer Mahendra',
        mobileNumber: '9876543210',
        localArea: 'Rampur Village',
        landAreaAcres: 6.5,
        remark: 'Needs 6.5 acres harvested this weekend',
        shareWithUsers: [operatorBUser._id],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const cust = res.body.data.customer || res.body.customer;
    expect(cust).toBeDefined();
    expect(cust.customerName).toBe('Test Farmer Mahendra');
    expect(cust.mobileNumber).toBe('9876543210');
    expect(cust.localArea).toBe('Rampur Village');
    expect(cust.landAreaAcres).toBe(6.5);
    expect(cust.priority).toBe('HIGH'); // >= 5 Acre -> HIGH
    expect(cust.createdBy._id).toBe(operatorAUser._id);
    expect(cust.sharedWith.length).toBe(1);

    createdCustomerId = cust._id;
  });

  it('3. Duplicate mobile number validation rejects duplicate customer registration', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', [operatorACookie])
      .set('X-CSRF-Token', operatorACsrf)
      .send({
        customerName: 'Test Farmer Duplicate Mobile',
        mobileNumber: '9876543210', // duplicate of test 2
        localArea: 'Rampur Village',
        landAreaAcres: 3.0,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('4. Operator B receives persistent in-app notification with land acreage & priority metadata', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Cookie', [operatorBCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const notifications = res.body.data.notifications || res.body.notifications;
    expect(notifications.length).toBeGreaterThan(0);

    const notif = notifications[0];
    expect(notif.type).toBe('CUSTOMER_SHARED');
    expect(notif.isRead).toBe(false);
    expect(notif.metadata.customerName).toBe('Test Farmer Mahendra');
    expect(notif.metadata.landAreaAcres).toBe(6.5);
    expect(notif.metadata.priority).toBe('HIGH');

    // Operator B marks notification as read
    const readRes = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Cookie', [operatorBCookie])
      .set('X-CSRF-Token', operatorBCsrf);

    expect(readRes.status).toBe(200);
    expect(readRes.body.notification.isRead).toBe(true);
  });

  it('5. Automatic priority calculation: creates Medium (3.0 Acre) and Low (1.5 Acre) customers', async () => {
    // Medium Priority
    const resMed = await request(app)
      .post('/api/customers')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        customerName: 'Test Farmer Jagdish',
        mobileNumber: '9876543211',
        localArea: 'Sector 5 Farm',
        landAreaAcres: 3.0,
      });
    expect(resMed.status).toBe(201);
    expect((resMed.body.data.customer || resMed.body.customer).priority).toBe('MEDIUM');

    // Low Priority
    const resLow = await request(app)
      .post('/api/customers')
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf)
      .send({
        customerName: 'Test Farmer Bansi',
        mobileNumber: '9876543212',
        localArea: 'Canal Road',
        landAreaAcres: 1.5,
      });
    expect(resLow.status).toBe(201);
    expect((resLow.body.data.customer || resLow.body.customer).priority).toBe('LOW');
  });

  it('6. Global Ranking & Highest Acreage First sorting across all customers', async () => {
    const res = await request(app)
      .get('/api/customers?sortBy=acreage_desc')
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    const customers = res.body.data.customers || res.body.customers;
    expect(customers.length).toBeGreaterThanOrEqual(3);

    // Verify Rank order: Highest acreage first
    const testCusts = customers.filter((c) => c.customerName.startsWith('Test Farmer'));
    expect(testCusts[0].landAreaAcres).toBe(6.5); // Mahendra #1
    expect(testCusts[1].landAreaAcres).toBe(3.0); // Jagdish #2
    expect(testCusts[2].landAreaAcres).toBe(1.5); // Bansi #3

    expect(customers[0].rank).toBe(1);
    expect(customers[1].rank).toBe(2);
  });

  it('7. Operator can edit customer acreage and priority is recalculated automatically', async () => {
    const res = await request(app)
      .patch(`/api/customers/${createdCustomerId}`)
      .set('Cookie', [operatorACookie])
      .set('X-CSRF-Token', operatorACsrf)
      .send({
        landAreaAcres: 1.2, // Change from 6.5 to 1.2 -> priority should become LOW
        remark: 'Reduced to single parcel',
      });

    expect(res.status).toBe(200);
    const cust = res.body.data.customer || res.body.customer;
    expect(cust.landAreaAcres).toBe(1.2);
    expect(cust.priority).toBe('LOW');
    expect(cust.isUpdated).toBe(true);

    // Change back to 8.0 -> priority should become HIGH
    const resHigh = await request(app)
      .patch(`/api/customers/${createdCustomerId}`)
      .set('Cookie', [operatorACookie])
      .set('X-CSRF-Token', operatorACsrf)
      .send({ landAreaAcres: 8.0 });
    expect((resHigh.body.data.customer || resHigh.body.customer).priority).toBe('HIGH');
  });

  it('8. Operator CANNOT delete customer (strictly Admin only)', async () => {
    const res = await request(app)
      .delete(`/api/customers/${createdCustomerId}`)
      .set('Cookie', [operatorACookie])
      .set('X-CSRF-Token', operatorACsrf);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('9. Admin CAN delete customer and it moves to Recycle Bin and can be restored', async () => {
    // Delete
    const delRes = await request(app)
      .delete(`/api/customers/${createdCustomerId}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('Recycle Bin');

    // In Recycle Bin
    const binRes = await request(app)
      .get('/api/recycle-bin?category=customers')
      .set('Cookie', [adminCookie]);
    const binFound = binRes.body.data.items.find((i) => i._id === createdCustomerId);
    expect(binFound).toBeDefined();

    // Restore
    const restoreRes = await request(app)
      .post(`/api/recycle-bin/restore/customers/${createdCustomerId}`)
      .set('Cookie', [adminCookie])
      .set('X-CSRF-Token', adminCsrf);
    expect(restoreRes.status).toBe(200);

    // Back in active list
    const activeRes = await request(app)
      .get('/api/customers')
      .set('Cookie', [adminCookie]);
    const foundActive = (activeRes.body.data.customers || activeRes.body.customers).find(
      (c) => c._id === createdCustomerId
    );
    expect(foundActive).toBeDefined();
  });
});
