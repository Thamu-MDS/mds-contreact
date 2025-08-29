const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');

// Get all workers
const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker by ID
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new worker
const createWorker = async (req, res) => {
  try {
    const worker = await Worker.create(req.body);
    res.status(201).json(worker);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Worker with this phone already exists' });
    }
    console.error('Create worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update worker
const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(worker);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Worker with this phone already exists' });
    }
    console.error('Update worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete worker
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Check if worker has attendance records
    const attendanceCount = await Attendance.countDocuments({ workerId: req.params.id });
    if (attendanceCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete worker with attendance records' 
      });
    }
    
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker removed' });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker attendance
const getWorkerAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { workerId: req.params.id };
    
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
    console.error('Get worker attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker salary history
const getWorkerSalaryHistory = async (req, res) => {
  try {
    const salaries = await Salary.find({ workerId: req.params.id })
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(salaries);
  } catch (error) {
    console.error('Get worker salary history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerAttendance,
  getWorkerSalaryHistory
};