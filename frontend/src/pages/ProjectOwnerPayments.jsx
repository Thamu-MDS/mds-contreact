import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectOwnersAPI, paymentsAPI } from '../api/api';
import Table from '../components/Table';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const ProjectOwnerPayments = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [error, setError] = useState('');

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchOwnerAndPayments();
  }, [ownerId]);

  const fetchOwnerAndPayments = async () => {
    try {
      setError('');
      // Fetch owner details
      const ownerResponse = await projectOwnersAPI.getById(ownerId);
      setOwner(ownerResponse.data);
      
      // Fetch payments for this specific owner using query parameter
      const paymentsResponse = await paymentsAPI.getByOwner(ownerId);
      setPayments(paymentsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setError('');
      // Format the data correctly for the API
      const formattedData = {
        ...paymentData,
        projectOwner: ownerId, // Use the correct field name expected by backend
        projectOwnerName: owner.name,
        amount: parseFloat(paymentData.amount),
        date: new Date(paymentData.date).toISOString()
      };
      
      console.log('Submitting payment:', formattedData);
      
      if (editingPayment) {
        await paymentsAPI.update(editingPayment._id, formattedData);
      } else {
        await paymentsAPI.create(formattedData);
      }
      
      // Refresh the data
      await fetchOwnerAndPayments();
      setShowPaymentModal(false);
      setEditingPayment(null);
    } catch (error) {
      console.error('Error saving payment:', error);
      setError('Failed to save payment. Please check your input and try again.');
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        setError('');
        await paymentsAPI.delete(payment._id);
        await fetchOwnerAndPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
        setError('Failed to delete payment. Please try again.');
      }
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  const handleGenerateReport = () => {
    if (!owner) return;
    
    // Calculate totals
    const totalProjectValue = parseFloat(owner.totalProjectValue || 0);
    const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const balanceAmount = totalProjectValue - paidAmount;

    // Create report content
    const reportContent = `
      PROJECT OWNER PAYMENT REPORT
      ============================
      
      Owner: ${owner.name}
      Company: ${owner.company || 'N/A'}
      Email: ${owner.email}
      Phone: ${owner.phone}
      Address: ${owner.address}
      
      FINANCIAL SUMMARY
      ----------------
      Total Project Value: $${totalProjectValue.toLocaleString()}
      Total Paid Amount: $${paidAmount.toLocaleString()}
      Balance Amount: $${balanceAmount.toLocaleString()}
      
      PAYMENT DETAILS
      ---------------
      ${payments.map((payment, index) => `
        ${index + 1}. Date: ${new Date(payment.date).toLocaleDateString()}
           Amount: $${parseFloat(payment.amount).toLocaleString()}
           Description: ${payment.description || 'N/A'}
           Method: ${payment.paymentMethod || 'N/A'}
        ---
      `).join('')}
      
      Generated on: ${new Date().toLocaleDateString()}
    `;

    // Create and download text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payment_report_${owner._id}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Calculate totals for payments
  const totalProjectValue = parseFloat(owner?.totalProjectValue || 0);
  const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  const balanceAmount = totalProjectValue - paidAmount;

  const paymentColumns = [
    { 
      key: 'date', 
      title: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => `$${parseFloat(value).toLocaleString()}`
    },
    { key: 'description', title: 'Description' },
    { key: 'paymentMethod', title: 'Payment Method' },
    {
      key: 'actions',
      title: '',
      render: (_, payment) => (
        isAdmin ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditPayment(payment)}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Edit Payment"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeletePayment(payment)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Delete Payment"
            >
              Delete
            </button>
          </div>
        ) : null
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

  if (!owner) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Project Owner Not Found</h1>
        <button
          onClick={() => navigate('/project-owners')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Project Owners
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/project-owners')}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Back to Project Owners
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Payments for {owner.name}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 p-2"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Project Value</h3>
          <p className="text-2xl font-bold text-blue-900">
            ${totalProjectValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Paid Amount</h3>
          <p className="text-2xl font-bold text-green-900">
            ${paidAmount.toLocaleString()}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${balanceAmount >= 0 ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-sm font-medium ${balanceAmount >= 0 ? 'text-gray-800' : 'text-red-800'}`}>
            Balance Amount
          </h3>
          <p className={`text-2xl font-bold ${balanceAmount >= 0 ? 'text-gray-900' : 'text-red-900'}`}>
            ${Math.abs(balanceAmount).toLocaleString()} {balanceAmount < 0 ? '(Overpaid)' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Payment History</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download Report
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Payment
            </button>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No payments recorded</h3>
          <p className="mt-1 text-gray-500">Get started by adding your first payment.</p>
          {isAdmin && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Payment
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table
            columns={paymentColumns}
            data={payments}
            showActions={false}
          />
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setEditingPayment(null);
          setError('');
        }}
        onSave={handlePaymentSubmit}
        payment={editingPayment}
      />
    </div>
  );
};

export default ProjectOwnerPayments;