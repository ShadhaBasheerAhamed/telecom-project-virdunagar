import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense, getProfitLossSummary } from '../controllers/expenseController';

const router = Router();

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/profit-loss', getProfitLossSummary);

export default router;
