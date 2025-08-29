const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getFinancialReport,
  getWorkerPerformanceReport,
  getSalaryReport,
  getAttendanceReport
} = require('../controllers/reportsController');
const { protect, admin } = require('../middleware/auth');

router.route('/dashboard')
  .get(protect, getDashboardStats);

router.route('/financial')
  .get(protect, getFinancialReport);

router.route('/worker-performance')
  .get(protect, getWorkerPerformanceReport);

router.route('/salary')
  .get(protect, getSalaryReport);

router.route('/attendance')
  .get(protect, getAttendanceReport);

module.exports = router;