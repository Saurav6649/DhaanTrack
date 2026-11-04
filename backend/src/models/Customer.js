import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Mobile number must be a valid 10-digit number'],
    },
    localArea: {
      type: String,
      required: [true, 'Local area or village is required'],
      trim: true,
      maxlength: 200,
    },
    landAreaAcres: {
      type: Number,
      required: [true, 'Khet ka Area (Acre) is required'],
      min: [0.1, 'Land area must be at least 0.1 Acre'],
      default: 1.0,
      index: true,
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'LOW',
      index: true,
    },
    remark: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
    isUpdated: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ customerName: 'text', localArea: 'text', mobileNumber: 'text' });
customerSchema.index({ sharedWith: 1, isDeleted: 1 });
customerSchema.index({ createdBy: 1, isDeleted: 1 });
customerSchema.index({ landAreaAcres: -1, createdAt: -1 });
customerSchema.index({ mobileNumber: 1, isDeleted: 1 });
customerSchema.index({ priority: 1, isDeleted: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
