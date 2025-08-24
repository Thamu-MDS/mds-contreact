import React, { useState, useEffect } from 'react';
import { projectsAPI, projectOwnersAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [projectOwners, setProjectOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientContact: '',
    totalAmount: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    location: '',
    description: '',
    owner: ''
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProjects();
    fetchProjectOwners();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectOwners = async () => {
    try {
      const response = await projectOwnersAPI.getAll();
      setProjectOwners(response.data);
    } catch (error) {
      console.error('Error fetching project owners:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectsAPI.update(editingProject._id, formData);
      } else {
        await projectsAPI.create(formData);
      }
      fetchProjects();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientName: project.clientName,
      clientContact: project.clientContact,
      totalAmount: project.totalAmount,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      status: project.status,
      location: project.location,
      description: project.description || '',
      owner: project.owner._id || project.owner
    });
    setShowModal(true);
  };

  const handleDelete = async (project) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.delete(project._id);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      clientName: '',
      clientContact: '',
      totalAmount: '',
      startDate: '',
      endDate: '',
      status: 'planning',
      location: '',
      description: '',
      owner: ''
    });
    setEditingProject(null);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
    { key: 'name', title: 'Project Name' },
    { key: 'clientName', title: 'Client' },
    { 
      key: 'owner', 
      title: 'Owner',
      render: (value) => value?.name || 'N/A'
    },
    { 
      key: 'totalAmount', 
      title: 'Total Amount',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'paidAmount', 
      title: 'Paid Amount',
      render: (value) => formatCurrency(value || 0)
    },
    { 
      key: 'pendingAmount', 
      title: 'Pending Amount',
      render: (value) => formatCurrency(value || 0)
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          value === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
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
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Project
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={projects}
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
        title={editingProject ? 'Edit Project' : 'Add Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Contact</label>
            <input
              type="tel"
              required
              className="input-field"
              value={formData.clientContact}
              onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Owner</label>
            <select
              required
              className="input-field"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            >
              <option value="">Select Owner</option>
              {projectOwners.map((owner) => (
                <option key={owner._id} value={owner._id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
            <input
              type="number"
              required
              className="input-field"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              className="input-field"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="input-field"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="input-field"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingProject ? 'Update Project' : 'Add Project'}
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

export default Projects;