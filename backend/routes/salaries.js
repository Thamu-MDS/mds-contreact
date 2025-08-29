const express = require('express');
const router = express.Router();
const {
  getAllSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  getSalariesByWorkerId,
  getSalariesByProjectId
} = require('../controllers/salariesController');
const { protect, admin } = require('../middleware/auth');
const { validateSalary } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllSalaries)
  .post(protect, admin, validateSalary, createSalary);

router.route('/:id')
  .get(protect, getSalaryById)
  .put(protect, admin, validateSalary, updateSalary)
  .delete(protect, admin, deleteSalary);

router.route('/worker/:workerId')
  .get(protect, getSalariesByWorkerId);

router.route('/project/:projectId')
  .get(protect, getSalariesByProjectId);

module.exports = router;