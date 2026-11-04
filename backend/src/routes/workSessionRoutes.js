import { Router } from 'express';
import * as workSessionController from '../controllers/workSessionController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createWorkSessionSchema,
  quickMinutesCalcSchema,
  quickTimeCalcSchema,
  fieldEstimateCalcSchema,
  requestDeletionSchema,
  reviewDeletionSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Calculations (available to both Admin and Operators)
router.post('/calc/minutes', validate({ body: quickMinutesCalcSchema }), workSessionController.quickMinutesCalc);
router.post('/calc/time', validate({ body: quickTimeCalcSchema }), workSessionController.quickTimeCalc);
router.post('/calc/field-estimate', validate({ body: fieldEstimateCalcSchema }), workSessionController.fieldEstimateCalc);

// Active timer session
router.get('/active', workSessionController.getActiveSession);

// Admin Deletion Requests listing (must precede :id route)
router.get('/deletion-requests', requireAdmin, workSessionController.getDeletionRequests);

// Work Session lifecycle
router.post('/', validate({ body: createWorkSessionSchema }), workSessionController.createWorkSession);
router.get('/', workSessionController.getWorkSessions);
router.get('/:id', workSessionController.getWorkSessionById);
router.post('/:id/start', workSessionController.startWork);
router.post('/:id/pause', workSessionController.pauseWork);
router.post('/:id/resume', workSessionController.resumeWork);
router.post('/:id/complete', workSessionController.completeWork);
router.post('/:id/request-deletion', validate({ body: requestDeletionSchema }), workSessionController.requestDeletion);
router.post('/:id/review-deletion', requireAdmin, validate({ body: reviewDeletionSchema }), workSessionController.reviewDeletion);
router.delete('/:id', workSessionController.deleteWorkSession);

export default router;
