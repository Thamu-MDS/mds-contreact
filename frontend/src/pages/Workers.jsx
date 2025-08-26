import React, { useState, useEffect } from 'react';
import { workersAPI, salariesAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    address: '',
    dailySalary: '',
    monthlySalary: ''
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await workersAPI.getAll();
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await workersAPI.update(editingWorker._id, formData);
      } else {
        await workersAPI.create(formData);
      }
      fetchWorkers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving worker:', error);
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      email: worker.email || '',
      role: worker.role,
      address: worker.address,
      dailySalary: worker.dailySalary,
      monthlySalary: worker.monthlySalary || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (worker) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workersAPI.delete(worker._id);
        fetchWorkers();
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const handlePayment = (worker) => {
    setSelectedWorker(worker);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      // Create salary payment record
      await salariesAPI.create({
        workerId: selectedWorker._id,
        amount: paymentData.amount,
        paymentDate: paymentData.date,
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes,
        periodStart: paymentData.periodStart,
        periodEnd: paymentData.periodEnd
      });
      
      // Update worker's pending salary
      await workersAPI.update(selectedWorker._id, {
        pendingSalary: selectedWorker.pendingSalary - paymentData.amount
      });
      
      setShowPaymentModal(false);
      setSelectedWorker(null);
      fetchWorkers(); // Refresh the worker list
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: '',
      address: '',
      dailySalary: '',
      monthlySalary: ''
    });
    setEditingWorker(null);
  };

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'phone', title: 'Phone' },
    { key: 'role', title: 'Role' },
    { 
      key: 'dailySalary', 
      title: 'Daily Salary',
      render: (value) => `₹${value}`
    },
    { 
      key: 'pendingSalary', 
      title: 'Pending Salary',
      render: (value) => `₹${value || 0}`
    },
    { 
      key: 'paymentStatus', 
      title: 'Payment Status',
      render: (value, row) => {
        const status = row.pendingSalary > 0 ? (row.pendingSalary < row.dailySalary ? 'partial' : 'pending') : 'paid';
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            status === 'paid' ? 'bg-green-100 text-green-800' :
            status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex space-x-2">
          {isAdmin && row.pendingSalary > 0 && (
            <button
              onClick={() => handlePayment(row)}
              className="btn-success text-xs"
            >
              Pay
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Workers</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Worker
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={workers}
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
        title={editingWorker ? 'Edit Worker' : 'Add Worker'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Mason, Electrician, Carpenter"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              required
              className="input-field"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Salary (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="input-field"
              value={formData.dailySalary}
              onChange={(e) => setFormData({ ...formData, dailySalary: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingWorker ? 'Update Worker' : 'Add Worker'}
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedWorker(null);
        }}
        worker={selectedWorker}
        onSave={handlePaymentSubmit}
      />
    </div>
  );
};

export default Workers;