import { Router } from 'express';
import * as machineController from '../controllers/machineController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createMachineSchema, updateMachineSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Read endpoints accessible to authenticated users & operators
router.get('/', machineController.getAllMachines);
router.get('/:id', machineController.getMachineById);

// Modification endpoints strictly restricted to Admin
router.post('/', requireAdmin, validate({ body: createMachineSchema }), machineController.createMachine);
router.patch('/:id', requireAdmin, validate({ body: updateMachineSchema }), machineController.updateMachine);
router.delete('/:id', requireAdmin, machineController.deleteMachine);

export default router;
