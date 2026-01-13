import { Router } from 'express';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../controllers/inventoryController';

const router = Router();

router.get('/', getInventoryItems);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
