import express from 'express';
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport
} from '../controllers/attendance.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAttendance)
  .post(authorize('admin'), createAttendance);

router
  .route('/:id')
  .put(authorize('admin'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

router.get('/report', getAttendanceReport);

export default router;