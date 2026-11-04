import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contractor name is required'],
      trim: true,
      maxlength: 100,
    },
    mobile: {
      type: String,
      required: [true, 'Contractor mobile is required'],
      trim: true,
      match: [/^\d{10}$/, 'Mobile must be a valid 10-digit number'],
    },
    paymentRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Payment rate cannot be negative'],
    },
    assignedMachines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Contractor = mongoose.model('Contractor', contractorSchema);
