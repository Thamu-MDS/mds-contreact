import asyncHandler from 'express-async-handler';
import ProjectOwner from '../models/ProjectOwner.js';

export const getProjectOwners = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let filter = {};
  
  // Add search functionality
  if (search) {
    filter = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  const owners = await ProjectOwner.find(filter).sort({ createdAt: -1 });
  res.json(owners);
});

export const getProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    res.json(owner);
  } else {
    res.status(404);
    throw new Error('Project owner not found');
  }
});

export const createProjectOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, projectName, totalProjectValue } = req.body;
  
  // Check if owner already exists with same email or phone
  const existingOwnerByEmail = await ProjectOwner.findOne({ email: email.toLowerCase() });
  const existingOwnerByPhone = await ProjectOwner.findOne({ phone });
  
  if (existingOwnerByEmail) {
    res.status(400);
    throw new Error('Project owner with this email already exists');
  }
  
  if (existingOwnerByPhone) {
    res.status(400);
    throw new Error('Project owner with this phone number already exists');
  }
  
  const owner = new ProjectOwner({
    name,
    email: email.toLowerCase(),
    phone,
    address,
    company: company || '',
    projectName: projectName || '',
    totalProjectValue: totalProjectValue ? parseFloat(totalProjectValue) : 0
  });
  
  const createdOwner = await owner.save();
  res.status(201).json(createdOwner);
});

export const updateProjectOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, projectName, totalProjectValue } = req.body;
  
  const owner = await ProjectOwner.findById(req.params.id);

  if (!owner) {
    res.status(404);
    throw new Error('Project owner not found');
  }

  // Check if email already exists for another owner
  if (email !== owner.email) {
    const existingOwnerByEmail = await ProjectOwner.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: req.params.id } 
    });
    
    if (existingOwnerByEmail) {
      res.status(400);
      throw new Error('Project owner with this email already exists');
    }
  }

  // Check if phone already exists for another owner
  if (phone !== owner.phone) {
    const existingOwnerByPhone = await ProjectOwner.findOne({ 
      phone, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingOwnerByPhone) {
      res.status(400);
      throw new Error('Project owner with this phone number already exists');
    }
  }

  // Update fields
  owner.name = name;
  owner.email = email.toLowerCase();
  owner.phone = phone;
  owner.address = address;
  owner.company = company || '';
  owner.projectName = projectName || '';
  owner.totalProjectValue = totalProjectValue ? parseFloat(totalProjectValue) : 0;

  const updatedOwner = await owner.save();
  res.json(updatedOwner);
});

export const deleteProjectOwner = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);

  if (owner) {
    await ProjectOwner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project owner removed successfully' });
  } else {
    res.status(404);
    throw new Error('Project owner not found');
  }
});

export const getProjectsSummary = asyncHandler(async (req, res) => {
  const owner = await ProjectOwner.findById(req.params.id);
  
  if (!owner) {
    res.status(404);
    throw new Error('Project owner not found');
  }

  // For now, we'll return the owner's data since we don't have a separate Project model
  // In a real application, you would query the Project model for projects owned by this owner
  const summary = {
    totalProjects: 1, // Placeholder - would be count of projects in a real implementation
    totalValue: owner.totalProjectValue || 0,
    totalPaid: 0, // Placeholder - would come from payment records
    totalPending: owner.totalProjectValue || 0, // Placeholder
    projects: [{
      _id: owner._id,
      name: owner.projectName,
      totalAmount: owner.totalProjectValue,
      paidAmount: 0, // Placeholder
      pendingAmount: owner.totalProjectValue, // Placeholder
      status: 'active' // Placeholder
    }]
  };

  res.json(summary);
});

// New function to get project owners for dropdown/select options
export const getProjectOwnersOptions = asyncHandler(async (req, res) => {
  const owners = await ProjectOwner.find({})
    .select('_id name projectName company')
    .sort({ name: 1 });
  
  const options = owners.map(owner => ({
    _id: owner._id,
    name: owner.projectName || owner.name,
    clientName: owner.company || owner.name
  }));
  
  res.json(options);
});