import asyncHandler from 'express-async-handler';
import Salary from '../models/Salary.js';
import Worker from '../models/Worker.js';

export const getSalaries = asyncHandler(async (req, res) => {
  const { workerId, projectId } = req.query;
  const filter = {};
  
  if (workerId) filter.workerId = workerId;
  if (projectId) filter.projectId = projectId;

  const salaries = await Salary.find(filter)
    .populate('workerId', 'name role')
    .populate('projectId', 'name');
  
  res.json(salaries);
});

export const getSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id)
    .populate('workerId', 'name role')
    .populate('projectId', 'name');

  if (salary) {
    res.json(salary);
  } else {
    res.status(404).json({ message: 'Salary record not found' });
  }
});

export const createSalary = asyncHandler(async (req, res) => {
  const salary = new Salary(req.body);
  const createdSalary = await salary.save();

  // Update worker's pending salary
  const worker = await Worker.findById(req.body.workerId);
  if (worker) {
    worker.pendingSalary = Math.max(0, worker.pendingSalary - req.body.amount);
    worker.lastPaymentDate = new Date();
    await worker.save();
  }

  res.status(201).json(createdSalary);
});

export const updateSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);

  if (salary) {
    Object.assign(salary, req.body);
    const updatedSalary = await salary.save();
    res.json(updatedSalary);
  } else {
    res.status(404).json({ message: 'Salary record not found' });
  }
});

export const deleteSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);

  if (salary) {
    await Salary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salary record removed' });
  } else {
    res.status(404).json({ message: 'Salary record not found' });
  }
});