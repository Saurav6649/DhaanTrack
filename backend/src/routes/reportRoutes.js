import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/:reportType/export', reportController.exportExcel);
router.get('/:reportType', reportController.getReport);

export default router;
