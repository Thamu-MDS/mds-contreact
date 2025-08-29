const Project = require('../models/Project');
const Material = require('../models/Material');
const Payment = require('../models/Payment');
const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('ownerId', 'name company')
      .populate('assignedWorkers', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ownerId', 'name email phone company')
      .populate('assignedWorkers', 'name role dailySalary');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    await project.populate('ownerId', 'name company');
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ownerId', 'name company');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project has materials, payments, or salaries
    const [materialCount, paymentCount, salaryCount] = await Promise.all([
      Material.countDocuments({ projectId: req.params.id }),
      Payment.countDocuments({ projectId: req.params.id }),
      Salary.countDocuments({ projectId: req.params.id })
    ]);
    
    if (materialCount > 0 || paymentCount > 0 || salaryCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project with associated records' 
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get finance summary for project
const getFinanceSummary = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const [materials, payments, salaries, project] = await Promise.all([
      Material.find({ projectId }).select('name totalCost purchaseDate'),
      Payment.find({ projectId }).select('amount date paymentMethod'),
      Salary.find({ projectId }).select('amount date workerId').populate('workerId', 'name'),
      Project.findById(projectId).select('totalAmount currentBalance')
    ]);
    
    const materialCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const salaryCost = salaries.reduce((sum, salary) => sum + salary.amount, 0);
    
    res.json({
      project,
      materials: {
        items: materials,
        totalCost: materialCost
      },
      payments: {
        items: payments,
        totalAmount: totalPayments
      },
      salaries: {
        items: salaries,
        totalAmount: salaryCost
      },
      expenses: materialCost + salaryCost,
      netProfit: totalPayments - (materialCost + salaryCost)
    });
  } catch (error) {
    console.error('Get finance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process payment for project
const processPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, notes, description } = req.body;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create payment record
    const payment = await Payment.create({
      projectId,
      projectOwnerId: project.ownerId,
      amount,
      paymentMethod,
      notes,
      description
    });
    
    // Update project balance
    project.currentBalance += amount;
    await project.save();
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign workers to project
const assignWorkers = async (req, res) => {
  try {
    const { workerIds } = req.body;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Add workers to project (avoid duplicates)
    const uniqueWorkerIds = [...new Set([...project.assignedWorkers.map(id => id.toString()), ...workerIds])];
    project.assignedWorkers = uniqueWorkerIds;
    
    await project.save();
    await project.populate('assignedWorkers', 'name role');
    
    res.json(project);
  } catch (error) {
    console.error('Assign workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assigned workers for project
const getAssignedWorkers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedWorkers', 'name role dailySalary pendingSalary');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project.assignedWorkers);
  } catch (error) {
    console.error('Get assigned workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getFinanceSummary,
  processPayment,
  assignWorkers,
  getAssignedWorkers
};