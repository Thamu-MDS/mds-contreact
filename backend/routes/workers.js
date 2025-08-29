const express = require('express');
const router = express.Router();
const {
  getAllWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerAttendance,
  getWorkerSalaryHistory
} = require('../controllers/workersController');
const { protect, admin } = require('../middleware/auth');
const { validateWorker } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllWorkers)
  .post(protect, admin, validateWorker, createWorker);

router.route('/:id')
  .get(protect, getWorkerById)
  .put(protect, admin, validateWorker, updateWorker)
  .delete(protect, admin, deleteWorker);

router.route('/:id/attendance')
  .get(protect, getWorkerAttendance);

router.route('/:id/salaries')
  .get(protect, getWorkerSalaryHistory);

module.exports = router;