import express from 'express';
import {
  getSalaries,
  getSalary,
  createSalary,
  updateSalary,
  deleteSalary
} from '../controllers/salaries.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getSalaries)
  .post(authorize('admin'), createSalary);

router
  .route('/:id')
  .get(getSalary)
  .put(authorize('admin'), updateSalary)
  .delete(authorize('admin'), deleteSalary);

export default router;