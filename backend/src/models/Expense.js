import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES, ROLES } from '../config/constants.js';

const expenseSchema = new mongoose.Schema(
  {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'Machine ID is required'],
      index: true,
    },
    workSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkSession',
      default: null,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: EXPENSE_CATEGORIES,
      index: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Expense amount must be greater than zero'],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
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
    isUpdated: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedByName: {
      type: String,
      default: null,
    },
    updatedByRole: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ machineId: 1, expenseDate: -1 });
expenseSchema.index({ createdBy: 1, expenseDate: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
