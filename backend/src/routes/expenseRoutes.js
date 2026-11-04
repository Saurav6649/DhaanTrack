import { Router } from 'express';
import * as expenseController from '../controllers/expenseController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createExpenseSchema }), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/totals', expenseController.getExpenseTotals);
router.patch('/:id', validate({ body: updateExpenseSchema }), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

export default router;
