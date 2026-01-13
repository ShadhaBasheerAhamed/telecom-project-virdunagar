import { Router } from 'express';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../controllers/masterRecordController';

const router = Router();

router.get('/:type', getRecords);
router.post('/:type', createRecord);
router.put('/:type/:id', updateRecord);
router.delete('/:type/:id', deleteRecord);

export default router;
