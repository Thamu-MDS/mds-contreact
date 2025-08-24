import React, { useState, useEffect } from 'react';
import { salariesAPI, workersAPI, projectsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Salaries = () => {
  const [salaries, setSalaries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [formData, setFormData] = useState({
    workerId: '',
    projectId: '',
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    periodStart: '',
    periodEnd: ''
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSalaries();
    fetchWorkers();
    fetchProjects();
  }, []);

  const fetchSalaries = async () => {
    try {
      const response = await salariesAPI.getAll();
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workersAPI.getAll();
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
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
      if (editingSalary) {
        await salariesAPI.update(editingSalary._id, formData);
      } else {
        await salariesAPI.create(formData);
      }
      fetchSalaries();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving salary:', error);
    }
  };

  const handleEdit = (salary) => {
    setEditingSalary(salary);
    setFormData({
      workerId: salary.workerId._id || salary.workerId,
      projectId: salary.projectId._id || salary.projectId,
      amount: salary.amount,
      paymentMethod: salary.paymentMethod,
      notes: salary.notes || '',
      periodStart: salary.periodStart ? salary.periodStart.split('T')[0] : '',
      periodEnd: salary.periodEnd ? salary.periodEnd.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (salary) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await salariesAPI.delete(salary._id);
        fetchSalaries();
      } catch (error) {
        console.error('Error deleting salary:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      workerId: '',
      projectId: '',
      amount: '',
      paymentMethod: 'cash',
      notes: '',
      periodStart: '',
      periodEnd: ''
    });
    setEditingSalary(null);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
    { 
      key: 'workerId', 
      title: 'Worker',
      render: (value) => value?.name || 'N/A'
    },
    { 
      key: 'projectId', 
      title: 'Project',
      render: (value) => value?.name || 'N/A'
    },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'paymentDate', 
      title: 'Payment Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { key: 'paymentMethod', title: 'Payment Method' },
    { 
      key: 'periodStart', 
      title: 'Period Start',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      key: 'periodEnd', 
      title: 'Period End',
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
        <h1 className="text-3xl font-bold text-gray-900">Salaries</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Salary Payment
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={salaries}
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
        title={editingSalary ? 'Edit Salary Payment' : 'Add Salary Payment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
            <select
              required
              className="input-field"
              value={formData.workerId}
              onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.name} - {worker.role}
                </option>
              ))}
            </select>
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              className="input-field"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              className="input-field"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              />
            </div>
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
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingSalary ? 'Update Payment' : 'Add Payment'}
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

export default Salaries;