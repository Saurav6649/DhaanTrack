import { Expense } from '../models/Expense.js';
import { Machine } from '../models/Machine.js';
import { ROLES } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';

export const createExpense = async (data, user) => {
  let machineId = data.machineId;

  if (user.role === ROLES.USER) {
    if (!user.assignedMachine) {
      throw new Error('You do not have an assigned machine to log expenses against.');
    }
    machineId = user.assignedMachine._id || user.assignedMachine;
  } else {
    // Admin
    if (!machineId) {
      throw new Error('Machine is required for expense record.');
    }
  }

  const machine = await Machine.findById(machineId);
  if (!machine) {
    throw new Error('Specified machine does not exist.');
  }

  const expense = await Expense.create({
    machineId: machine._id,
    workSessionId: data.workSessionId || null,
    category: data.category,
    note: data.note || '',
    amount: data.amount,
    expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    createdBy: user._id,
    createdByRole: user.role,
  });

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'EXPENSE_RECORDED',
    entity: 'Expense',
    entityId: expense._id,
    metadata: { category: expense.category, amount: expense.amount, machineId },
  });

  return await Expense.findById(expense._id)
    .populate('machineId', 'machineName machineNumber')
    .populate('createdBy', 'name userId');
};

export const getExpenses = async (filters, user) => {
  const query = { isDeleted: { $ne: true } };

  if (user.role === ROLES.USER) {
    // User sees only their own expenses
    query.createdBy = user._id;
  } else {
    // Admin filters
    if (filters.userId) query.createdBy = filters.userId;
    if (filters.machineId) query.machineId = filters.machineId;
  }

  if (filters.category) query.category = filters.category;
  if (filters.workSessionId) query.workSessionId = filters.workSessionId;

  if (filters.startDate || filters.endDate) {
    query.expenseDate = {};
    if (filters.startDate) query.expenseDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.expenseDate.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    query.note = new RegExp(filters.search.trim(), 'i');
  }

  return await Expense.find(query)
    .populate('machineId', 'machineName machineNumber')
    .populate('createdBy', 'name userId role')
    .populate('workSessionId', 'customerName')
    .sort({ expenseDate: -1 });
};

export const getExpenseTotals = async (user) => {
  const queryBase = {
    isDeleted: { $ne: true },
    ...(user.role === ROLES.USER ? { createdBy: user._id } : {}),
  };

  // Today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayExpenses, monthExpenses] = await Promise.all([
    Expense.find({ ...queryBase, expenseDate: { $gte: startOfToday, $lte: endOfToday } }),
    Expense.find({ ...queryBase, expenseDate: { $gte: startOfMonth } }),
  ]);

  const dailyTotal = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlyTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    dailyTotal: Math.round(dailyTotal * 100) / 100,
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
  };
};

export const updateExpense = async (id, data, user) => {
  const expense = await Expense.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!expense) throw new Error('Expense not found.');

  // Operators can only update their own expenses
  if (user.role === ROLES.USER && String(expense.createdBy) !== String(user._id)) {
    throw new Error('Access denied to modify this expense.');
  }

  const updateData = {
    ...data,
    isUpdated: true,
    updatedAt: new Date(),
    updatedBy: user._id,
    updatedByName: user.name,
    updatedByRole: user.role,
  };

  const updated = await Expense.findByIdAndUpdate(id, { $set: updateData }, { new: true })
    .populate('machineId', 'machineName machineNumber')
    .populate('createdBy', 'name userId');

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'EXPENSE_UPDATED',
    entity: 'Expense',
    entityId: expense._id,
    metadata: { updatedFields: Object.keys(data), updatedByName: user.name, updatedByRole: user.role },
  });

  return updated;
};

export const deleteExpense = async (id, user) => {
  const expense = await Expense.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!expense) throw new Error('Expense not found.');

  if (user.role === ROLES.USER && String(expense.createdBy) !== String(user._id)) {
    throw new Error('Access denied to delete this expense.');
  }

  expense.isDeleted = true;
  expense.deletedAt = new Date();
  expense.deletedBy = user._id;
  expense.deletedByName = user.name;
  expense.deletedByRole = user.role;
  await expense.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'EXPENSE_DELETED',
    entity: 'Expense',
    entityId: expense._id,
    metadata: { amount: expense.amount, category: expense.category },
  });

  return expense;
};
