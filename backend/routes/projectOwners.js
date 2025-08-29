const express = require('express');
const router = express.Router();
const {
  getAllProjectOwners,
  getProjectOwnerById,
  createProjectOwner,
  updateProjectOwner,
  deleteProjectOwner,
  getProjectsSummary
} = require('../controllers/projectOwnersController');
const { protect, admin } = require('../middleware/auth');
const { validateProjectOwner } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllProjectOwners)
  .post(protect, admin, validateProjectOwner, createProjectOwner);

router.route('/:id')
  .get(protect, getProjectOwnerById)
  .put(protect, admin, validateProjectOwner, updateProjectOwner)
  .delete(protect, admin, deleteProjectOwner);

router.route('/:id/projects-summary')
  .get(protect, getProjectsSummary);

module.exports = router;