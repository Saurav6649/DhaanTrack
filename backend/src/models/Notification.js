import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      default: 'CUSTOMER_SHARED',
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Customer Shared With You',
    },
    message: {
      type: String,
      default: '',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    metadata: {
      customerName: { type: String, default: '' },
      mobileNumber: { type: String, default: '' },
      localArea: { type: String, default: '' },
      landAreaAcres: { type: Number, default: 0 },
      priority: { type: String, default: 'LOW' },
      remark: { type: String, default: '' },
      senderName: { type: String, default: '' },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
