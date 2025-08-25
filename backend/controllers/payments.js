import asyncHandler from 'express-async-handler';
import Payment from '../models/Payment.js';
import ProjectOwner from '../models/ProjectOwner.js';

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().sort({ date: -1 });
  res.json(payments);
});

export const getPayments = asyncHandler(async (req, res) => {
  const { projectOwner } = req.query;
  const filter = projectOwner ? { projectOwner } : {};

  const payments = await Payment.find(filter)
    .populate('projectOwner', 'name company')
    .sort({ date: -1 });
  
  res.json(payments);
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = new Payment(req.body);
  const createdPayment = await payment.save();

  // Update project owner's paid amount
  const projectOwner = await ProjectOwner.findById(req.body.projectOwner);
  if (projectOwner) {
    // Calculate total paid amount for this owner
    const payments = await Payment.find({ projectOwner: req.body.projectOwner });
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    projectOwner.paidAmount = totalPaid;
    projectOwner.balanceAmount = projectOwner.totalProjectValue - totalPaid;
    await projectOwner.save();
  }

  res.status(201).json(createdPayment);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    Object.assign(payment, req.body);
    const updatedPayment = await payment.save();

    // Update project owner's paid amount after payment update
    const projectOwner = await ProjectOwner.findById(payment.projectOwner);
    if (projectOwner) {
      const payments = await Payment.find({ projectOwner: payment.projectOwner });
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      projectOwner.paidAmount = totalPaid;
      projectOwner.balanceAmount = projectOwner.totalProjectValue - totalPaid;
      await projectOwner.save();
    }

    res.json(updatedPayment);
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    const projectOwnerId = payment.projectOwner;
    await Payment.findByIdAndDelete(req.params.id);

    // Update project owner's paid amount after payment deletion
    const projectOwner = await ProjectOwner.findById(projectOwnerId);
    if (projectOwner) {
      const payments = await Payment.find({ projectOwner: projectOwnerId });
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      projectOwner.paidAmount = totalPaid;
      projectOwner.balanceAmount = projectOwner.totalProjectValue - totalPaid;
      await projectOwner.save();
    }

    res.json({ message: 'Payment removed' });
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('projectOwner', 'name company');
  
  if (payment) {
    res.json(payment);
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
});