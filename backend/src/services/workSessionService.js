import { WorkSession } from '../models/WorkSession.js';
import { Machine } from '../models/Machine.js';
import { MasterData } from '../models/MasterData.js';
import { ROLES, WORK_STATUS, PAYMENT_STATUS, DEFAULT_CONFIG } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  kathaToAcre,
  calculateEstimatedHours,
  calculateExpectedAmount,
  calculateAmountBySeconds,
} from '../utils/calculator.js';

export const createWorkSession = async (data, user) => {
  let machineId = data.machineId;
  let assignedUserId = user._id;

  if (user.role === ROLES.USER) {
    if (!user.assignedMachine) {
      throw new Error('You do not have an assigned machine. Contact your administrator.');
    }
    machineId = user.assignedMachine._id || user.assignedMachine;
    assignedUserId = user._id;
  } else {
    // Admin
    if (!machineId) {
      throw new Error('Machine ID is required.');
    }
  }

  const machine = await Machine.findById(machineId);
  if (!machine) {
    throw new Error('Assigned machine not found or inactive.');
  }

  if (user.role === ROLES.ADMIN && machine.assignedUser) {
    assignedUserId = machine.assignedUser;
  }

  // Calculate field estimates if provided
  let fieldAreaAcre = data.fieldAreaAcre || 0;
  if (!fieldAreaAcre && data.fieldAreaKatha) {
    const kathaConfig = await MasterData.findOne({ key: 'kathaPerAcre' });
    const factor = kathaConfig?.value || DEFAULT_CONFIG.kathaPerAcre;
    fieldAreaAcre = kathaToAcre(data.fieldAreaKatha, factor);
  }

  let estimatedHours = 0;
  let estimatedAmount = 0;
  // Customer rate snapshot: use operator-entered rate if provided and > 0; otherwise fallback to machine default
  const customerRate = Number(data.customerHourlyRate) > 0
    ? Number(data.customerHourlyRate)
    : machine.customerHourlyRate;

  if (fieldAreaAcre > 0) {
    estimatedHours = calculateEstimatedHours(fieldAreaAcre, machine.capacityPerHour);
    estimatedAmount = calculateExpectedAmount(estimatedHours, customerRate);
  }

  const workSession = await WorkSession.create({
    customerName: data.customerName,
    customerMobile: data.customerMobile,
    fieldAreaKatha: data.fieldAreaKatha || 0,
    fieldAreaAcre,
    fieldLocation: data.fieldLocation,
    locationCoordinates: data.locationCoordinates || { latitude: null, longitude: null },
    machineId: machine._id,
    userId: assignedUserId,
    createdBy: user._id,
    createdByRole: user.role,
    status: WORK_STATUS.PENDING,
    customerRateSnapshot: customerRate,
    contractorRateSnapshot: machine.contractorHourlyRate,
    estimatedHours,
    estimatedAmount,
    notes: data.notes || '',
  });

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_SESSION_CREATED',
    entity: 'WorkSession',
    entityId: workSession._id,
    metadata: { customerName: workSession.customerName, machineId: machine._id },
  });

  return await WorkSession.findById(workSession._id)
    .populate('machineId', 'machineName machineNumber capacityPerHour customerHourlyRate')
    .populate('userId', 'name userId mobile')
    .populate('createdBy', 'name userId');
};

export const startWork = async (sessionId, user) => {
  const session = await WorkSession.findById(sessionId);
  if (!session) throw new Error('Work session not found.');

  // Authorization check
  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Unauthorized to start this work session.');
  }

  if (session.status !== WORK_STATUS.PENDING) {
    throw new Error(`Cannot start work session with status "${session.status}".`);
  }

  // Prevent multiple concurrent active sessions for the same machine
  const activeExisting = await WorkSession.findOne({
    machineId: session.machineId,
    status: { $in: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.PAUSED] },
    _id: { $ne: session._id },
  });

  if (activeExisting) {
    throw new Error(`Machine already has an active work session (Customer: ${activeExisting.customerName}). Please pause or complete it first.`);
  }

  const now = new Date();
  session.startedAt = now;
  session.lastResumeTime = now;
  session.status = WORK_STATUS.IN_PROGRESS;
  session.totalWorkedSeconds = 0;
  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_STARTED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: { startedAt: now },
  });

  return session;
};

export const pauseWork = async (sessionId, user) => {
  const session = await WorkSession.findById(sessionId);
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Unauthorized to pause this work session.');
  }

  if (session.status !== WORK_STATUS.IN_PROGRESS) {
    throw new Error(`Work session is not currently running (current status: ${session.status}).`);
  }

  const now = new Date();
  if (session.lastResumeTime) {
    const deltaSeconds = Math.max(0, Math.floor((now.getTime() - new Date(session.lastResumeTime).getTime()) / 1000));
    session.totalWorkedSeconds = (session.totalWorkedSeconds || 0) + deltaSeconds;
  }

  session.pauseIntervals.push({
    pausedAt: now,
    resumedAt: null,
  });
  session.lastResumeTime = null;
  session.status = WORK_STATUS.PAUSED;
  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_PAUSED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: { totalWorkedSeconds: session.totalWorkedSeconds },
  });

  return session;
};

export const resumeWork = async (sessionId, user) => {
  const session = await WorkSession.findById(sessionId);
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Unauthorized to resume this work session.');
  }

  if (session.status !== WORK_STATUS.PAUSED) {
    throw new Error(`Work session is not paused (current status: ${session.status}).`);
  }

  const now = new Date();
  if (session.pauseIntervals.length > 0) {
    const lastInterval = session.pauseIntervals[session.pauseIntervals.length - 1];
    if (!lastInterval.resumedAt) {
      lastInterval.resumedAt = now;
    }
  }

  session.lastResumeTime = now;
  session.status = WORK_STATUS.IN_PROGRESS;
  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_RESUMED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: { resumedAt: now },
  });

  return session;
};

export const completeWork = async (sessionId, user) => {
  const session = await WorkSession.findById(sessionId);
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Unauthorized to complete this work session.');
  }

  if (session.status === WORK_STATUS.COMPLETED) {
    throw new Error('Work session is already completed.');
  }

  const now = new Date();
  if (session.status === WORK_STATUS.IN_PROGRESS && session.lastResumeTime) {
    const elapsed = Math.floor((now.getTime() - new Date(session.lastResumeTime).getTime()) / 1000);
    const deltaSeconds = Math.max(1, elapsed);
    session.totalWorkedSeconds = (session.totalWorkedSeconds || 0) + deltaSeconds;
  }

  session.completedAt = now;
  session.lastResumeTime = null;
  session.status = WORK_STATUS.COMPLETED;

  // Accurate backend calculations for customer final amount and contractor amount
  session.finalAmount = calculateAmountBySeconds(session.totalWorkedSeconds, session.customerRateSnapshot);
  session.contractorAmount = calculateAmountBySeconds(session.totalWorkedSeconds, session.contractorRateSnapshot);

  // Update payment status
  const totalPaid = session.totalPaidAmount || 0;
  if (totalPaid >= session.finalAmount && session.finalAmount > 0) {
    session.paymentStatus = PAYMENT_STATUS.PAID;
  } else if (totalPaid > 0) {
    session.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
  } else if (session.advanceAmount > 0) {
    session.paymentStatus = PAYMENT_STATUS.ADVANCE_PAID;
  } else {
    session.paymentStatus = PAYMENT_STATUS.UNPAID;
  }

  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_COMPLETED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: {
      totalWorkedSeconds: session.totalWorkedSeconds,
      finalAmount: session.finalAmount,
      contractorAmount: session.contractorAmount,
    },
  });

  return session;
};

export const getActiveSession = async (user) => {
  const query = {
    status: { $in: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.PAUSED] },
    isDeleted: { $ne: true },
  };

  if (user.role === ROLES.USER) {
    query.userId = user._id;
  }

  const session = await WorkSession.findOne(query)
    .populate('machineId', 'machineName machineNumber customerHourlyRate')
    .populate('userId', 'name userId')
    .sort({ updatedAt: -1 });

  if (!session) return null;

  // Calculate live elapsed seconds for real-time frontend synchronization
  let liveWorkedSeconds = session.totalWorkedSeconds || 0;
  if (session.status === WORK_STATUS.IN_PROGRESS && session.lastResumeTime) {
    const liveDelta = Math.max(0, Math.floor((Date.now() - new Date(session.lastResumeTime).getTime()) / 1000));
    liveWorkedSeconds += liveDelta;
  }

  const result = session.toObject();
  result.liveWorkedSeconds = liveWorkedSeconds;

  // Mask sensitive financial fields if user is operator
  if (user.role === ROLES.USER) {
    delete result.contractorRateSnapshot;
    delete result.contractorAmount;
  }

  return result;
};

export const getWorkSessions = async (filters, user) => {
  const query = { isDeleted: { $ne: true } };

  if (user.role === ROLES.USER) {
    query.userId = user._id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.machineId) {
    query.machineId = filters.machineId;
  }

  if (filters.userId && user.role === ROLES.ADMIN) {
    query.userId = filters.userId;
  }

  if (filters.createdByRole && user.role === ROLES.ADMIN) {
    query.createdByRole = filters.createdByRole;
  }

  if (filters.advancePaymentStatus) {
    if (filters.advancePaymentStatus === 'HAS_ADVANCE') {
      query.advanceAmount = { $gt: 0 };
    } else if (filters.advancePaymentStatus === 'NO_ADVANCE') {
      query.advanceAmount = { $lte: 0 };
    }
  }

  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { customerName: searchRegex },
      { customerMobile: searchRegex },
      { fieldLocation: searchRegex },
    ];
  }

  const sessions = await WorkSession.find(query)
    .populate('machineId', 'machineName machineNumber')
    .populate('userId', 'name userId')
    .populate('createdBy', 'name userId role')
    .sort({ createdAt: -1 });

  return sessions.map((s) => {
    const obj = s.toObject();
    if (user.role === ROLES.USER) {
      delete obj.contractorRateSnapshot;
      delete obj.contractorAmount;
    }
    return obj;
  });
};

export const getWorkSessionById = async (id, user) => {
  const session = await WorkSession.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('machineId', 'machineName machineNumber customerHourlyRate contractorHourlyRate')
    .populate('userId', 'name userId mobile')
    .populate('createdBy', 'name userId role');

  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId._id) !== String(user._id)) {
    throw new Error('Access denied to this work session.');
  }

  const obj = session.toObject();
  if (user.role === ROLES.USER) {
    delete obj.contractorRateSnapshot;
    delete obj.contractorAmount;
    if (obj.machineId) {
      delete obj.machineId.contractorHourlyRate;
    }
  }
  return obj;
};

export const deleteWorkSession = async (id, user) => {
  const session = await WorkSession.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER) {
    if (String(session.userId) !== String(user._id)) {
      throw new Error('Access denied to delete this work session.');
    }

    // Unstarted/Pending work sessions can be deleted directly by operator
    if (session.status === WORK_STATUS.PENDING && (session.totalWorkedSeconds || 0) === 0) {
      // Allowed to directly delete
    } else if (session.status === WORK_STATUS.IN_PROGRESS || session.status === WORK_STATUS.PAUSED) {
      throw new Error('Active work sessions cannot be deleted. Please complete or cancel the work first.');
    } else if (session.status === WORK_STATUS.COMPLETED) {
      throw new Error('Completed work sessions cannot be directly deleted. Please submit a deletion request for administrator approval.');
    }
  }

  session.isDeleted = true;
  session.deletedAt = new Date();
  session.deletedBy = user._id;
  session.deletedByName = user.name;
  session.deletedByRole = user.role;
  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_SESSION_DELETED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: { customerName: session.customerName },
  });

  return session;
};

export const requestWorkSessionDeletion = async (id, reason, user) => {
  const session = await WorkSession.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Access denied to request deletion for this work session.');
  }

  if (session.status !== WORK_STATUS.COMPLETED) {
    throw new Error('Deletion requests can only be submitted for completed work sessions.');
  }

  if (session.deletionRequest?.status === 'PENDING') {
    throw new Error('A deletion request is already pending administrator review for this work session.');
  }

  session.deletionRequest = {
    isRequested: true,
    status: 'PENDING',
    reason: reason.trim(),
    requestedAt: new Date(),
    requestedBy: user._id,
    requestedByName: user.name,
    reviewedAt: null,
    reviewedBy: null,
    reviewedByName: '',
    rejectionReason: '',
  };

  await session.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'WORK_SESSION_DELETION_REQUESTED',
    entity: 'WorkSession',
    entityId: session._id,
    metadata: { customerName: session.customerName, reason },
  });

  return session;
};

export const reviewDeletionRequest = async (id, { action, rejectionReason }, admin) => {
  const session = await WorkSession.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!session) throw new Error('Work session not found.');

  if (session.deletionRequest?.status !== 'PENDING') {
    throw new Error('No pending deletion request found for this work session.');
  }

  if (action === 'APPROVE') {
    session.deletionRequest.status = 'APPROVED';
    session.deletionRequest.reviewedAt = new Date();
    session.deletionRequest.reviewedBy = admin._id;
    session.deletionRequest.reviewedByName = admin.name;

    session.isDeleted = true;
    session.deletedAt = new Date();
    session.deletedBy = admin._id;
    session.deletedByName = admin.name;
    session.deletedByRole = admin.role;

    await session.save();

    await logAudit({
      actorUserId: admin.userId,
      actorRole: admin.role,
      action: 'WORK_SESSION_DELETION_APPROVED',
      entity: 'WorkSession',
      entityId: session._id,
      metadata: { customerName: session.customerName },
    });
  } else if (action === 'REJECT') {
    session.deletionRequest.status = 'REJECTED';
    session.deletionRequest.rejectionReason = rejectionReason || 'Deletion request rejected by administrator.';
    session.deletionRequest.reviewedAt = new Date();
    session.deletionRequest.reviewedBy = admin._id;
    session.deletionRequest.reviewedByName = admin.name;

    await session.save();

    await logAudit({
      actorUserId: admin.userId,
      actorRole: admin.role,
      action: 'WORK_SESSION_DELETION_REJECTED',
      entity: 'WorkSession',
      entityId: session._id,
      metadata: { customerName: session.customerName, rejectionReason },
    });
  } else {
    throw new Error('Invalid action. Must be APPROVE or REJECT.');
  }

  return session;
};

export const getDeletionRequests = async (filters = {}, user) => {
  const query = {
    isDeleted: { $ne: true },
    'deletionRequest.status': filters.status || 'PENDING',
  };

  const sessions = await WorkSession.find(query)
    .populate('machineId', 'machineName machineNumber customerHourlyRate')
    .populate('userId', 'name userId mobile')
    .populate('createdBy', 'name userId role')
    .populate('deletionRequest.requestedBy', 'name userId')
    .sort({ 'deletionRequest.requestedAt': -1 });

  return sessions;
};
