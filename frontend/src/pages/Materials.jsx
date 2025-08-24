import React, { useState, useEffect } from 'react';
import { materialsAPI, projectsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitCost: '',
    quantity: '',
    quality: '',
    projectId: '',
    supplier: '',
    notes: ''
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.getAll();
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await materialsAPI.update(editingMaterial._id, formData);
      } else {
        await materialsAPI.create(formData);
      }
      fetchMaterials();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category,
      unitCost: material.unitCost,
      quantity: material.quantity,
      quality: material.quality || '',
      projectId: material.projectId._id || material.projectId,
      supplier: material.supplier || '',
      notes: material.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (material) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await materialsAPI.delete(material._id);
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unitCost: '',
      quantity: '',
      quality: '',
      projectId: '',
      supplier: '',
      notes: ''
    });
    setEditingMaterial(null);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
    { key: 'name', title: 'Material Name' },
    { key: 'category', title: 'Category' },
    { 
      key: 'projectId', 
      title: 'Project',
      render: (value) => value?.name || 'N/A'
    },
    { 
      key: 'unitCost', 
      title: 'Unit Cost',
      render: (value) => formatCurrency(value)
    },
    { key: 'quantity', title: 'Quantity' },
    { 
      key: 'totalCost', 
      title: 'Total Cost',
      render: (value) => formatCurrency(value)
    },
    { key: 'supplier', title: 'Supplier' },
    { 
      key: 'purchaseDate', 
      title: 'Purchase Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Material
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={materials}
          onEdit={isAdmin ? handleEdit : null}
          onDelete={isAdmin ? handleDelete : null}
          showActions={isAdmin}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Cement, Steel, Wood"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              required
              className="input-field"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                required
                className="input-field"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                className="input-field"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quality/Grade</label>
            <input
              type="text"
              className="input-field"
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              className="input-field"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          {formData.unitCost && formData.quantity && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">
                Total Cost: ₹{(formData.unitCost * formData.quantity).toLocaleString('en-IN')}
              </p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingMaterial ? 'Update Material' : 'Add Material'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Materials;