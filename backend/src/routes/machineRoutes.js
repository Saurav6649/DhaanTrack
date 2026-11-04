import { Router } from 'express';
import * as machineController from '../controllers/machineController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createMachineSchema, updateMachineSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/', validate({ body: createMachineSchema }), machineController.createMachine);
router.get('/', machineController.getAllMachines);
router.get('/:id', machineController.getMachineById);
router.patch('/:id', validate({ body: updateMachineSchema }), machineController.updateMachine);
router.delete('/:id', machineController.deleteMachine);

export default router;
