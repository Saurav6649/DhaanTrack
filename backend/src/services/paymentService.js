import { Payment } from '../models/Payment.js';
import { WorkSession } from '../models/WorkSession.js';
import { PAYMENT_STATUS, PAYMENT_TYPES, ROLES } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';
import { calculateRemainingBalance } from '../utils/calculator.js';

export const createPayment = async (data, user) => {
  const session = await WorkSession.findById(data.workSessionId);
  if (!session) {
    throw new Error('Work session not found.');
  }

  // Operators can only record payments for their own sessions
  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Unauthorized to add payment for this work session.');
  }

  // Financial validation: prevent overpayment beyond remaining balance on settlement payments
  const targetAmount = session.finalAmount > 0 ? session.finalAmount : (session.estimatedAmount || 0);
  const currentPaid = session.totalPaidAmount || 0;
  const currentRemaining = Math.max(0, Math.round((targetAmount - currentPaid) * 100) / 100);

  const paymentType = data.paymentType || (session.status === 'PENDING' ? PAYMENT_TYPES.ADVANCE : PAYMENT_TYPES.PARTIAL);

  if (paymentType !== PAYMENT_TYPES.ADVANCE) {
    if (targetAmount > 0 && currentRemaining <= 0) {
      throw new Error('This work session has already been fully paid.');
    }

    if (targetAmount > 0 && Number(data.amount) > currentRemaining + 0.01) {
      throw new Error(`Payment amount (₹${data.amount}) cannot exceed remaining balance of ₹${currentRemaining}.`);
    }
  }

  // Prevent duplicate payment submission (e.g. double click within 4 seconds)
  const duplicateWindow = new Date(Date.now() - 4000);
  const recentDuplicate = await Payment.findOne({
    workSessionId: session._id,
    amount: data.amount,
    paymentMode: data.paymentMode,
    createdAt: { $gte: duplicateWindow },
    isDeleted: { $ne: true },
  });
  if (recentDuplicate) {
    throw new Error('Duplicate payment detected. Please wait a few seconds before trying again.');
  }

  const payment = await Payment.create({
    workSessionId: session._id,
    paymentType,
    paymentMode: data.paymentMode,
    amount: data.amount,
    utrNumber: data.utrNumber || '',
    paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    receivedBy: user._id,
    notes: data.notes || '',
  });

  // Recalculate session paid amounts
  const allPayments = await Payment.find({ workSessionId: session._id, isDeleted: { $ne: true } });
  const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const advancePaid = allPayments
    .filter((p) => p.paymentType === PAYMENT_TYPES.ADVANCE)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  session.totalPaidAmount = Math.round(totalPaid * 100) / 100;
  session.advanceAmount = Math.round(advancePaid * 100) / 100;

  // Determine updated payment status
  if (targetAmount > 0 && session.totalPaidAmount >= targetAmount) {
    session.paymentStatus = PAYMENT_STATUS.PAID;
  } else if (session.status === 'PENDING' && session.advanceAmount > 0) {
    session.paymentStatus = PAYMENT_STATUS.ADVANCE_PAID;
  } else if (session.totalPaidAmount > 0) {
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
    action: 'PAYMENT_RECORDED',
    entity: 'Payment',
    entityId: payment._id,
    metadata: {
      workSessionId: session._id,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      totalPaidSoFar: session.totalPaidAmount,
    },
  });

  const remainingBalance = calculateRemainingBalance(targetAmount, session.totalPaidAmount);

  return {
    payment: await Payment.findById(payment._id).populate('receivedBy', 'name userId'),
    sessionSummary: {
      workSessionId: session._id,
      totalPaidAmount: session.totalPaidAmount,
      advanceAmount: session.advanceAmount,
      remainingBalance,
      paymentStatus: session.paymentStatus,
    },
  };
};

export const getPaymentsBySession = async (workSessionId, user) => {
  const session = await WorkSession.findOne({ _id: workSessionId, isDeleted: { $ne: true } });
  if (!session) throw new Error('Work session not found.');

  if (user.role === ROLES.USER && String(session.userId) !== String(user._id)) {
    throw new Error('Access denied to view payments for this work session.');
  }

  return await Payment.find({ workSessionId, isDeleted: { $ne: true } })
    .populate('receivedBy', 'name userId')
    .sort({ paymentDate: -1 });
};

export const deletePayment = async (id, user) => {
  const payment = await Payment.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!payment) throw new Error('Payment not found.');

  payment.isDeleted = true;
  payment.deletedAt = new Date();
  payment.deletedBy = user._id;
  payment.deletedByName = user.name;
  payment.deletedByRole = user.role;
  await payment.save();

  // Recalculate session paid amounts if session exists
  const session = await WorkSession.findById(payment.workSessionId);
  if (session) {
    const allPayments = await Payment.find({ workSessionId: session._id, isDeleted: { $ne: true } });
    const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const advancePaid = allPayments
      .filter((p) => p.paymentType === PAYMENT_TYPES.ADVANCE)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    session.totalPaidAmount = Math.round(totalPaid * 100) / 100;
    session.advanceAmount = Math.round(advancePaid * 100) / 100;

    const targetAmount = session.finalAmount > 0 ? session.finalAmount : session.estimatedAmount;
    if (targetAmount > 0 && session.totalPaidAmount >= targetAmount) {
      session.paymentStatus = PAYMENT_STATUS.PAID;
    } else if (session.totalPaidAmount > 0) {
      session.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
    } else if (session.advanceAmount > 0) {
      session.paymentStatus = PAYMENT_STATUS.ADVANCE_PAID;
    } else {
      session.paymentStatus = PAYMENT_STATUS.UNPAID;
    }

    await session.save();
  }

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'PAYMENT_DELETED',
    entity: 'Payment',
    entityId: payment._id,
    metadata: { amount: payment.amount, workSessionId: payment.workSessionId },
  });

  return payment;
};
