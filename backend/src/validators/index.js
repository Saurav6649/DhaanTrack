import { z } from 'zod';
import { ROLES, EXPENSE_CATEGORIES, PAYMENT_MODES, PAYMENT_TYPES, WORK_STATUS } from '../config/constants.js';

// Auth Schemas
export const loginSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

// User Schemas
export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  userId: z.string().trim().min(3, 'User ID must be at least 3 characters').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile must be a valid 10-digit number'),
  assignedMachine: z.string().optional().nullable(),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER]).default(ROLES.USER),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  mobile: z.string().trim().regex(/^\d{10}$/).optional(),
  assignedMachine: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Machine Schemas
export const createMachineSchema = z.object({
  machineName: z.string().trim().min(1, 'Machine name is required'),
  machineNumber: z.string().trim().min(1, 'Machine number is required').toUpperCase(),
  capacityPerHour: z.number().positive('Capacity must be greater than zero').default(1.0),
  customerHourlyRate: z.number().min(0, 'Customer hourly rate cannot be negative'),
  contractorHourlyRate: z.number().min(0, 'Contractor hourly rate cannot be negative'),
  contractorId: z.string().optional().nullable(),
  assignedUser: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
});

export const updateMachineSchema = createMachineSchema.partial();

// Contractor Schemas
export const createContractorSchema = z.object({
  name: z.string().trim().min(2, 'Contractor name is required'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile must be a valid 10-digit number'),
  paymentRate: z.number().min(0, 'Payment rate cannot be negative').default(0),
  assignedMachines: z.array(z.string()).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateContractorSchema = createContractorSchema.partial();

// Work Session Schemas
export const createWorkSessionSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerMobile: z.string().trim().regex(/^\d{10}$/, 'Customer mobile must be 10 digits'),
  fieldLocation: z.string().trim().min(2, 'Field location is required'),
  customerHourlyRate: z.number().positive('Customer rate must be greater than zero').optional(),
  fieldAreaKatha: z.number().min(0).optional().default(0),
  fieldAreaAcre: z.number().min(0).optional().default(0),
  locationCoordinates: z.object({
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  }).optional(),
  machineId: z.string().optional(), // Required for admin, auto-filled from operator's machine for user
  notes: z.string().max(500).optional().default(''),
});

export const requestDeletionSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
});

export const reviewDeletionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().trim().max(500).optional().default(''),
});

export const updateWorkSessionSchema = z.object({
  customerName: z.string().trim().min(2).optional(),
  customerMobile: z.string().trim().regex(/^\d{10}$/).optional(),
  fieldLocation: z.string().trim().min(2).optional(),
  notes: z.string().max(500).optional(),
});

// Calculator Validation Schemas
export const quickMinutesCalcSchema = z.object({
  totalMinutes: z.number().min(1, 'Total minutes must be at least 1'),
  hourlyRate: z.number().positive('Hourly rate must be greater than zero'),
});

export const quickTimeCalcSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'),
  hourlyRate: z.number().positive('Hourly rate must be greater than zero'),
});

export const fieldEstimateCalcSchema = z.object({
  katha: z.number().min(0).optional().default(0),
  acre: z.number().min(0).optional().default(0),
  kathaPerAcre: z.number().positive().optional(),
  capacityPerHour: z.number().positive().optional(),
  customerHourlyRate: z.number().positive('Customer hourly rate must be greater than zero'),
});

// Expense Schemas
export const createExpenseSchema = z.object({
  machineId: z.string().optional(), // Derived for operator
  workSessionId: z.string().optional().nullable(),
  category: z.enum(EXPENSE_CATEGORIES),
  note: z.string().max(300).optional().default(''),
  amount: z.number().positive('Amount must be greater than zero'),
  expenseDate: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  note: z.string().max(300).optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().optional(),
});

// Payment Schemas
export const createPaymentSchema = z.object({
  workSessionId: z.string().min(1, 'Work session ID is required'),
  paymentType: z.enum(Object.values(PAYMENT_TYPES)).default(PAYMENT_TYPES.PARTIAL),
  paymentMode: z.enum(Object.values(PAYMENT_MODES)),
  amount: z.number().positive('Amount must be greater than zero'),
  utrNumber: z.string().trim().max(100).optional().default(''),
  paymentDate: z.string().optional(),
  notes: z.string().max(300).optional().default(''),
});

// Master Data Schema
export const masterDataSchema = z.object({
  key: z.string().trim().min(1),
  value: z.any(),
  description: z.string().optional(),
});

// Customer Management & Sharing Schemas
export const createCustomerSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  mobileNumber: z.string().trim().regex(/^\d{10}$/, 'Mobile number must be a valid 10-digit number'),
  localArea: z.string().trim().min(1, 'Local area or village is required').max(200),
  landAreaAcres: z.coerce.number().min(0.1, 'Khet ka Area (Acre) must be at least 0.1 Acre'),
  remark: z.string().trim().max(500).optional().default(''),
  shareWithUsers: z.array(z.string()).optional().default([]),
});

export const updateCustomerSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name cannot be empty').max(120).optional(),
  mobileNumber: z.string().trim().regex(/^\d{10}$/, 'Mobile number must be 10 digits').optional(),
  localArea: z.string().trim().min(1, 'Local area cannot be empty').max(200).optional(),
  landAreaAcres: z.coerce.number().min(0.1, 'Khet ka Area (Acre) must be at least 0.1 Acre').optional(),
  remark: z.string().trim().max(500).optional(),
  shareWithUsers: z.array(z.string()).optional(),
});

export const shareCustomerSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user must be selected to share'),
});
