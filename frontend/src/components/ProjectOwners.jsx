import React, { useState, useEffect } from 'react';
import { projectOwnersAPI, paymentsAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import PaymentModal from './PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const ProjectOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [payments, setPayments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    totalProjectValue: ''
  });

  const { isAdmin } = useAuth();

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

  const fetchPayments = async (ownerId) => {
    try {
      // Get projects for this owner first
      const projectsResponse = await projectOwnersAPI.getProjectsSummary(ownerId);
      const projects = projectsResponse.data;
      
      // Get payments for each project
      const allPayments = [];
      for (const project of projects) {
        try {
          const paymentsResponse = await paymentsAPI.getAll(project._id);
          allPayments.push(...paymentsResponse.data.map(payment => ({
            ...payment,
            projectName: project.name
          })));
        } catch (error) {
          console.error(`Error fetching payments for project ${project._id}:`, error);
        }
      }
      
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        await projectOwnersAPI.update(editingOwner._id, formData);
      } else {
        await projectOwnersAPI.create(formData);
      }
      fetchOwners();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving project owner:', error);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      // For simplicity, we'll use the first project of the owner
      // In a real app, you might want to let the user select a project
      const projectsResponse = await projectOwnersAPI.getProjectsSummary(selectedOwner._id);
      const projects = projectsResponse.data;
      
      if (projects.length === 0) {
        alert('This owner has no projects. Please create a project first.');
        return;
      }
      
      const paymentWithProject = {
        ...paymentData,
        projectId: projects[0]._id,
        projectOwnerId: selectedOwner._id
      };
      
      if (editingPayment) {
        await paymentsAPI.update(editingPayment._id, paymentWithProject);
      } else {
        await paymentsAPI.create(paymentWithProject);
      }
      
      fetchPayments(selectedOwner._id);
      setShowPaymentModal(false);
      setEditingPayment(null);
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsAPI.delete(payment._id);
        fetchPayments(selectedOwner._id);
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  const handleViewPayments = async (owner) => {
    setSelectedOwner(owner);
    await fetchPayments(owner._id);
    setShowPaymentsModal(true);
  };

  const handleGenerateReport = async () => {
    try {
      // Calculate totals for the report
      const totalProjectValue = selectedOwner.totalProjectValue || 0;
      const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      const balanceAmount = totalProjectValue - paidAmount;
      
      // Create a simple text report (in a real app, you might generate PDF)
      const reportContent = `
        PROJECT OWNER PAYMENT REPORT
        ============================
        
        Owner: ${selectedOwner.name}
        Company: ${selectedOwner.company || 'N/A'}
        Email: ${selectedOwner.email}
        Phone: ${selectedOwner.phone}
        
        FINANCIAL SUMMARY
        ----------------
        Total Project Value: $${totalProjectValue.toLocaleString()}
        Total Paid Amount: $${paidAmount.toLocaleString()}
        Balance Amount: $${balanceAmount.toLocaleString()}
        
        PAYMENT DETAILS
        ---------------
        ${payments.map(payment => `
          Date: ${new Date(payment.date).toLocaleDateString()}
          Amount: $${parseFloat(payment.amount).toLocaleString()}
          Project: ${payment.projectName || 'N/A'}
          Description: ${payment.description || 'N/A'}
          Method: ${payment.paymentMethod || 'N/A'}
          ---
        `).join('')}
        
        Generated on: ${new Date().toLocaleDateString()}
      `;
      
      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_report_${selectedOwner._id}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
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
      totalProjectValue: owner.totalProjectValue || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (owner) => {
    if (window.confirm('Are you sure you want to delete this project owner?')) {
      try {
        await projectOwnersAPI.delete(owner._id);
        fetchOwners();
      } catch (error) {
        console.error('Error deleting project owner:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      totalProjectValue: ''
    });
    setEditingOwner(null);
  };

  // Calculate totals for payments
  const totalProjectValue = selectedOwner?.totalProjectValue || 0;
  const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  const balanceAmount = totalProjectValue - paidAmount;

  const ownerColumns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone' },
    { key: 'company', title: 'Company' },
    { 
      key: 'totalProjectValue', 
      title: 'Total Value',
      render: (value) => value ? `$${parseFloat(value).toLocaleString()}` : '$0'
    }
  ];

  const paymentColumns = [
    { key: 'date', title: 'Date', render: (value) => new Date(value).toLocaleDateString() },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => `$${parseFloat(value).toLocaleString()}`
    },
    { key: 'projectName', title: 'Project' },
    { key: 'description', title: 'Description' },
    { key: 'paymentMethod', title: 'Payment Method' }
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
        <h1 className="text-3xl font-bold text-gray-900">Project Owners</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Add Project Owner
          </button>
        )}
      </div>

      <div className="card">
        <Table
          columns={ownerColumns}
          data={owners}
          onEdit={isAdmin ? handleEdit : null}
          onDelete={isAdmin ? handleDelete : null}
          onView={handleViewPayments}
          showActions={true}
        />
      </div>

      {/* Project Owner Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingOwner ? 'Edit Project Owner' : 'Add Project Owner'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              className="input-field"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Value</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={formData.totalProjectValue}
              onChange={(e) => setFormData({ ...formData, totalProjectValue: e.target.value })}
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
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingOwner ? 'Update Owner' : 'Add Owner'}
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

      {/* Payments Modal */}
      <Modal
        isOpen={showPaymentsModal}
        onClose={() => {
          setShowPaymentsModal(false);
          setSelectedOwner(null);
          setPayments([]);
        }}
        title={`Payments for ${selectedOwner?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Project Value</h3>
              <p className="text-2xl font-bold text-blue-900">
                ${parseFloat(totalProjectValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Paid Amount</h3>
              <p className="text-2xl font-bold text-green-900">
                ${paidAmount.toLocaleString()}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${balanceAmount >= 0 ? 'bg-gray-50' : 'bg-red-50'}`}>
              <h3 className={`text-sm font-medium ${balanceAmount >= 0 ? 'text-gray-800' : 'text-red-800'}`}>
                Balance Amount
              </h3>
              <p className={`text-2xl font-bold ${balanceAmount >= 0 ? 'text-gray-900' : 'text-red-900'}`}>
                ${Math.abs(balanceAmount).toLocaleString()} {balanceAmount < 0 ? '(Overpaid)' : ''}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Payment History</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleGenerateReport}
                className="btn-secondary"
              >
                Download Report
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary"
                >
                  Add Payment
                </button>
              )}
            </div>
          </div>

          <Table
            columns={paymentColumns}
            data={payments}
            onEdit={isAdmin ? handleEditPayment : null}
            onDelete={isAdmin ? handleDeletePayment : null}
            showActions={isAdmin}
          />
        </div>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setEditingPayment(null);
        }}
        onSave={handlePaymentSubmit}
        payment={editingPayment}
      />
    </div>
  );
};

export default ProjectOwners;