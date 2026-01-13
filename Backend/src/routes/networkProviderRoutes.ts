import { Router } from 'express';
import { getNetworkProviders, createNetworkProvider, updateNetworkProvider, deleteNetworkProvider } from '../controllers/networkProviderController';

const router = Router();

router.get('/', getNetworkProviders);
router.post('/', createNetworkProvider);
router.put('/:id', updateNetworkProvider);
router.delete('/:id', deleteNetworkProvider);

export default router;
