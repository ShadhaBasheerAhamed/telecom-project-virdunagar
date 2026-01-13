import { Router } from 'express';
import { getReportSummary, getRevenueReport, getCustomerReport, getPaymentReport } from '../controllers/reportController';

const router = Router();

router.get('/summary', getReportSummary);
router.get('/revenue', getRevenueReport);
router.get('/customers', getCustomerReport);
router.get('/payments', getPaymentReport);

export default router;
