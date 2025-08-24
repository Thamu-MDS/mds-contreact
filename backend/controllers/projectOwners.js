import asyncHandler from 'express-async-handler';
import ProjectOwner from '../models/ProjectOwner.js';
import Project from '../models/Project.js';

export const getProjectOwners = asyncHandler(async (req, res) => {
  const owners = await ProjectOwner.find({});
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
  const owner = new ProjectOwner(req.body);
  const createdOwner = await owner.save();
  res.status(201).json(createdOwner);
});

export const updateProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    Object.assign(owner, req.body);
    const updatedOwner = await owner.save();
    res.json(updatedOwner);
  } else {
    res.status(404).json({ message: 'Project owner not found' });
  }
});

export const deleteProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    await ProjectOwner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project owner removed' });
  } else {
    res.status(404).json({ message: 'Project owner not found' });
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