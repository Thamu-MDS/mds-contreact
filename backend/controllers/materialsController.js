const Material = require('../models/Material');
const Project = require('../models/Project');

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const { projectId } = req.query;
    let filter = {};
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    const materials = await Material.find(filter)
      .populate('projectId', 'name')
      .sort({ purchaseDate: -1 });
    
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('projectId', 'name totalAmount currentBalance');
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json(material);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new material
const createMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    
    // Update project balance
    const project = await Project.findById(material.projectId);
    if (project) {
      await project.updateBalance(material.totalCost);
    }
    
    await material.populate('projectId', 'name');
    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update material
const updateMaterial = async (req, res) => {
  try {
    const oldMaterial = await Material.findById(req.params.id);
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'name');
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Update project balance if cost changed
    if (oldMaterial.totalCost !== material.totalCost) {
      const project = await Project.findById(material.projectId);
      if (project) {
        // Add back the old cost and subtract the new cost
        project.currentBalance += oldMaterial.totalCost;
        project.currentBalance -= material.totalCost;
        await project.save();
      }
    }
    
    res.json(material);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Add back the cost to project balance
    const project = await Project.findById(material.projectId);
    if (project) {
      project.currentBalance += material.totalCost;
      await project.save();
    }
    
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material removed' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
};