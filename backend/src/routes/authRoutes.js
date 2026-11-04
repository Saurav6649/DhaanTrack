import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';
import { loginSchema, changePasswordSchema } from '../validators/index.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.get('/csrf-token', authController.getCsrfToken);

export default router;
