import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createPaymentSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createPaymentSchema }), paymentController.createPayment);
router.get('/session/:workSessionId', paymentController.getPaymentsBySession);
router.delete('/:id', paymentController.deletePayment);

export default router;
