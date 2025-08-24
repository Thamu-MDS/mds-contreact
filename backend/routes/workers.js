import express from 'express';
import {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker
} from '../controllers/workers.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getWorkers)
  .post(authorize('admin'), createWorker);

router
  .route('/:id')
  .get(getWorker)
  .put(authorize('admin'), updateWorker)
  .delete(authorize('admin'), deleteWorker);

export default router;