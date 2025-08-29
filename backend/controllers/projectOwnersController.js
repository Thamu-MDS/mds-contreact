const ProjectOwner = require('../models/ProjectOwner');
const Project = require('../models/Project');
const Payment = require('../models/Payment');

// Get all project owners
const getAllProjectOwners = async (req, res) => {
  try {
    const owners = await ProjectOwner.find().sort({ createdAt: -1 });
    res.json(owners);
  } catch (error) {
    console.error('Get project owners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project owner by ID
const getProjectOwnerById = async (req, res) => {
  try {
    const owner = await ProjectOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Project owner not found' });
    }
    res.json(owner);
  } catch (error) {
    console.error('Get project owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new project owner
const createProjectOwner = async (req, res) => {
  try {
    const owner = await ProjectOwner.create(req.body);
    res.status(201).json(owner);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project owner with this phone already exists' });
    }
    console.error('Create project owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project owner
const updateProjectOwner = async (req, res) => {
  try {
    const owner = await ProjectOwner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!owner) {
      return res.status(404).json({ message: 'Project owner not found' });
    }
    
    res.json(owner);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project owner with this phone already exists' });
    }
    console.error('Update project owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project owner
const deleteProjectOwner = async (req, res) => {
  try {
    const owner = await ProjectOwner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Project owner not found' });
    }
    
    // Check if owner has projects
    const projectCount = await Project.countDocuments({ ownerId: req.params.id });
    if (projectCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project owner with associated projects' 
      });
    }
    
    await ProjectOwner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project owner removed' });
  } catch (error) {
    console.error('Delete project owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects summary for owner
const getProjectsSummary = async (req, res) => {
  try {
    const { sort = 'name' } = req.query;
    
    const projects = await Project.find({ ownerId: req.params.id })
      .populate('assignedWorkers', 'name role')
      .sort(sort);
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjectOwners,
  getProjectOwnerById,
  createProjectOwner,
  updateProjectOwner,
  deleteProjectOwner,
  getProjectsSummary
};