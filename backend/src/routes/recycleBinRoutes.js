import { Router } from 'express';
import * as recycleBinController from '../controllers/recycleBinController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Recycle bin is restricted to Admin
router.use(authenticate, requireAdmin);

router.get('/', recycleBinController.getDeletedRecords);
router.delete('/permanent-batch', recycleBinController.permanentDeleteBatch);
router.delete('/permanent-category/:category', recycleBinController.permanentDeleteCategory);
router.delete('/permanent/:module/:id', recycleBinController.permanentDeleteRecord);
router.post('/restore/:module/:id', recycleBinController.restoreRecord);

export default router;
