import asyncHandler from 'express-async-handler';
import Project from '../models/Project.js';
import Material from '../models/Material.js';
import Salary from '../models/Salary.js';
import Payment from '../models/Payment.js';

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({})
    .populate('owner', 'name email')
    .populate('assignedWorkers', 'name role');
  res.json(projects);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner')
    .populate('assignedWorkers');

  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ message: 'Project not found' });
  }
});

export const createProject = asyncHandler(async (req, res) => {
  const project = new Project(req.body);
  const createdProject = await project.save();
  res.status(201).json(createdProject);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    Object.assign(project, req.body);
    const updatedProject = await project.save();
    res.json(updatedProject);
  } else {
    res.status(404).json({ message: 'Project not found' });
  }
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project removed' });
  } else {
    res.status(404).json({ message: 'Project not found' });
  }
});

export const getFinanceSummary = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const materials = await Material.find({ projectId: req.params.id });
  const salaries = await Salary.find({ projectId: req.params.id });

  const materialCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
  const salaryCost = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const profit = project.totalAmount - (materialCost + salaryCost);

  res.json({
    project: {
      name: project.name,
      totalAmount: project.totalAmount,
      paidAmount: project.paidAmount,
      pendingAmount: project.pendingAmount
    },
    costs: {
      materials: materialCost,
      salaries: salaryCost,
      total: materialCost + salaryCost
    },
    profit,
    profitMargin: project.totalAmount > 0 ? ((profit / project.totalAmount) * 100).toFixed(2) : 0
  });
});

export const processPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMode, reference, notes, isAdvance } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const payment = new Payment({
    projectId: req.params.id,
    amount,
    paymentMode,
    reference,
    notes,
    isAdvance
  });

  await payment.save();

  project.paidAmount += amount;
  project.pendingAmount = project.totalAmount - project.paidAmount;
  project.payments.push({
    amount,
    date: new Date(),
    method: paymentMode,
    reference
  });

  await project.save();

  res.json({ message: 'Payment processed successfully', payment });
});

export const assignWorkers = asyncHandler(async (req, res) => {
  const { workerIds } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  project.assignedWorkers = workerIds;
  await project.save();

  const updatedProject = await Project.findById(req.params.id)
    .populate('assignedWorkers', 'name role');

  res.json(updatedProject);
});