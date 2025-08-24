import express from 'express';
import {
  getProjectOwners,
  getProjectOwner,
  createProjectOwner,
  updateProjectOwner,
  deleteProjectOwner,
  getProjectsSummary
} from '../controllers/projectOwners.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProjectOwners)
  .post(authorize('admin'), createProjectOwner);

router
  .route('/:id')
  .get(getProjectOwner)
  .put(authorize('admin'), updateProjectOwner)
  .delete(authorize('admin'), deleteProjectOwner);

router.get('/:id/projects-summary', getProjectsSummary);

export default router;