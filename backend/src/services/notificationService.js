import { Notification } from '../models/Notification.js';

/**
 * Get in-app notifications for authenticated user
 */
export const getUserNotifications = async (userId, { unreadOnly = false, limit = 50, page = 1 } = {}) => {
  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'name userId role')
      .populate('customer', 'customerName mobileNumber localArea landAreaAcres priority remark isDeleted')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    unreadCount,
    total,
    page: Number(page),
  };
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  return { success: true, notification };
};

/**
 * Mark all notifications for user as read
 */
export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { success: true, message: 'All notifications marked as read.' };
};
