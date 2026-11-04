import { Router } from 'express';
import * as masterDataController from '../controllers/masterDataController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { masterDataSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', masterDataController.getMasterData);
router.patch('/', requireAdmin, validate({ body: masterDataSchema }), masterDataController.updateMasterData);

export default router;
