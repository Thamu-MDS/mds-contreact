import express from 'express';
import {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '../controllers/materials.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMaterials)
  .post(authorize('admin'), createMaterial);

router
  .route('/:id')
  .get(getMaterial)
  .put(authorize('admin'), updateMaterial)
  .delete(authorize('admin'), deleteMaterial);

export default router;