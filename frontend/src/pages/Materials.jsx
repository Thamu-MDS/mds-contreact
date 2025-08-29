import React, { useState, useEffect } from 'react';
import { materialsAPI, projectsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'pcs',
    unitPrice: '',
    projectId: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialsAPI.getAll();
      console.log('Materials response:', response);
      
      // Handle different response structures
      const materialsData = response.data || [];
      setMaterials(materialsData);
      setError('');
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      console.log('Fetching projects from API...');
      const response = await projectsAPI.getAll();
      console.log('Projects API response:', response);
      
      // Handle different response structures
      const projectsData = response.data || [];
      console.log('Projects data:', projectsData);
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', error.response);
      setError('Failed to load projects. Please check console for details.');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
      setError(error.response?.data?.message || 'Failed to save material');
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      quantity: material.quantity,
      unit: material.unit || 'pcs',
      unitPrice: material.unitPrice,
      projectId: material.projectId?._id || material.projectId || '',
      supplier: material.supplier || '',
      date: material.date ? new Date(material.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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
        setError('Failed to delete material');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: 'pcs',
      unitPrice: '',
      projectId: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingMaterial(null);
    setError('');
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
    { key: 'name', title: 'Material Name' },
    { 
      key: 'description', 
      title: 'Description',
      render: (value) => value || 'N/A'
    },
    { 
      key: 'projectId', 
      title: 'Project',
      render: (value) => {
        // Handle both populated object and ID string
        if (typeof value === 'object' && value !== null) {
          return value.name || 'N/A';
        } else {
          const project = projects.find(p => p._id === value);
          return project ? (project.name || project.projectName || 'N/A') : 'N/A';
        }
      }
    },
    { 
      key: 'quantity', 
      title: 'Quantity',
      render: (value, row) => `${value} ${row.unit || 'pcs'}`
    },
    { 
      key: 'unitPrice', 
      title: 'Unit Price',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'totalCost', 
      title: 'Total Cost',
      render: (value, row) => {
        if (value) return formatCurrency(value);
        if (row.unitPrice && row.quantity) {
          return formatCurrency(row.unitPrice * row.quantity);
        }
        return 'N/A';
      }
    },
    { 
      key: 'supplier', 
      title: 'Supplier',
      render: (value) => value || 'N/A'
    },
    { 
      key: 'date', 
      title: 'Date',
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError('')}
            className="absolute top-0 right-0 p-2"
          >
            ×
          </button>
        </div>
      )}

      {materials.length === 0 && !loading ? (
        <div className="card text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No materials found</div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add Your First Material
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <Table
            columns={columns}
            data={materials}
            onEdit={isAdmin ? handleEdit : null}
            onDelete={isAdmin ? handleDelete : null}
            showActions={isAdmin}
          />
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cement, Steel Rods, Bricks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the material"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            {projectsLoading ? (
              <div className="input-field flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
                No projects available. Please create a project first.
              </div>
            ) : (
              <select
                required
                className="input-field"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name || project.projectName || `Project ${project._id}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                className="input-field"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                className="input-field"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="ton">Tons</option>
                <option value="m">Meters</option>
                <option value="sqm">Square Meters</option>
                <option value="cum">Cubic Meters</option>
                <option value="ltr">Liters</option>
                <option value="bag">Bags</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                className="input-field"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              className="input-field"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Supplier name"
            />
          </div>
          
          {formData.unitPrice && formData.quantity && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-700">
                Total Cost: ₹{(formData.unitPrice * formData.quantity).toLocaleString('en-IN')}
              </p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={projects.length === 0}
            >
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

          {projects.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm">
              <strong>Note:</strong> You need to create at least one project before adding materials.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Materials;