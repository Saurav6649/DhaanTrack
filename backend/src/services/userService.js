import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Machine } from '../models/Machine.js';
import { WorkSession } from '../models/WorkSession.js';
import { Expense } from '../models/Expense.js';
import { Payment } from '../models/Payment.js';
import { ROLES, WORK_STATUS } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';
import { calculateGrossProfit, calculateNetProfit } from '../utils/calculator.js';

export const createUser = async (userData, creator) => {
  const existing = await User.findOne({ userId: userData.userId.toLowerCase() });
  if (existing) {
    throw new Error(`User ID "${userData.userId}" is already in use.`);
  }

  // If machine assignment provided, check machine exists
  if (userData.assignedMachine) {
    const machine = await Machine.findById(userData.assignedMachine);
    if (!machine) {
      throw new Error('Assigned machine not found.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const newUser = await User.create({
    name: userData.name,
    userId: userData.userId.toLowerCase(),
    passwordHash,
    role: userData.role || ROLES.USER,
    mobile: userData.mobile,
    assignedMachine: userData.assignedMachine || null,
    status: userData.status || 'ACTIVE',
  });

  // If machine assigned, update machine's assignedUser
  if (userData.assignedMachine) {
    await Machine.findByIdAndUpdate(userData.assignedMachine, {
      assignedUser: newUser._id,
    });
  }

  await logAudit({
    actorUserId: creator.userId,
    actorRole: creator.role,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: newUser._id,
    metadata: { name: newUser.name, userId: newUser.userId, assignedMachine: newUser.assignedMachine },
  });

  return await User.findById(newUser._id).populate('assignedMachine');
};

export const getCombinedUsersAndMachines = async () => {
  const users = await User.find({ isDeleted: { $ne: true } }).populate('assignedMachine').sort({ createdAt: -1 });

  // Compute Today's metrics for each user/machine
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const result = await Promise.all(
    users.map(async (u) => {
      // Work sessions completed or running today
      const sessions = await WorkSession.find({
        userId: u._id,
        isDeleted: { $ne: true },
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      });

      const todaySeconds = sessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
      const todayHours = Number((todaySeconds / 3600).toFixed(2));
      const todayRevenue = sessions.reduce((acc, s) => acc + (s.finalAmount || s.estimatedAmount || 0), 0);
      const todayContractor = sessions.reduce((acc, s) => acc + (s.contractorAmount || 0), 0);

      // Today's expenses by this user or for their machine
      const queryExpense = {
        isDeleted: { $ne: true },
        expenseDate: { $gte: startOfToday, $lte: endOfToday },
      };
      if (u.assignedMachine?._id) {
        queryExpense.$or = [{ createdBy: u._id }, { machineId: u.assignedMachine._id }];
      } else {
        queryExpense.createdBy = u._id;
      }
      const expenses = await Expense.find(queryExpense);
      const todayExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      const todayGrossProfit = calculateGrossProfit(todayRevenue, todayContractor);
      const todayNetProfit = calculateNetProfit(todayRevenue, todayContractor, todayExpenses);

      return {
        _id: u._id,
        name: u.name,
        userId: u.userId,
        mobile: u.mobile,
        role: u.role,
        status: u.status,
        assignedMachine: u.assignedMachine
          ? {
              _id: u.assignedMachine._id,
              machineName: u.assignedMachine.machineName,
              machineNumber: u.assignedMachine.machineNumber,
              capacityPerHour: u.assignedMachine.capacityPerHour,
              customerHourlyRate: u.assignedMachine.customerHourlyRate,
              contractorHourlyRate: u.assignedMachine.contractorHourlyRate,
              status: u.assignedMachine.status,
            }
          : null,
        todayStats: {
          workingHours: todayHours,
          revenue: Math.round(todayRevenue * 100) / 100,
          contractorAmount: Math.round(todayContractor * 100) / 100,
          expenses: Math.round(todayExpenses * 100) / 100,
          grossProfit: todayGrossProfit,
          netProfit: todayNetProfit,
        },
      };
    })
  );

  return result;
};

export const getUserMachineDetail = async (userId, { startDate, endDate }) => {
  const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).populate('assignedMachine');
  if (!user) {
    throw new Error('User not found.');
  }

  const queryRange = {};
  if (startDate) queryRange.$gte = new Date(startDate);
  if (endDate) queryRange.$lte = new Date(endDate);

  const sessionFilter = { userId: user._id, isDeleted: { $ne: true } };
  const expenseFilter = { createdBy: user._id, isDeleted: { $ne: true } };

  if (Object.keys(queryRange).length > 0) {
    sessionFilter.createdAt = queryRange;
    expenseFilter.expenseDate = queryRange;
  }

  // If user has a machine, include machine expenses too
  if (user.assignedMachine?._id) {
    expenseFilter.$or = [{ createdBy: user._id }, { machineId: user.assignedMachine._id }];
    delete expenseFilter.createdBy;
  }

  const [workSessions, expenses] = await Promise.all([
    WorkSession.find(sessionFilter)
      .populate('machineId', 'machineName machineNumber')
      .populate('createdBy', 'name userId')
      .sort({ createdAt: -1 }),
    Expense.find(expenseFilter)
      .populate('machineId', 'machineName machineNumber')
      .populate('createdBy', 'name userId')
      .sort({ expenseDate: -1 }),
  ]);

  const sessionIds = workSessions.map((s) => s._id);
  const payments = await Payment.find({ workSessionId: { $in: sessionIds }, isDeleted: { $ne: true } })
    .populate('receivedBy', 'name userId')
    .sort({ paymentDate: -1 });

  // Aggregate Cards
  const totalProjects = workSessions.length;
  const totalWorkedSeconds = workSessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
  const totalWorkingHours = Number((totalWorkedSeconds / 3600).toFixed(2));
  const totalRevenue = workSessions.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
  const totalContractorAmount = workSessions.reduce((acc, s) => acc + (s.contractorAmount || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalGrossProfit = calculateGrossProfit(totalRevenue, totalContractorAmount);
  const totalNetProfit = calculateNetProfit(totalRevenue, totalContractorAmount, totalExpenses);

  return {
    user,
    machine: user.assignedMachine,
    cards: {
      totalProjects,
      totalWorkingHours,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalContractorAmount: Math.round(totalContractorAmount * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalGrossProfit,
      totalNetProfit,
    },
    workHistory: workSessions,
    expenseHistory: expenses,
    paymentHistory: payments,
  };
};

export const updateUser = async (id, data, actor) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found.');

  // Prevent users from changing their own role or status
  if (actor.role !== ROLES.ADMIN) {
    delete data.role;
    delete data.status;
    delete data.assignedMachine;
  }

  // Handle machine reassignment
  if (data.assignedMachine !== undefined && String(data.assignedMachine) !== String(user.assignedMachine)) {
    // Unassign old machine if any
    if (user.assignedMachine) {
      await Machine.findByIdAndUpdate(user.assignedMachine, { assignedUser: null });
    }
    // Assign new machine
    if (data.assignedMachine) {
      await Machine.findByIdAndUpdate(data.assignedMachine, { assignedUser: user._id });
    }
  }

  const updated = await User.findByIdAndUpdate(id, { $set: data }, { new: true }).populate('assignedMachine');

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: user._id,
    metadata: { changed: Object.keys(data) },
  });

  return updated;
};

export const resetPassword = async (id, newPassword, actor) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found.');

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'ADMIN_RESET_PASSWORD',
    entity: 'User',
    entityId: user._id,
  });

  return { success: true, message: `Password for ${user.userId} has been reset successfully.` };
};

export const disableUser = async (id, actor) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found.');

  if (user.role === ROLES.ADMIN) {
    throw new Error('Admin users cannot be disabled.');
  }

  user.status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  await user.save();

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: user.status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED',
    entity: 'User',
    entityId: user._id,
    metadata: { newStatus: user.status },
  });

  return user;
};

export const deleteUser = async (id, actor) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) throw new Error('User not found.');
  if (user.role === ROLES.ADMIN) {
    throw new Error('Admin users cannot be deleted.');
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = actor._id;
  user.deletedByName = actor.name;
  user.deletedByRole = actor.role;

  if (user.assignedMachine) {
    await Machine.findByIdAndUpdate(user.assignedMachine, { assignedUser: null });
  }

  await user.save();

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'USER_DELETED',
    entity: 'User',
    entityId: user._id,
    metadata: { userId: user.userId, name: user.name },
  });

  return user;
};
