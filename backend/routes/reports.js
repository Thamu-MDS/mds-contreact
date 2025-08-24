import express from 'express';
import {
  getDashboard,
  getFinancialReport,
  getWorkerPerformanceReport
} from '../controllers/reports.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/financial', getFinancialReport);
router.get('/worker-performance', getWorkerPerformanceReport);

export default router;