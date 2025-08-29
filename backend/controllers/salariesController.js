const Salary = require('../models/Salary');
const Worker = require('../models/Worker');

// Get all salary records
const getAllSalaries = async (req, res) => {
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
    
    const salaries = await Salary.find(filter)
      .populate('workerId', 'name role')
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(salaries);
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get salary by ID
const getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('workerId', 'name role pendingSalary')
      .populate('projectId', 'name');
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new salary record
const createSalary = async (req, res) => {
  try {
    const { workerId, amount } = req.body;
    
    const salary = await Salary.create(req.body);
    
    // Update worker's pending salary
    const worker = await Worker.findById(workerId);
    if (worker) {
      worker.pendingSalary -= amount;
      if (worker.pendingSalary < 0) {
        worker.pendingSalary = 0;
      }
      await worker.save();
    }
    
    await salary.populate('workerId', 'name role');
    await salary.populate('projectId', 'name');
    
    res.status(201).json(salary);
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update salary record
const updateSalary = async (req, res) => {
  try {
    const oldSalary = await Salary.findById(req.params.id);
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('workerId', 'name role pendingSalary')
    .populate('projectId', 'name');
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // If amount changed, update worker's pending salary
    if (oldSalary.amount !== salary.amount) {
      const worker = await Worker.findById(salary.workerId);
      if (worker) {
        // Add back the old amount and subtract the new amount
        worker.pendingSalary += oldSalary.amount;
        worker.pendingSalary -= salary.amount;
        
        if (worker.pendingSalary < 0) {
          worker.pendingSalary = 0;
        }
        
        await worker.save();
      }
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete salary record
const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Add back the amount to worker's pending salary
    const worker = await Worker.findById(salary.workerId);
    if (worker) {
      worker.pendingSalary += salary.amount;
      await worker.save();
    }
    
    await Salary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salary record removed' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get salaries by worker ID
const getSalariesByWorkerId = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { workerId: req.params.workerId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const salaries = await Salary.find(filter)
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(salaries);
  } catch (error) {
    console.error('Get salaries by worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get salaries by project ID
const getSalariesByProjectId = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { projectId: req.params.projectId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const salaries = await Salary.find(filter)
      .populate('workerId', 'name role')
      .sort({ date: -1 });
    
    res.json(salaries);
  } catch (error) {
    console.error('Get salaries by project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  getSalariesByWorkerId,
  getSalariesByProjectId
};