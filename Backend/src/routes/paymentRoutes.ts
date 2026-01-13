import { Router } from 'express';
import { getPayments, addPayment, updatePayment, deletePayment, checkDuplicatePayment } from '../controllers/paymentController';

const router = Router();

router.get('/', getPayments);
router.post('/', addPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);
router.get('/check-duplicate', checkDuplicatePayment);

export default router;
