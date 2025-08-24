import express from 'express';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment
} from '../controllers/payments.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(authorize('admin'), createPayment);

router
  .route('/:id')
  .put(authorize('admin'), updatePayment)
  .delete(authorize('admin'), deletePayment);

export default router;