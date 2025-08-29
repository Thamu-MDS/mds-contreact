const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  getAttendanceByWorkerId,
  getAttendanceByProjectId
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/auth');
const { validateAttendance } = require('../middleware/validation');

router.route('/')
  .get(protect, getAllAttendance)
  .post(protect, admin, validateAttendance, createAttendance);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, admin, validateAttendance, updateAttendance)
  .delete(protect, admin, deleteAttendance);

router.route('/report')
  .get(protect, getAttendanceReport);

router.route('/worker/:workerId')
  .get(protect, getAttendanceByWorkerId);

router.route('/project/:projectId')
  .get(protect, getAttendanceByProjectId);

module.exports = router;