const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivities,
  getUpcomingPayments
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.route('/stats')
  .get(protect, getDashboardStats);

router.route('/recent-activities')
  .get(protect, getRecentActivities);

router.route('/upcoming-payments')
  .get(protect, getUpcomingPayments);

module.exports = router;