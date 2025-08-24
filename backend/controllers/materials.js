import asyncHandler from 'express-async-handler';
import Material from '../models/Material.js';

export const getMaterials = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const filter = projectId ? { projectId } : {};
  
  const materials = await Material.find(filter).populate('projectId', 'name');
  res.json(materials);
});

export const getMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate('projectId', 'name');

  if (material) {
    res.json(material);
  } else {
    res.status(404).json({ message: 'Material not found' });
  }
});

export const createMaterial = asyncHandler(async (req, res) => {
  const material = new Material(req.body);
  const createdMaterial = await material.save();
  res.status(201).json(createdMaterial);
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (material) {
    Object.assign(material, req.body);
    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } else {
    res.status(404).json({ message: 'Material not found' });
  }
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (material) {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material removed' });
  } else {
    res.status(404).json({ message: 'Material not found' });
  }
});