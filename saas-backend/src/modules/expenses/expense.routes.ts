import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', ExpenseController.createExpense);
router.get('/', ExpenseController.getExpenses);
router.get('/summary', ExpenseController.getSummary);
router.get('/categories', ExpenseController.getCategories);
router.get('/:id', ExpenseController.getExpenseById);
router.put('/:id', ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export default router;
