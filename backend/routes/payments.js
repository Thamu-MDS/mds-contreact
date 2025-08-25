import express from 'express';
import {
  getAllPayments,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentById
} from '../controllers/payments.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPayments) // Supports query parameter ?projectOwner=ownerId
  .post(authorize('admin'), createPayment);

router.get('/all', authorize('admin'), getAllPayments);

router
  .route('/:id')
  .get(getPaymentById)
  .put(authorize('admin'), updatePayment)
  .delete(authorize('admin'), deletePayment);

export default router;