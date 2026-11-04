import { Router } from 'express';
import * as contractorController from '../controllers/contractorController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createContractorSchema, updateContractorSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/', validate({ body: createContractorSchema }), contractorController.createContractor);
router.get('/', contractorController.getAllContractors);
router.get('/:id', contractorController.getContractorById);
router.patch('/:id', validate({ body: updateContractorSchema }), contractorController.updateContractor);

export default router;
