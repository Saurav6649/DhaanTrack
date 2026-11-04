import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await notificationService.getUserNotifications(req.user._id, {
      unreadOnly,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const result = await notificationService.markNotificationRead(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
