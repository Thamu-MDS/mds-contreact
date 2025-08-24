import asyncHandler from 'express-async-handler';
import Attendance from '../models/Attendance.js';

export const getAttendance = asyncHandler(async (req, res) => {
  const { workerId, projectId, date } = req.query;
  const filter = {};
  
  if (workerId) filter.workerId = workerId;
  if (projectId) filter.projectId = projectId;
  if (date) filter.date = new Date(date);

  const attendance = await Attendance.find(filter)
    .populate('workerId', 'name role')
    .populate('projectId', 'name')
    .sort({ date: -1 });
  
  res.json(attendance);
});

export const createAttendance = asyncHandler(async (req, res) => {
  const attendance = new Attendance(req.body);
  const createdAttendance = await attendance.save();
  res.status(201).json(createdAttendance);
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (attendance) {
    Object.assign(attendance, req.body);
    const updatedAttendance = await attendance.save();
    res.json(updatedAttendance);
  } else {
    res.status(404).json({ message: 'Attendance record not found' });
  }
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (attendance) {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record removed' });
  } else {
    res.status(404).json({ message: 'Attendance record not found' });
  }
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, workerId } = req.query;
  const filter = {};

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (workerId) filter.workerId = workerId;

  const attendance = await Attendance.find(filter)
    .populate('workerId', 'name role')
    .populate('projectId', 'name')
    .sort({ date: -1 });

  const summary = {
    totalDays: attendance.length,
    presentDays: attendance.filter(a => a.status === 'present').length,
    absentDays: attendance.filter(a => a.status === 'absent').length,
    halfDays: attendance.filter(a => a.status === 'halfday').length,
    totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
  };

  res.json({ summary, attendance });
});