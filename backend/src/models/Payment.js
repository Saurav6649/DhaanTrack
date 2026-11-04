import mongoose from 'mongoose';
import { PAYMENT_MODES, PAYMENT_TYPES } from '../config/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    workSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkSession',
      required: [true, 'Work session ID is required'],
      index: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      required: [true, 'Payment type is required'],
      default: PAYMENT_TYPES.PARTIAL,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PAYMENT_MODES),
      required: [true, 'Payment mode is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    utrNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
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

paymentSchema.index({ workSessionId: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
