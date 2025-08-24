import asyncHandler from 'express-async-handler';
import Worker from '../models/Worker.js';

export const getWorkers = asyncHandler(async (req, res) => {
  const workers = await Worker.find({});
  res.json(workers);
});

export const getWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);

  if (worker) {
    res.json(worker);
  } else {
    res.status(404).json({ message: 'Worker not found' });
  }
});

export const createWorker = asyncHandler(async (req, res) => {
  const worker = new Worker({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    role: req.body.role,
    address: req.body.address,
    dailySalary: req.body.dailySalary,
    monthlySalary: req.body.monthlySalary || 0
  });

  const createdWorker = await worker.save();
  res.status(201).json(createdWorker);
});

export const updateWorker = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    role,
    address,
    dailySalary,
    monthlySalary,
    pendingSalary,
    paymentStatus,
    isActive
  } = req.body;

  const worker = await Worker.findById(req.params.id);

  if (worker) {
    worker.name = name || worker.name;
    worker.phone = phone || worker.phone;
    worker.email = email || worker.email;
    worker.role = role || worker.role;
    worker.address = address || worker.address;
    worker.dailySalary = dailySalary || worker.dailySalary;
    worker.monthlySalary = monthlySalary || worker.monthlySalary;
    worker.pendingSalary = pendingSalary !== undefined ? pendingSalary : worker.pendingSalary;
    worker.paymentStatus = paymentStatus || worker.paymentStatus;
    worker.isActive = isActive !== undefined ? isActive : worker.isActive;

    const updatedWorker = await worker.save();
    res.json(updatedWorker);
  } else {
    res.status(404).json({ message: 'Worker not found' });
  }
});

export const deleteWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);

  if (worker) {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker removed' });
  } else {
    res.status(404).json({ message: 'Worker not found' });
  }
});