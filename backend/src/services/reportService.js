import { WorkSession } from '../models/WorkSession.js';
import { Expense } from '../models/Expense.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { Machine } from '../models/Machine.js';
import { Contractor } from '../models/Contractor.js';
import { WORK_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import {
  calculateGrossProfit,
  calculateNetProfit,
  calculateRemainingBalance,
  formatDuration,
} from '../utils/calculator.js';
import { generateExcelWorkbook } from '../utils/excelExporter.js';

/**
 * Helper to build Date filter range
 */
export const buildDateRange = ({ filterType = 'this_month', customStart, customEnd }) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filterType) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_7_days':
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export const getDashboardStats = async ({ filterType = 'this_month', customStart, customEnd, profitMode = 'gross', userId, machineId }) => {
  const { start, end } = buildDateRange({ filterType, customStart, customEnd });

  const sessionQuery = {
    createdAt: { $gte: start, $lte: end },
    isDeleted: { $ne: true },
  };

  const expenseQuery = {
    expenseDate: { $gte: start, $lte: end },
    isDeleted: { $ne: true },
  };

  const paymentQuery = {
    paymentDate: { $gte: start, $lte: end },
    isDeleted: { $ne: true },
  };

  if (userId) {
    sessionQuery.userId = userId;
    expenseQuery.createdBy = userId;
  }
  if (machineId) {
    sessionQuery.machineId = machineId;
    expenseQuery.machineId = machineId;
  }

  const [sessions, expenses, payments] = await Promise.all([
    WorkSession.find(sessionQuery).populate('machineId', 'machineName machineNumber').populate('userId', 'name userId'),
    Expense.find(expenseQuery).populate('machineId', 'machineName machineNumber'),
    Payment.find(paymentQuery),
  ]);

  // Aggregate Cards
  const totalProjects = sessions.length;
  const totalWorkedSeconds = sessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
  const totalWorkingHours = Number((totalWorkedSeconds / 3600).toFixed(2));
  const totalCustomerRevenue = sessions.reduce((acc, s) => acc + (s.finalAmount || s.estimatedAmount || 0), 0);
  const totalContractorAmount = sessions.reduce((acc, s) => acc + (s.contractorAmount || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const grossProfit = calculateGrossProfit(totalCustomerRevenue, totalContractorAmount);
  const netProfit = calculateNetProfit(totalCustomerRevenue, totalContractorAmount, totalExpenses);

  // Quick Summary Counts
  const runningWorks = sessions.filter((s) => s.status === WORK_STATUS.IN_PROGRESS || s.status === WORK_STATUS.PAUSED).length;
  const completedWorks = sessions.filter((s) => s.status === WORK_STATUS.COMPLETED).length;
  const pendingWorks = sessions.filter((s) => s.status === WORK_STATUS.PENDING).length;

  const totalAdvanceReceived = sessions.reduce((acc, s) => acc + (s.advanceAmount || 0), 0);
  const totalPaid = sessions.reduce((acc, s) => acc + (s.totalPaidAmount || 0), 0);
  const totalRemainingCustomerBalance = calculateRemainingBalance(totalCustomerRevenue, totalPaid);

  // Group by Date for Chart
  const dailyMap = {};
  sessions.forEach((s) => {
    const dStr = new Date(s.createdAt).toISOString().split('T')[0];
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = { date: dStr, revenue: 0, contractor: 0, expenses: 0, hours: 0 };
    }
    const rev = s.finalAmount || s.estimatedAmount || 0;
    dailyMap[dStr].revenue += rev;
    dailyMap[dStr].contractor += s.contractorAmount || 0;
    dailyMap[dStr].hours += (s.totalWorkedSeconds || 0) / 3600;
  });

  expenses.forEach((e) => {
    const dStr = new Date(e.expenseDate).toISOString().split('T')[0];
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = { date: dStr, revenue: 0, contractor: 0, expenses: 0, hours: 0 };
    }
    dailyMap[dStr].expenses += e.amount || 0;
  });

  const dailyOverview = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      revenue: Math.round(item.revenue * 100) / 100,
      contractor: Math.round(item.contractor * 100) / 100,
      expenses: Math.round(item.expenses * 100) / 100,
      grossProfit: calculateGrossProfit(item.revenue, item.contractor),
      netProfit: calculateNetProfit(item.revenue, item.contractor, item.expenses),
      hours: Number(item.hours.toFixed(2)),
    }));

  // Expense Distribution by Category
  const expenseDistMap = {};
  expenses.forEach((e) => {
    expenseDistMap[e.category] = (expenseDistMap[e.category] || 0) + e.amount;
  });
  const expenseDistribution = Object.entries(expenseDistMap).map(([category, amount]) => ({
    name: category,
    value: Math.round(amount * 100) / 100,
  }));

  // Revenue Distribution by Machine
  const machineDistMap = {};
  sessions.forEach((s) => {
    const mName = s.machineId?.machineName || 'Unknown Machine';
    machineDistMap[mName] = (machineDistMap[mName] || 0) + (s.finalAmount || s.estimatedAmount || 0);
  });
  const revenueDistribution = Object.entries(machineDistMap).map(([machine, amount]) => ({
    name: machine,
    value: Math.round(amount * 100) / 100,
  }));

  return {
    dateRange: { start, end, filterType },
    profitMode,
    cards: {
      totalProjects,
      totalWorkingHours,
      totalCustomerRevenue: Math.round(totalCustomerRevenue * 100) / 100,
      totalContractorAmount: Math.round(totalContractorAmount * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      grossProfit,
      netProfit,
    },
    quickSummary: {
      runningWorks,
      completedWorks,
      pendingWorks,
      totalAdvanceReceived: Math.round(totalAdvanceReceived * 100) / 100,
      totalRemainingCustomerBalance,
    },
    charts: {
      dailyOverview,
      expenseDistribution,
      revenueDistribution,
    },
  };
};

export const getReportData = async (reportType, filters = {}) => {
  const { start, end } = buildDateRange(filters);
  const dateQuery = { createdAt: { $gte: start, $lte: end }, isDeleted: { $ne: true } };
  const expenseDateQuery = { expenseDate: { $gte: start, $lte: end }, isDeleted: { $ne: true } };

  if (filters.userId) {
    dateQuery.userId = filters.userId;
    expenseDateQuery.createdBy = filters.userId;
  }
  if (filters.machineId) {
    dateQuery.machineId = filters.machineId;
    expenseDateQuery.machineId = filters.machineId;
  }
  if (filters.category) {
    expenseDateQuery.category = filters.category;
  }

  switch (reportType) {
    case 'work': {
      const data = await WorkSession.find(dateQuery)
        .populate('machineId', 'machineName machineNumber')
        .populate('userId', 'name userId')
        .populate('createdBy', 'name userId role')
        .sort({ createdAt: -1 });

      const columns = [
        { header: 'Work ID', key: 'workId', width: 24 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Customer Mobile', key: 'customerMobile', width: 16 },
        { header: 'Machine', key: 'machine', width: 18 },
        { header: 'Operator', key: 'operator', width: 18 },
        { header: 'Field Location', key: 'fieldLocation', width: 22 },
        { header: 'Duration (Hours)', key: 'durationHours', width: 16 },
        { header: 'Duration (Formatted)', key: 'durationFormatted', width: 20 },
        { header: 'Customer Amount (Rs)', key: 'finalAmount', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Payment Status', key: 'paymentStatus', width: 16 },
        { header: 'Created By', key: 'createdBy', width: 16 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ];

      const rows = data.map((d) => ({
        workId: String(d._id),
        customerName: d.customerName,
        customerMobile: d.customerMobile,
        machine: d.machineId ? `${d.machineId.machineName} (${d.machineId.machineNumber})` : 'N/A',
        operator: d.userId ? d.userId.name : 'N/A',
        fieldLocation: d.fieldLocation,
        durationHours: Number(((d.totalWorkedSeconds || 0) / 3600).toFixed(2)),
        durationFormatted: formatDuration(d.totalWorkedSeconds || 0).formatted,
        finalAmount: d.finalAmount || d.estimatedAmount || 0,
        status: d.status,
        paymentStatus: d.paymentStatus,
        createdBy: d.createdBy ? d.createdBy.name : 'System',
        createdAt: new Date(d.createdAt).toLocaleString(),
      }));

      return { columns, rows, sheetName: 'Work Report' };
    }

    case 'expense': {
      const data = await Expense.find(expenseDateQuery)
        .populate('machineId', 'machineName machineNumber')
        .populate('createdBy', 'name userId role')
        .populate('workSessionId', 'customerName')
        .sort({ expenseDate: -1 });

      const columns = [
        { header: 'Expense ID', key: 'expenseId', width: 24 },
        { header: 'Category', key: 'category', width: 22 },
        { header: 'Amount (Rs)', key: 'amount', width: 16 },
        { header: 'Machine', key: 'machine', width: 20 },
        { header: 'Related Work', key: 'relatedWork', width: 20 },
        { header: 'Note', key: 'note', width: 28 },
        { header: 'Created By', key: 'createdBy', width: 18 },
        { header: 'Created By Role', key: 'createdByRole', width: 16 },
        { header: 'Expense Date', key: 'expenseDate', width: 20 },
      ];

      const rows = data.map((e) => ({
        expenseId: String(e._id),
        category: e.category,
        amount: e.amount,
        machine: e.machineId ? `${e.machineId.machineName} (${e.machineId.machineNumber})` : 'N/A',
        relatedWork: e.workSessionId ? e.workSessionId.customerName : 'General',
        note: e.note || '-',
        createdBy: e.createdBy ? e.createdBy.name : 'Unknown',
        createdByRole: e.createdByRole,
        expenseDate: new Date(e.expenseDate).toLocaleDateString(),
      }));

      return { columns, rows, sheetName: 'Expense Report' };
    }

    case 'revenue':
    case 'profit': {
      const [sessions, expenses] = await Promise.all([
        WorkSession.find(dateQuery).populate('machineId', 'machineName machineNumber').sort({ createdAt: -1 }),
        Expense.find(expenseDateQuery),
      ]);

      const columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Customer Revenue (Rs)', key: 'revenue', width: 22 },
        { header: 'Contractor Amount (Rs)', key: 'contractorAmount', width: 22 },
        { header: 'Expenses (Rs)', key: 'expenses', width: 18 },
        { header: 'Gross Profit (Rs)', key: 'grossProfit', width: 20 },
        { header: 'Net Profit (Rs)', key: 'netProfit', width: 20 },
      ];

      // Daily grouped rows
      const dailyMap = {};
      sessions.forEach((s) => {
        const dStr = new Date(s.createdAt).toISOString().split('T')[0];
        if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, rev: 0, cont: 0, exp: 0 };
        dailyMap[dStr].rev += s.finalAmount || s.estimatedAmount || 0;
        dailyMap[dStr].cont += s.contractorAmount || 0;
      });

      expenses.forEach((e) => {
        const dStr = new Date(e.expenseDate).toISOString().split('T')[0];
        if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, rev: 0, cont: 0, exp: 0 };
        dailyMap[dStr].exp += e.amount || 0;
      });

      const rows = Object.values(dailyMap)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
          date: r.date,
          revenue: Math.round(r.rev * 100) / 100,
          contractorAmount: Math.round(r.cont * 100) / 100,
          expenses: Math.round(r.exp * 100) / 100,
          grossProfit: calculateGrossProfit(r.rev, r.cont),
          netProfit: calculateNetProfit(r.rev, r.cont, r.exp),
        }));

      return { columns, rows, sheetName: 'Profit & Revenue Report' };
    }

    case 'user_wise': {
      const users = await User.find({ isDeleted: { $ne: true } }).populate('assignedMachine');
      const sessions = await WorkSession.find(dateQuery);
      const expenses = await Expense.find(expenseDateQuery);

      const columns = [
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'User ID', key: 'userId', width: 16 },
        { header: 'Role', key: 'role', width: 12 },
        { header: 'Assigned Machine', key: 'assignedMachine', width: 20 },
        { header: 'Completed Works', key: 'completedWorks', width: 16 },
        { header: 'Total Working Hours', key: 'workingHours', width: 20 },
        { header: 'Total Revenue (Rs)', key: 'revenue', width: 18 },
        { header: 'Total Expenses (Rs)', key: 'expenses', width: 18 },
        { header: 'Gross Profit (Rs)', key: 'grossProfit', width: 18 },
      ];

      const rows = users.map((u) => {
        const uSessions = sessions.filter((s) => String(s.userId) === String(u._id));
        const uExpenses = expenses.filter((e) => String(e.createdBy) === String(u._id));

        const totalSecs = uSessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
        const revenue = uSessions.reduce((acc, s) => acc + (s.finalAmount || s.estimatedAmount || 0), 0);
        const contractor = uSessions.reduce((acc, s) => acc + (s.contractorAmount || 0), 0);
        const expAmount = uExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        return {
          userName: u.name,
          userId: u.userId,
          role: u.role,
          assignedMachine: u.assignedMachine ? u.assignedMachine.machineName : 'None',
          completedWorks: uSessions.filter((s) => s.status === 'COMPLETED').length,
          workingHours: Number((totalSecs / 3600).toFixed(2)),
          revenue: Math.round(revenue * 100) / 100,
          expenses: Math.round(expAmount * 100) / 100,
          grossProfit: calculateGrossProfit(revenue, contractor),
        };
      });

      return { columns, rows, sheetName: 'User-wise Report' };
    }

    case 'machine_wise': {
      const machines = await Machine.find({ isDeleted: { $ne: true } }).populate('assignedUser');
      const sessions = await WorkSession.find(dateQuery);
      const expenses = await Expense.find(expenseDateQuery);

      const columns = [
        { header: 'Machine Name', key: 'machineName', width: 20 },
        { header: 'Machine Number', key: 'machineNumber', width: 18 },
        { header: 'Assigned Operator', key: 'operator', width: 20 },
        { header: 'Total Projects', key: 'projects', width: 16 },
        { header: 'Working Hours', key: 'hours', width: 16 },
        { header: 'Revenue (Rs)', key: 'revenue', width: 18 },
        { header: 'Contractor Cost (Rs)', key: 'contractorCost', width: 20 },
        { header: 'Expenses (Rs)', key: 'expenses', width: 18 },
        { header: 'Net Profit (Rs)', key: 'netProfit', width: 18 },
      ];

      const rows = machines.map((m) => {
        const mSessions = sessions.filter((s) => String(s.machineId) === String(m._id));
        const mExpenses = expenses.filter((e) => String(e.machineId) === String(m._id));

        const totalSecs = mSessions.reduce((acc, s) => acc + (s.totalWorkedSeconds || 0), 0);
        const revenue = mSessions.reduce((acc, s) => acc + (s.finalAmount || s.estimatedAmount || 0), 0);
        const contractor = mSessions.reduce((acc, s) => acc + (s.contractorAmount || 0), 0);
        const expAmount = mExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        return {
          machineName: m.machineName,
          machineNumber: m.machineNumber,
          operator: m.assignedUser ? m.assignedUser.name : 'Unassigned',
          projects: mSessions.length,
          hours: Number((totalSecs / 3600).toFixed(2)),
          revenue: Math.round(revenue * 100) / 100,
          contractorCost: Math.round(contractor * 100) / 100,
          expenses: Math.round(expAmount * 100) / 100,
          netProfit: calculateNetProfit(revenue, contractor, expAmount),
        };
      });

      return { columns, rows, sheetName: 'Machine-wise Report' };
    }

    case 'payment':
    case 'advance_payment':
    case 'outstanding_balance': {
      const sessions = await WorkSession.find(dateQuery).populate('machineId', 'machineName machineNumber').populate('userId', 'name userId');

      let filtered = sessions;
      if (reportType === 'advance_payment') {
        filtered = sessions.filter((s) => (s.advanceAmount || 0) > 0);
      } else if (reportType === 'outstanding_balance') {
        filtered = sessions.filter((s) => {
          const target = s.finalAmount || s.estimatedAmount || 0;
          const paid = s.totalPaidAmount || 0;
          return target - paid > 0;
        });
      }

      const columns = [
        { header: 'Work ID', key: 'workId', width: 24 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Customer Mobile', key: 'customerMobile', width: 16 },
        { header: 'Final Amount (Rs)', key: 'finalAmount', width: 18 },
        { header: 'Advance Paid (Rs)', key: 'advancePaid', width: 18 },
        { header: 'Total Paid (Rs)', key: 'totalPaid', width: 18 },
        { header: 'Remaining Balance (Rs)', key: 'remainingBalance', width: 22 },
        { header: 'Payment Status', key: 'paymentStatus', width: 16 },
      ];

      const rows = filtered.map((s) => {
        const target = s.finalAmount || s.estimatedAmount || 0;
        const totalPaid = s.totalPaidAmount || 0;
        return {
          workId: String(s._id),
          customerName: s.customerName,
          customerMobile: s.customerMobile,
          finalAmount: target,
          advancePaid: s.advanceAmount || 0,
          totalPaid,
          remainingBalance: calculateRemainingBalance(target, totalPaid),
          paymentStatus: s.paymentStatus,
        };
      });

      return {
        columns,
        rows,
        sheetName: reportType === 'advance_payment' ? 'Advance Payments' : reportType === 'outstanding_balance' ? 'Outstanding Balances' : 'Payments Report',
      };
    }

    default:
      return await getReportData('work', filters);
  }
};

export const exportReportToExcel = async (reportType, filters = {}) => {
  const { columns, rows, sheetName } = await getReportData(reportType, filters);
  return await generateExcelWorkbook({ sheetName, columns, data: rows });
};
