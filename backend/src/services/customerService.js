import { Customer } from '../models/Customer.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Calculate automatic priority based on land acreage
 * High: 5 Acre or above
 * Medium: 2 Acre to below 5 Acre
 * Low: Below 2 Acre
 */
export const calculatePriority = (acres) => {
  const num = Number(acres);
  if (isNaN(num)) return 'LOW';
  if (num >= 5) return 'HIGH';
  if (num >= 2) return 'MEDIUM';
  return 'LOW';
};

/**
 * Fetch active users available for sharing
 */
export const getShareableUsers = async (actorUser) => {
  const users = await User.find({
    isDeleted: false,
    status: 'ACTIVE',
  })
    .select('_id name userId mobile role')
    .sort({ name: 1 })
    .lean();
  return users;
};

/**
 * Create a new customer and trigger in-app notifications to shared users
 */
export const createCustomer = async (data, actorUser) => {
  const {
    customerName,
    mobileNumber,
    localArea,
    landAreaAcres = 1.0,
    remark = '',
    shareWithUsers = [],
  } = data;

  // Check duplicate mobile number for active customers
  const existingCust = await Customer.findOne({
    mobileNumber,
    isDeleted: false,
  });
  if (existingCust) {
    const error = new Error(`Customer with mobile number ${mobileNumber} already exists.`);
    error.statusCode = 400;
    throw error;
  }

  // Deduplicate and filter out creator from recipients
  const actorIdStr = String(actorUser._id);
  const cleanRecipientIds = Array.from(new Set(shareWithUsers))
    .filter((id) => id && String(id) !== actorIdStr);

  // Validate that recipient user IDs exist in database
  let validSharedWith = [];
  if (cleanRecipientIds.length > 0) {
    const existingUsers = await User.find({
      _id: { $in: cleanRecipientIds },
      status: 'ACTIVE',
      isDeleted: false,
    }).select('_id');
    validSharedWith = existingUsers.map((u) => u._id);
  }

  const acres = Number(landAreaAcres) || 1.0;
  const priority = calculatePriority(acres);

  // 1. Save customer record centrally (stored once)
  const customer = await Customer.create({
    customerName,
    mobileNumber,
    localArea,
    landAreaAcres: acres,
    priority,
    remark,
    createdBy: actorUser._id,
    sharedWith: validSharedWith,
  });

  // 2. Dispatch in-app notifications for each selected recipient
  if (validSharedWith.length > 0) {
    const notificationDocs = validSharedWith.map((recipientId) => ({
      recipient: recipientId,
      sender: actorUser._id,
      type: 'CUSTOMER_SHARED',
      title: 'New Customer Shared With You',
      message: `${actorUser.name} shared customer "${customerName}" (${localArea}, ${acres} Acres) with you.`,
      customer: customer._id,
      metadata: {
        customerName,
        mobileNumber,
        localArea,
        landAreaAcres: acres,
        priority,
        remark,
        senderName: actorUser.name,
      },
    }));

    await Notification.insertMany(notificationDocs);
  }

  // 3. Log audit event
  await logAudit({
    actorUserId: actorUser.userId,
    actorRole: actorUser.role,
    action: 'CREATE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    metadata: {
      customerName,
      mobileNumber,
      localArea,
      landAreaAcres: acres,
      priority,
      sharedCount: validSharedWith.length,
    },
  });

  return Customer.findById(customer._id)
    .populate('createdBy', 'name userId mobile role')
    .populate('sharedWith', 'name userId mobile role assignedMachine');
};

/**
 * Get all active customers with search, priority filters, global ranking, and role authorization
 */
export const getCustomers = async (
  { search = '', priority = '', sortBy = 'acreage_desc', creator = '', page = 1, limit = 100 } = {},
  actorUser = null
) => {
  const andConditions = [{ isDeleted: false }];

  // Role authorization: Admin sees all; Regular users only see their created or shared customers
  if (actorUser && actorUser.role !== 'ADMIN') {
    andConditions.push({
      $or: [
        { createdBy: actorUser._id },
        { sharedWith: actorUser._id },
      ],
    });
  }

  if (creator) {
    andConditions.push({ createdBy: creator });
  }

  if (priority && priority !== 'all') {
    andConditions.push({ priority: priority.toUpperCase() });
  }

  if (search && search.trim()) {
    const s = search.trim();
    andConditions.push({
      $or: [
        { customerName: { $regex: s, $options: 'i' } },
        { mobileNumber: { $regex: s, $options: 'i' } },
        { localArea: { $regex: s, $options: 'i' } },
        { remark: { $regex: s, $options: 'i' } },
      ],
    });
  }

  const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  // Sorting: Highest Acreage First by default, or Recently Added, or Highest Priority First
  let sortObj = { landAreaAcres: -1, createdAt: -1 };
  if (sortBy === 'recently_added') {
    sortObj = { createdAt: -1 };
  } else if (sortBy === 'priority_desc' || sortBy === 'acreage_desc') {
    sortObj = { landAreaAcres: -1, createdAt: -1 };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const customers = await Customer.find(query)
    .populate('createdBy', 'name userId mobile role')
    .populate('sharedWith', 'name userId mobile role assignedMachine')
    .populate('updatedBy', 'name userId')
    .sort(sortObj)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await Customer.countDocuments(query);

  // Compute dynamic Rank (#1, #2, ...) based on sorting
  const customersWithRank = customers.map((c, idx) => {
    const doc = c.toObject ? c.toObject() : c;
    return {
      ...doc,
      rank: (pageNum - 1) * limitNum + idx + 1,
    };
  });

  return {
    customers: customersWithRank,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Get single customer details by ID
 */
export const getCustomerById = async (id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false })
    .populate('createdBy', 'name userId mobile role')
    .populate('sharedWith', 'name userId mobile role assignedMachine')
    .populate('updatedBy', 'name userId');

  if (!customer) {
    const error = new Error('Customer record not found.');
    error.statusCode = 404;
    throw error;
  }

  return customer;
};

/**
 * Update customer details (User and Admin permitted)
 */
export const updateCustomer = async (id, data, actorUser) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) {
    const error = new Error('Customer record not found.');
    error.statusCode = 404;
    throw error;
  }

  const { customerName, mobileNumber, localArea, landAreaAcres, remark, shareWithUsers } = data;

  if (customerName !== undefined) customer.customerName = customerName;
  if (localArea !== undefined) customer.localArea = localArea;
  if (remark !== undefined) customer.remark = remark;

  if (mobileNumber && mobileNumber !== customer.mobileNumber) {
    const existing = await Customer.findOne({
      mobileNumber,
      isDeleted: false,
      _id: { $ne: customer._id },
    });
    if (existing) {
      const err = new Error(`Customer with mobile number ${mobileNumber} already exists.`);
      err.statusCode = 400;
      throw err;
    }
    customer.mobileNumber = mobileNumber;
  }

  if (landAreaAcres !== undefined) {
    const acres = Number(landAreaAcres);
    customer.landAreaAcres = acres;
    customer.priority = calculatePriority(acres);
  }

  // If shareWithUsers provided, identify newly added users and dispatch notifications
  if (Array.isArray(shareWithUsers)) {
    const existingSharedIds = new Set(customer.sharedWith.map((uid) => String(uid)));
    const actorIdStr = String(actorUser._id);

    const newRecipientIds = shareWithUsers.filter(
      (uid) => uid && !existingSharedIds.has(String(uid)) && String(uid) !== actorIdStr
    );

    if (newRecipientIds.length > 0) {
      const validNewUsers = await User.find({
        _id: { $in: newRecipientIds },
        status: 'ACTIVE',
        isDeleted: false,
      }).select('_id');

      const validNewIds = validNewUsers.map((u) => u._id);
      validNewIds.forEach((uid) => customer.sharedWith.push(uid));

      // Dispatch notifications to newly added recipients
      const notifs = validNewIds.map((recipientId) => ({
        recipient: recipientId,
        sender: actorUser._id,
        type: 'CUSTOMER_SHARED',
        title: 'New Customer Shared With You',
        message: `${actorUser.name} shared customer "${customer.customerName}" (${customer.localArea}) with you.`,
        customer: customer._id,
        metadata: {
          customerName: customer.customerName,
          mobileNumber: customer.mobileNumber,
          localArea: customer.localArea,
          remark: customer.remark,
          senderName: actorUser.name,
        },
      }));
      await Notification.insertMany(notifs);
    }
  }

  customer.isUpdated = true;
  customer.updatedBy = actorUser._id;
  await customer.save();

  await logAudit({
    actorUserId: actorUser.userId,
    actorRole: actorUser.role,
    action: 'UPDATE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    metadata: { customerName: customer.customerName },
  });

  return Customer.findById(customer._id)
    .populate('createdBy', 'name userId mobile role')
    .populate('sharedWith', 'name userId mobile role assignedMachine')
    .populate('updatedBy', 'name userId');
};

/**
 * Share existing customer with additional users (User and Admin permitted)
 */
export const shareCustomer = async (id, userIds, actorUser) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) {
    const error = new Error('Customer record not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingSharedIds = new Set(customer.sharedWith.map((uid) => String(uid)));
  const actorIdStr = String(actorUser._id);

  const cleanUserIds = Array.from(new Set(userIds)).filter(
    (uid) => uid && !existingSharedIds.has(String(uid)) && String(uid) !== actorIdStr
  );

  if (cleanUserIds.length === 0) {
    return Customer.findById(customer._id)
      .populate('createdBy', 'name userId mobile role')
      .populate('sharedWith', 'name userId mobile role assignedMachine');
  }

  const validUsers = await User.find({
    _id: { $in: cleanUserIds },
    status: 'ACTIVE',
    isDeleted: false,
  }).select('_id');

  const validIds = validUsers.map((u) => u._id);
  validIds.forEach((uid) => customer.sharedWith.push(uid));
  await customer.save();

  // Create notifications
  const notifs = validIds.map((recipientId) => ({
    recipient: recipientId,
    sender: actorUser._id,
    type: 'CUSTOMER_SHARED',
    title: 'New Customer Shared With You',
    message: `${actorUser.name} shared customer "${customer.customerName}" (${customer.localArea}) with you.`,
    customer: customer._id,
    metadata: {
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      localArea: customer.localArea,
      remark: customer.remark,
      senderName: actorUser.name,
    },
  }));
  await Notification.insertMany(notifs);

  await logAudit({
    actorUserId: actorUser.userId,
    actorRole: actorUser.role,
    action: 'SHARE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    metadata: { newlySharedCount: validIds.length },
  });

  return Customer.findById(customer._id)
    .populate('createdBy', 'name userId mobile role')
    .populate('sharedWith', 'name userId mobile role assignedMachine');
};

/**
 * Delete customer record (Admin only - moves to Recycle Bin)
 */
export const deleteCustomer = async (id, actorUser) => {
  if (actorUser.role !== 'ADMIN') {
    const error = new Error('Permission denied. Only administrators can delete customer records.');
    error.statusCode = 403;
    throw error;
  }

  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) {
    const error = new Error('Customer record not found.');
    error.statusCode = 404;
    throw error;
  }

  customer.isDeleted = true;
  customer.deletedAt = new Date();
  customer.deletedBy = actorUser._id;
  await customer.save();

  await logAudit({
    actorUserId: actorUser.userId,
    actorRole: actorUser.role,
    action: 'DELETE_CUSTOMER',
    entity: 'Customer',
    entityId: customer._id,
    metadata: { customerName: customer.customerName, mobileNumber: customer.mobileNumber },
  });

  return {
    success: true,
    message: `Customer "${customer.customerName}" moved to Recycle Bin.`,
  };
};
