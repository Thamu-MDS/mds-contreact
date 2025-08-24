import asyncHandler from 'express-async-handler';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';

export const getPayments = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const filter = projectId ? { projectId } : {};

  const payments = await Payment.find(filter)
    .populate('projectId', 'name clientName')
    .sort({ paymentDate: -1 });
  
  res.json(payments);
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = new Payment(req.body);
  const createdPayment = await payment.save();

  // Update project paid amount
  const project = await Project.findById(req.body.projectId);
  if (project) {
    project.paidAmount += req.body.amount;
    project.pendingAmount = project.totalAmount - project.paidAmount;
    await project.save();
  }

  res.status(201).json(createdPayment);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    Object.assign(payment, req.body);
    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment removed' });
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
});