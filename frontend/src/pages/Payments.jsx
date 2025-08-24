import React, { useState, useEffect } from 'react';
import { paymentsAPI, projectsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    amount: '',
    paymentMode: 'cash',
    reference: '',
    notes: '',
    isAdvance: false
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchPayments();
    fetchProjects();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await paymentsAPI.getAll();
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
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
      if (editingPayment) {
        await paymentsAPI.update(editingPayment._id, formData);
      } else {
        await paymentsAPI.create(formData);
      }
      fetchPayments();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      projectId: payment.projectId._id || payment.projectId,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      reference: payment.reference || '',
      notes: payment.notes || '',
      isAdvance: payment.isAdvance || false
    });
    setShowModal(true);
  };

  const handleDelete = async (payment) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsAPI.delete(payment._id);
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      amount: '',
      paymentMode: 'cash',
      reference: '',
      notes: '',
      isAdvance: false
    });
    setEditingPayment(null);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
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
    { key: 'paymentMode', title: 'Payment Mode' },
    { key: 'reference', title: 'Reference' },
    { 
      key: 'isAdvance', 
      title: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Advance' : 'Regular'}
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
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Payment
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={payments}
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
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  {project.name} - {project.clientName}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              className="input-field"
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference/Transaction ID</label>
            <input
              type="text"
              className="input-field"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isAdvance}
                onChange={(e) => setFormData({ ...formData, isAdvance: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Advance Payment</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingPayment ? 'Update Payment' : 'Add Payment'}
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

export default Payments;