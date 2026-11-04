import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  shareCustomerSchema,
} from '../validators/index.js';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Create Customer (User & Admin permitted)
router.post('/', validate({ body: createCustomerSchema }), customerController.createCustomer);

// View Customer Records (User & Admin permitted)
router.get('/shareable-users', customerController.getShareableUsers);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);

// Edit Customer Details (User & Admin permitted)
router.patch('/:id', validate({ body: updateCustomerSchema }), customerController.updateCustomer);
router.put('/:id', validate({ body: updateCustomerSchema }), customerController.updateCustomer);

// Share Customer With Additional Users (User & Admin permitted)
router.post('/:id/share', validate({ body: shareCustomerSchema }), customerController.shareCustomer);

// Delete Customer (Strictly ADMIN ONLY - enforced by requireAdmin middleware and service level check)
router.delete('/:id', requireAdmin, customerController.deleteCustomer);

export default router;
