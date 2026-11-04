import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get in-app notifications for authenticated user
router.get('/', notificationController.getNotifications);

// Mark single notification as read
router.patch('/:id/read', notificationController.markNotificationRead);

// Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllNotificationsRead);

export default router;
