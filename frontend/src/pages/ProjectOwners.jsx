import React, { useState, useEffect } from 'react';
import { projectOwnersAPI, paymentsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProjectOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    totalProjectValue: '',
    projectName: '' // Added project name field
  });
  const [error, setError] = useState('');

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await projectOwnersAPI.getAll();
      setOwners(response.data);
    } catch (error) {
      console.error('Error fetching project owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const dataToSend = {
        ...formData,
        totalProjectValue: formData.totalProjectValue ? parseFloat(formData.totalProjectValue) : 0
      };
      
      if (editingOwner) {
        await projectOwnersAPI.update(editingOwner._id, dataToSend);
      } else {
        await projectOwnersAPI.create(dataToSend);
      }
      fetchOwners();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving project owner:', error);
      if (error.response?.data?.error?.includes('phone') || 
          error.response?.data?.error?.includes('duplicate')) {
        setError('A project owner with this phone number already exists.');
      } else {
        setError('Error saving project owner. Please try again.');
      }
    }
  };

  const handleEdit = (owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      company: owner.company || '',
      totalProjectValue: owner.totalProjectValue ? owner.totalProjectValue.toString() : '',
      projectName: owner.projectName || '' // Added project name field
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (owner) => {
    if (window.confirm('Are you sure you want to delete this project owner?')) {
      try {
        await projectOwnersAPI.delete(owner._id);
        fetchOwners();
      } catch (error) {
        console.error('Error deleting project owner:', error);
        alert('Error deleting project owner. Please try again.');
      }
    }
  };

  const handleViewPayments = (owner) => {
    navigate(`/project-owners/${owner._id}/payments`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      totalProjectValue: '',
      projectName: '' // Added project name field
    });
    setEditingOwner(null);
    setError('');
  };

  const ownerColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone' },
    { key: 'company', title: 'Company' },
    { key: 'projectName', title: 'Project Name' }, // Added project name column
    { 
      key: 'totalProjectValue', 
      title: 'Total Value',
      render: (value) => value ? `$${parseFloat(value).toLocaleString()}` : '$0'
    },
    { key: 'address', title: 'Address' },
    {
      key: 'actions',
      title: '',
      render: (_, owner) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewPayments(owner)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="View Payments"
          >
            View Payments
          </button>

          {isAdmin && (
            <button
              onClick={() => handleEdit(owner)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Edit Owner"
            >
              Edit
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleDelete(owner)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Delete Owner"
            >
              Delete
            </button>
          )}
        </div>
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Project Owners</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Project Owner
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={ownerColumns}
          data={owners}
          showActions={false}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingOwner ? 'Edit Project Owner' : 'Add Project Owner'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          
          {/* Added Project Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Value</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.totalProjectValue}
              onChange={(e) => setFormData({ ...formData, totalProjectValue: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              {editingOwner ? 'Update Owner' : 'Add Owner'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectOwners;