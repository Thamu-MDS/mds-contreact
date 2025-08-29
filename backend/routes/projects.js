const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getFinanceSummary,
  processPayment,
  assignWorkers,
  getAssignedWorkers
} = require('../controllers/projectsController');
const { protect, admin } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllProjects)
  .post(protect, admin, validateProject, createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, admin, validateProject, updateProject)
  .delete(protect, admin, deleteProject);

router.route('/:id/finance-summary')
  .get(protect, getFinanceSummary);

router.route('/:id/process-payment')
  .post(protect, admin, processPayment);

router.route('/:id/assign-workers')
  .post(protect, admin, assignWorkers);

router.route('/:id/assigned-workers')
  .get(protect, getAssignedWorkers);

module.exports = router;