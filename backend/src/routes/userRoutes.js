import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/', validate({ body: createUserSchema }), userController.createUser);
router.get('/combined', userController.getCombinedUsers);
router.get('/:id/details', userController.getUserMachineDetail);
router.patch('/:id', validate({ body: updateUserSchema }), userController.updateUser);
router.post('/:id/reset-password', validate({ body: resetPasswordSchema }), userController.resetPassword);
router.patch('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

export default router;
