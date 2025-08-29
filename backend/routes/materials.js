const express = require('express');
const router = express.Router();
const {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materialsController');
const { protect, admin } = require('../middleware/auth');
const { validateMaterial } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllMaterials)
  .post(protect, admin, validateMaterial, createMaterial);

router.route('/:id')
  .get(protect, getMaterialById)
  .put(protect, admin, validateMaterial, updateMaterial)
  .delete(protect, admin, deleteMaterial);

module.exports = router;