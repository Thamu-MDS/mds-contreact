const Payment = require('../models/Payment');
const Project = require('../models/Project');

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { projectId, projectOwnerId, startDate, endDate } = req.query;
    let filter = {};
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (projectOwnerId) {
      filter.projectOwnerId = projectOwnerId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Payment.find(filter)
      .populate('projectId', 'name')
      .populate('projectOwnerId', 'name company')
      .sort({ date: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('projectId', 'name currentBalance')
      .populate('projectOwnerId', 'name company');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const { projectId, amount } = req.body;
    
    const payment = await Payment.create(req.body);
    
    // Update project balance if payment is for a specific project
    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        project.currentBalance += amount;
        await project.save();
      }
    }
    
    await payment.populate('projectId', 'name');
    await payment.populate('projectOwnerId', 'name company');
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const oldPayment = await Payment.findById(req.params.id);
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('projectId', 'name currentBalance')
    .populate('projectOwnerId', 'name company');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    // If amount changed and payment is for a project, update project balance
    if (oldPayment.amount !== payment.amount && payment.projectId) {
      const project = await Project.findById(payment.projectId);
      if (project) {
        // Subtract the old amount and add the new amount
        project.currentBalance -= oldPayment.amount;
        project.currentBalance += payment.amount;
        await project.save();
      }
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    // If payment is for a project, update project balance
    if (payment.projectId) {
      const project = await Project.findById(payment.projectId);
      if (project) {
        project.currentBalance -= payment.amount;
        await project.save();
      }
    }
    
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment record removed' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payments by owner ID
const getPaymentsByOwnerId = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { projectOwnerId: req.params.ownerId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Payment.find(filter)
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments by owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByOwnerId
};