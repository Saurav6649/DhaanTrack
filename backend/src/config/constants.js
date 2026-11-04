export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER', // Operator
};

export const WORK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
};

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  ADVANCE_PAID: 'ADVANCE_PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
};

export const PAYMENT_MODES = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

export const PAYMENT_TYPES = {
  ADVANCE: 'ADVANCE',
  PARTIAL: 'PARTIAL',
  FINAL: 'FINAL',
};

export const EXPENSE_CATEGORIES = [
  'Diesel / Fuel',
  'Repair / Maintenance',
  'Driver / Operator Food',
  'Worker Expense',
  'Transportation',
  'Other',
];

export const DEFAULT_CONFIG = {
  kathaPerAcre: 32, // Standard Bihar / Eastern India default: ~32 Katha = 1 Acre (configurable)
  machineCapacityPerHour: 1, // 1 Acre per hour
};
