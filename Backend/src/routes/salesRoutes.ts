import { Router } from 'express';
import { getSales, createSale, deleteSale } from '../controllers/salesController';

const router = Router();

router.get('/', getSales);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;
