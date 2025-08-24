import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getFinanceSummary,
  processPayment,
  assignWorkers
} from '../controllers/projects.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('admin'), createProject);

router
  .route('/:id')
  .get(getProject)
  .put(authorize('admin'), updateProject)
  .delete(authorize('admin'), deleteProject);

router.get('/:id/finance-summary', getFinanceSummary);
router.post('/:id/process-payment', authorize('admin'), processPayment);
router.post('/:id/assign-workers', authorize('admin'), assignWorkers);

export default router;