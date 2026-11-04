import { User } from '../models/User.js';
import { Machine } from '../models/Machine.js';
import { WorkSession } from '../models/WorkSession.js';
import { Expense } from '../models/Expense.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { logAudit } from '../utils/auditLogger.js';
import { PAYMENT_STATUS, PAYMENT_TYPES } from '../config/constants.js';

const getModelForModule = (module) => {
  const normalized = String(module).toLowerCase().trim();
  switch (normalized) {
    case 'user':
    case 'users':
      return { Model: User, key: 'users', label: 'Users' };
    case 'machine':
    case 'machines':
      return { Model: Machine, key: 'machines', label: 'Machines' };
    case 'work':
    case 'works':
    case 'worksession':
    case 'work_history':
      return { Model: WorkSession, key: 'works', label: 'Work History' };
    case 'expense':
    case 'expenses':
      return { Model: Expense, key: 'expenses', label: 'Expenses' };
    case 'payment':
    case 'payments':
      return { Model: Payment, key: 'payments', label: 'Payments' };
    case 'customer':
    case 'customers':
      return { Model: Customer, key: 'customers', label: 'Customers' };
    default:
      throw new Error(`Unsupported category/module: ${module}`);
  }
};

export const getDeletedRecords = async ({ category = 'all', search = '' }) => {
  const normCategory = String(category).toLowerCase().trim();

  // Queries for soft-deleted documents
  const deletedQuery = { isDeleted: true };

  const [users, machines, works, expenses, payments, customers] = await Promise.all([
    normCategory === 'all' || normCategory === 'users' || normCategory === 'user'
      ? User.find(deletedQuery).sort({ deletedAt: -1 })
      : [],
    normCategory === 'all' || normCategory === 'machines' || normCategory === 'machine'
      ? Machine.find(deletedQuery).sort({ deletedAt: -1 })
      : [],
    normCategory === 'all' || normCategory === 'works' || normCategory === 'work' || normCategory === 'work_history'
      ? WorkSession.find(deletedQuery).sort({ deletedAt: -1 })
      : [],
    normCategory === 'all' || normCategory === 'expenses' || normCategory === 'expense'
      ? Expense.find(deletedQuery).sort({ deletedAt: -1 })
      : [],
    normCategory === 'all' || normCategory === 'payments' || normCategory === 'payment'
      ? Payment.find(deletedQuery).populate('workSessionId', 'customerName').sort({ deletedAt: -1 })
      : [],
    normCategory === 'all' || normCategory === 'customers' || normCategory === 'customer'
      ? Customer.find(deletedQuery).populate('createdBy', 'name userId').sort({ deletedAt: -1 })
      : [],
  ]);

  // Transform each record to uniform Recycle Bin item
  const items = [];

  users.forEach((u) => {
    items.push({
      _id: String(u._id),
      module: 'user',
      category: 'users',
      categoryLabel: 'Users',
      name: u.name,
      identifier: `@${u.userId}`,
      details: `Role: ${u.role} • Mobile: ${u.mobile} • Status: ${u.status}`,
      deletedAt: u.deletedAt || u.updatedAt,
      deletedBy: u.deletedBy,
      deletedByName: u.deletedByName || 'Admin',
      deletedByRole: u.deletedByRole || 'ADMIN',
      meta: { role: u.role, mobile: u.mobile, userId: u.userId },
    });
  });

  machines.forEach((m) => {
    items.push({
      _id: String(m._id),
      module: 'machine',
      category: 'machines',
      categoryLabel: 'Machines',
      name: m.machineName,
      identifier: m.machineNumber,
      details: `Rate: ₹${m.customerHourlyRate}/hr • Capacity: ${m.capacityPerHour} acre/hr • Status: ${m.status}`,
      deletedAt: m.deletedAt || m.updatedAt,
      deletedBy: m.deletedBy,
      deletedByName: m.deletedByName || 'Admin',
      deletedByRole: m.deletedByRole || 'ADMIN',
      meta: { machineNumber: m.machineNumber, rate: m.customerHourlyRate, status: m.status },
    });
  });

  works.forEach((w) => {
    items.push({
      _id: String(w._id),
      module: 'work',
      category: 'works',
      categoryLabel: 'Work History',
      name: `Customer: ${w.customerName}`,
      identifier: `ID: ${String(w._id).slice(-6)}`,
      details: `Location: ${w.fieldLocation} • Duration: ${(w.totalWorkedSeconds / 3600).toFixed(2)}h • Bill: ₹${w.finalAmount || w.estimatedAmount || 0}`,
      deletedAt: w.deletedAt || w.updatedAt,
      deletedBy: w.deletedBy,
      deletedByName: w.deletedByName || 'Admin',
      deletedByRole: w.deletedByRole || 'ADMIN',
      meta: { customerMobile: w.customerMobile, status: w.status, finalAmount: w.finalAmount },
    });
  });

  expenses.forEach((e) => {
    items.push({
      _id: String(e._id),
      module: 'expense',
      category: 'expenses',
      categoryLabel: 'Expenses',
      name: `Expense: ${e.category}`,
      identifier: `₹${e.amount}`,
      details: `Amount: ₹${e.amount} • Note: ${e.note || 'None'} • Date: ${new Date(e.expenseDate).toLocaleDateString()}`,
      deletedAt: e.deletedAt || e.updatedAt,
      deletedBy: e.deletedBy,
      deletedByName: e.deletedByName || 'Admin',
      deletedByRole: e.deletedByRole || 'ADMIN',
      meta: { category: e.category, amount: e.amount, note: e.note },
    });
  });

  payments.forEach((p) => {
    const custName = p.workSessionId?.customerName ? ` (${p.workSessionId.customerName})` : '';
    items.push({
      _id: String(p._id),
      module: 'payment',
      category: 'payments',
      categoryLabel: 'Payments',
      name: `Payment: ₹${p.amount}${custName}`,
      identifier: p.paymentMode,
      details: `Type: ${p.paymentType} • Mode: ${p.paymentMode} • UTR: ${p.utrNumber || 'None'}`,
      deletedAt: p.deletedAt || p.updatedAt,
      deletedBy: p.deletedBy,
      deletedByName: p.deletedByName || 'Admin',
      deletedByRole: p.deletedByRole || 'ADMIN',
      meta: { amount: p.amount, paymentMode: p.paymentMode, paymentType: p.paymentType },
    });
  });

  customers.forEach((c) => {
    const creator = c.createdBy?.name ? `Created by: ${c.createdBy.name}` : '';
    items.push({
      _id: String(c._id),
      module: 'customer',
      category: 'customers',
      categoryLabel: 'Customers',
      name: c.customerName,
      identifier: c.mobileNumber,
      details: `Area: ${c.localArea} • ${creator} • Remark: ${c.remark || 'None'}`,
      deletedAt: c.deletedAt || c.updatedAt,
      deletedBy: c.deletedBy,
      deletedByName: 'Admin',
      deletedByRole: 'ADMIN',
      meta: { customerName: c.customerName, mobileNumber: c.mobileNumber, localArea: c.localArea },
    });
  });

  // Calculate live category counts across all modules
  const [totalUsers, totalMachines, totalWorks, totalExpenses, totalPayments, totalCustomers] = await Promise.all([
    User.countDocuments(deletedQuery),
    Machine.countDocuments(deletedQuery),
    WorkSession.countDocuments(deletedQuery),
    Expense.countDocuments(deletedQuery),
    Payment.countDocuments(deletedQuery),
    Customer.countDocuments(deletedQuery),
  ]);

  const categoryCounts = {
    all: totalUsers + totalMachines + totalWorks + totalExpenses + totalPayments + totalCustomers,
    users: totalUsers,
    machines: totalMachines,
    works: totalWorks,
    expenses: totalExpenses,
    payments: totalPayments,
    customers: totalCustomers,
  };

  // Sort descending by deletedAt
  items.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  // Search filter
  let filteredItems = items;
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filteredItems = items.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.identifier?.toLowerCase().includes(term) ||
        item.details?.toLowerCase().includes(term) ||
        item.deletedByName?.toLowerCase().includes(term)
    );
  }

  return {
    items: filteredItems,
    total: filteredItems.length,
    categoryCounts,
  };
};

export const permanentDeleteRecord = async (module, id, actor) => {
  const { Model, label } = getModelForModule(module);

  const record = await Model.findById(id);
  if (!record) {
    throw new Error(`${label} record not found in Recycle Bin.`);
  }

  // Handle dependency cleanup
  if (module === 'user' || module === 'users') {
    if (record.assignedMachine) {
      await Machine.findByIdAndUpdate(record.assignedMachine, { assignedUser: null });
    }
  } else if (module === 'machine' || module === 'machines') {
    if (record.assignedUser) {
      await User.findByIdAndUpdate(record.assignedUser, { assignedMachine: null });
    }
  } else if (module === 'payment' || module === 'payments') {
    const sessionId = record.workSessionId;
    await Model.findByIdAndDelete(id);

    // Re-aggregate session paid amounts if session exists
    const session = await WorkSession.findById(sessionId);
    if (session) {
      const remainingPayments = await Payment.find({ workSessionId: session._id, isDeleted: { $ne: true } });
      const totalPaid = remainingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const advancePaid = remainingPayments
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
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'PERMANENT_DELETE',
      entity: 'Payment',
      entityId: id,
      metadata: { module: 'Payment', id },
    });

    return { success: true, message: 'Payment permanently deleted.' };
  }

  await Model.findByIdAndDelete(id);

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'PERMANENT_DELETE',
    entity: label,
    entityId: id,
    metadata: { module: label, id },
  });

  return { success: true, message: `${label} permanently deleted.` };
};

export const permanentDeleteBatch = async (items = [], actor) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No items specified for permanent deletion.');
  }

  let deletedCount = 0;
  for (const item of items) {
    try {
      await permanentDeleteRecord(item.module, item.id, actor);
      deletedCount += 1;
    } catch (err) {
      console.error(`[RecycleBin Batch Delete Error] ${item.module} ${item.id}:`, err.message);
    }
  }

  return { success: true, count: deletedCount, message: `Permanently deleted ${deletedCount} record(s).` };
};

export const permanentDeleteCategory = async (category, actor) => {
  const normCategory = String(category).toLowerCase().trim();

  let totalDeleted = 0;
  if (normCategory === 'all') {
    const resUsers = await User.deleteMany({ isDeleted: true });
    const resMachines = await Machine.deleteMany({ isDeleted: true });
    const resWorks = await WorkSession.deleteMany({ isDeleted: true });
    const resExpenses = await Expense.deleteMany({ isDeleted: true });
    const resPayments = await Payment.deleteMany({ isDeleted: true });
    totalDeleted =
      resUsers.deletedCount +
      resMachines.deletedCount +
      resWorks.deletedCount +
      resExpenses.deletedCount +
      resPayments.deletedCount;
  } else {
    const { Model, label } = getModelForModule(normCategory);
    const result = await Model.deleteMany({ isDeleted: true });
    totalDeleted = result.deletedCount;
  }

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'PERMANENT_DELETE_CATEGORY',
    entity: 'RecycleBin',
    metadata: { category: normCategory, deletedCount: totalDeleted },
  });

  return {
    success: true,
    count: totalDeleted,
    message: `Permanently deleted all ${totalDeleted} record(s) in category "${category}".`,
  };
};

export const restoreRecord = async (module, id, actor) => {
  const { Model, label } = getModelForModule(module);

  const record = await Model.findById(id);
  if (!record) {
    throw new Error(`${label} record not found.`);
  }

  record.isDeleted = false;
  record.deletedAt = null;
  record.deletedBy = null;
  record.deletedByName = null;
  record.deletedByRole = null;
  await record.save();

  // If restoring a Payment, recalculate the session
  if (module === 'payment' || module === 'payments') {
    const session = await WorkSession.findById(record.workSessionId);
    if (session) {
      const activePayments = await Payment.find({ workSessionId: session._id, isDeleted: { $ne: true } });
      const totalPaid = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const advancePaid = activePayments
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
  }

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'RECORD_RESTORED',
    entity: label,
    entityId: id,
    metadata: { module: label, id },
  });

  return { success: true, message: `${label} restored successfully.` };
};
