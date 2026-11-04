import mongoose from 'mongoose';
import { WORK_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';

const pauseIntervalSchema = new mongoose.Schema(
  {
    pausedAt: { type: Date, required: true },
    resumedAt: { type: Date, default: null },
  },
  { _id: false }
);

const workSessionSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120,
    },
    customerMobile: {
      type: String,
      required: [true, 'Customer mobile is required'],
      trim: true,
      match: [/^\d{10}$/, 'Customer mobile must be 10 digits'],
    },
    fieldAreaKatha: {
      type: Number,
      default: 0,
      min: 0,
    },
    fieldAreaAcre: {
      type: Number,
      default: 0,
      min: 0,
    },
    fieldLocation: {
      type: String,
      required: [true, 'Field location is required'],
      trim: true,
      maxlength: 200,
    },
    locationCoordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'Machine ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned operator ID is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdByRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WORK_STATUS),
      default: WORK_STATUS.PENDING,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastResumeTime: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    pauseIntervals: [pauseIntervalSchema],
    totalWorkedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerRateSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    contractorRateSnapshot: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contractorAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    deletionRequest: {
      isRequested: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NONE',
        index: true,
      },
      reason: { type: String, default: '' },
      requestedAt: { type: Date, default: null },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedByName: { type: String, default: '' },
      reviewedAt: { type: Date, default: null },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reviewedByName: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedByName: {
      type: String,
      default: null,
    },
    deletedByRole: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
workSessionSchema.index({ machineId: 1, status: 1 });
workSessionSchema.index({ userId: 1, createdAt: -1 });
workSessionSchema.index({ createdAt: -1 });

export const WorkSession = mongoose.model('WorkSession', workSessionSchema);
