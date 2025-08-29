const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');

// Get all attendance records
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, projectId, workerId } = req.query;
    let filter = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (workerId) {
      filter.workerId = workerId;
    }
    
    const attendance = await Attendance.find(filter)
      .populate('workerId', 'name role')
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance by ID
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('workerId', 'name role dailySalary')
      .populate('projectId', 'name');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new attendance record
const createAttendance = async (req, res) => {
  try {
    const { workerId, status, overtimeHours } = req.body;
    
    // Check if attendance already exists for this date and worker
    const existingAttendance = await Attendance.findOne({
      date: req.body.date,
      workerId: req.body.workerId
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already recorded for this date' });
    }
    
    const attendance = await Attendance.create(req.body);
    
    // Update worker's pending salary if present
    if (status === 'present') {
      const worker = await Worker.findById(workerId);
      if (worker) {
        let salaryToAdd = worker.dailySalary;
        
        // Add half salary for half day
        if (status === 'halfday') {
          salaryToAdd = worker.dailySalary / 2;
        }
        
        // Add overtime if any
        if (overtimeHours > 0) {
          const overtimeRate = worker.dailySalary / 8; // Assuming 8 hours per day
          salaryToAdd += overtimeHours * overtimeRate;
        }
        
        worker.pendingSalary += salaryToAdd;
        await worker.save();
      }
    }
    
    await attendance.populate('workerId', 'name role');
    await attendance.populate('projectId', 'name');
    
    res.status(201).json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already recorded for this date' });
    }
    console.error('Create attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update attendance record
const updateAttendance = async (req, res) => {
  try {
    const oldAttendance = await Attendance.findById(req.params.id);
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('workerId', 'name role dailySalary')
    .populate('projectId', 'name');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // If status changed, update worker's pending salary
    if (oldAttendance.status !== req.body.status || 
        oldAttendance.overtimeHours !== req.body.overtimeHours) {
      
      const worker = await Worker.findById(attendance.workerId);
      if (worker) {
        // Remove old salary calculation
        let oldSalaryToRemove = 0;
        if (oldAttendance.status === 'present') {
          oldSalaryToRemove = worker.dailySalary;
        } else if (oldAttendance.status === 'halfday') {
          oldSalaryToRemove = worker.dailySalary / 2;
        }
        
        // Remove old overtime
        if (oldAttendance.overtimeHours > 0) {
          const overtimeRate = worker.dailySalary / 8;
          oldSalaryToRemove += oldAttendance.overtimeHours * overtimeRate;
        }
        
        worker.pendingSalary -= oldSalaryToRemove;
        
        // Add new salary calculation
        let newSalaryToAdd = 0;
        if (attendance.status === 'present') {
          newSalaryToAdd = worker.dailySalary;
        } else if (attendance.status === 'halfday') {
          newSalaryToAdd = worker.dailySalary / 2;
        }
        
        // Add new overtime
        if (attendance.overtimeHours > 0) {
          const overtimeRate = worker.dailySalary / 8;
          newSalaryToAdd += attendance.overtimeHours * overtimeRate;
        }
        
        worker.pendingSalary += newSalaryToAdd;
        await worker.save();
      }
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Remove salary from worker's pending salary
    if (attendance.status === 'present' || attendance.status === 'halfday') {
      const worker = await Worker.findById(attendance.workerId);
      if (worker) {
        let salaryToRemove = 0;
        if (attendance.status === 'present') {
          salaryToRemove = worker.dailySalary;
        } else if (attendance.status === 'halfday') {
          salaryToRemove = worker.dailySalary / 2;
        }
        
        // Remove overtime if any
        if (attendance.overtimeHours > 0) {
          const overtimeRate = worker.dailySalary / 8;
          salaryToRemove += attendance.overtimeHours * overtimeRate;
        }
        
        worker.pendingSalary -= salaryToRemove;
        await worker.save();
      }
    }
    
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record removed' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'date' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    let groupStage = {};
    
    if (groupBy === 'date') {
      groupStage = {
        _id: { 
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } 
        },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
        },
        halfday: {
          $sum: { $cond: [{ $eq: ["$status", "halfday"] }, 1, 0] }
        },
        total: { $sum: 1 }
      };
    } else if (groupBy === 'worker') {
      groupStage = {
        _id: "$workerId",
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
        },
        halfday: {
          $sum: { $cond: [{ $eq: ["$status", "halfday"] }, 1, 0] }
        },
        total: { $sum: 1 }
      };
    } else if (groupBy === 'project') {
      groupStage = {
        _id: "$projectId",
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
        },
        halfday: {
          $sum: { $cond: [{ $eq: ["$status", "halfday"] }, 1, 0] }
        },
        total: { $sum: 1 }
      };
    }
    
    const report = await Attendance.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id": 1 } }
    ]);
    
    // Populate worker or project details if needed
    if (groupBy === 'worker') {
      const populatedReport = await Attendance.populate(report, {
        path: '_id',
        select: 'name role'
      });
      res.json(populatedReport);
    } else if (groupBy === 'project') {
      const populatedReport = await Attendance.populate(report, {
        path: '_id',
        select: 'name'
      });
      res.json(populatedReport);
    } else {
      res.json(report);
    }
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance by worker ID
const getAttendanceByWorkerId = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { workerId: req.params.workerId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(filter)
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance by worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance by project ID
const getAttendanceByProjectId = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { projectId: req.params.projectId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(filter)
      .populate('workerId', 'name role')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance by project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  getAttendanceByWorkerId,
  getAttendanceByProjectId
};