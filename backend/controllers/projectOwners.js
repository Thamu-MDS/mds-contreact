import asyncHandler from 'express-async-handler';
import ProjectOwner from '../models/ProjectOwner.js';
import Project from '../models/Project.js';

export const getProjectOwners = asyncHandler(async (req, res) => {
  const owners = await ProjectOwner.find({}).sort({ createdAt: -1 });
  res.json(owners);
});

export const getProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    res.json(owner);
  } else {
    res.status(404).json({ message: 'Project owner not found' });
  }
});

export const createProjectOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, totalProjectValue } = req.body;
  
  // Check if owner already exists with same email or phone
  const existingOwner = await ProjectOwner.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }]
  });
  
  if (existingOwner) {
    res.status(400);
    throw new Error('Project owner with this email or phone already exists');
  }
  
  const owner = new ProjectOwner({
    name,
    email: email.toLowerCase(),
    phone,
    address,
    company: company || '',
    totalProjectValue: totalProjectValue ? parseFloat(totalProjectValue) : 0
  });
  
  const createdOwner = await owner.save();
  res.status(201).json(createdOwner);
});

export const updateProjectOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, totalProjectValue } = req.body;
  
  const owner = await ProjectOwner.findById(req.params.id);

  if (!owner) {
    res.status(404);
    throw new Error('Project owner not found');
  }

  // Check if email or phone already exists for another owner
  const existingOwner = await ProjectOwner.findOne({
    $and: [
      { _id: { $ne: req.params.id } },
      { $or: [{ email: email.toLowerCase() }, { phone }] }
    ]
  });
  
  if (existingOwner) {
    res.status(400);
    throw new Error('Project owner with this email or phone already exists');
  }

  // Update fields
  owner.name = name;
  owner.email = email.toLowerCase();
  owner.phone = phone;
  owner.address = address;
  owner.company = company || '';
  owner.totalProjectValue = totalProjectValue ? parseFloat(totalProjectValue) : 0;

  const updatedOwner = await owner.save();
  res.json(updatedOwner);
});

export const deleteProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    await ProjectOwner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project owner removed' });
  } else {
    res.status(404);
    throw new Error('Project owner not found');
  }
});

export const getProjectsSummary = asyncHandler(async (req, res) => {
  const { sort = 'name' } = req.query;
  const projects = await Project.find({ owner: req.params.id })
    .sort({ [sort]: 1 })
    .populate('assignedWorkers', 'name role');

  const summary = {
    totalProjects: projects.length,
    totalValue: projects.reduce((sum, p) => sum + p.totalAmount, 0),
    totalPaid: projects.reduce((sum, p) => sum + p.paidAmount, 0),
    totalPending: projects.reduce((sum, p) => sum + p.pendingAmount, 0),
    projects
  };

  res.json(summary);
});