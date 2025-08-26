import express from 'express';
import Attendance from '../models/Attendance.js';
import Worker from '../models/Worker.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all attendance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, workerId, projectId } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (workerId) {
      filter.worker = workerId;
    }

    if (projectId) {
      filter.project = projectId;
    }

    const attendance = await Attendance.find(filter)
      .populate('worker', 'name role dailySalary')
      .populate('project', 'name projectName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single attendance record
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('worker', 'name role dailySalary')
      .populate('project', 'name projectName');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new attendance record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, worker, project, status, overtimeHours, notes } = req.body;

    // Validation
    if (!date || !worker || !project || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if attendance already exists for this worker on this date
    const existingAttendance = await Attendance.findOne({
      worker,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this worker on this date' 
      });
    }

    // Check if worker exists
    const workerExists = await Worker.findById(worker);
    if (!workerExists) {
      return res.status(400).json({ message: 'Worker not found' });
    }

    const attendance = new Attendance({
      date: new Date(date),
      worker,
      project,
      status,
      overtimeHours: overtimeHours || 0,
      notes: notes || ''
    });

    const savedAttendance = await attendance.save();
    
    // Populate the saved record before returning
    const populatedAttendance = await Attendance.findById(savedAttendance._id)
      .populate('worker', 'name role dailySalary')
      .populate('project', 'name projectName');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update attendance record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { date, worker, project, status, overtimeHours, notes } = req.body;

    // Validation
    if (!date || !worker || !project || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if updating would create a duplicate
    const existingAttendance = await Attendance.findOne({
      worker,
      date: new Date(date),
      _id: { $ne: req.params.id }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Another attendance record already exists for this worker on this date' 
      });
    }

    // Update record
    attendance.date = new Date(date);
    attendance.worker = worker;
    attendance.project = project;
    attendance.status = status;
    attendance.overtimeHours = overtimeHours || 0;
    attendance.notes = notes || '';

    const updatedAttendance = await attendance.save();
    
    // Populate the updated record before returning
    const populatedAttendance = await Attendance.findById(updatedAttendance._id)
      .populate('worker', 'name role dailySalary')
      .populate('project', 'name projectName');

    res.json(populatedAttendance);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete attendance record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance report
router.get('/report/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, workerId, projectId } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (workerId) {
      matchStage.worker = workerId;
    }
    
    if (projectId) {
      matchStage.project = projectId;
    }

    const report = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            worker: '$worker',
            status: '$status'
          },
          count: { $sum: 1 },
          totalOvertime: { $sum: '$overtimeHours' }
        }
      },
      {
        $lookup: {
          from: 'workers',
          localField: '_id.worker',
          foreignField: '_id',
          as: 'worker'
        }
      },
      {
        $unwind: '$worker'
      },
      {
        $group: {
          _id: '$_id.worker',
          workerName: { $first: '$worker.name' },
          present: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'present'] }, '$count', 0]
            }
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'absent'] }, '$count', 0]
            }
          },
          halfday: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'halfday'] }, '$count', 0]
            }
          },
          totalOvertime: { $sum: '$totalOvertime' }
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get worker attendance
router.get('/worker/:workerId', authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;
    
    let filter = { worker: workerId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('project', 'name projectName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get project attendance
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    let filter = { project: projectId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('worker', 'name role dailySalary')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;