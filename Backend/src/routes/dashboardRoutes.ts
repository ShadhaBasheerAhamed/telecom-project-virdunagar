import { Router } from 'express';
import { getDashboardStats, getRevenueChart, getCustomerGrowth, getPaymentModeDistribution } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/customer-growth', getCustomerGrowth);
router.get('/payment-modes', getPaymentModeDistribution);

export default router;
