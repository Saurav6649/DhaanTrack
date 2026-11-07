import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, requireSuperAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';
import { loginSchema, changePasswordSchema } from '../validators/index.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/superadmin/verify', authenticate, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Super Admin permissions verified.',
    data: {
      user: req.user.toJSON(),
      role: req.user.role,
      permissions: [
        'ALL_PERMISSIONS',
        'SUPER_ADMIN_ACCESS',
        'USER_MANAGEMENT',
        'MACHINE_MANAGEMENT',
        'FINANCIAL_REPORTS',
        'AUDIT_LOGS',
        'SYSTEM_CONFIGURATION',
      ],
    },
  });
});
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.get('/csrf-token', authController.getCsrfToken);

export default router;
