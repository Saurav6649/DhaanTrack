import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    machineName: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
      maxlength: 100,
    },
    machineNumber: {
      type: String,
      required: [true, 'Machine number / plate is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacityPerHour: {
      type: Number,
      required: true,
      default: 1.0, // 1 Acre per hour default
      min: [0.1, 'Capacity must be greater than 0'],
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contractor',
      default: null,
      index: true,
    },
    customerHourlyRate: {
      type: Number,
      required: [true, 'Customer hourly rate is required'],
      min: [0, 'Customer hourly rate cannot be negative'],
    },
    contractorHourlyRate: {
      type: Number,
      required: [true, 'Contractor hourly rate is required'],
      min: [0, 'Contractor hourly rate cannot be negative'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
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

export const Machine = mongoose.model('Machine', machineSchema);
