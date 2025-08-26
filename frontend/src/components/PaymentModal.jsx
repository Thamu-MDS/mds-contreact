import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const PaymentModal = ({ isOpen, onClose, worker, onSave, payment = null }) => {
  const [formData, setFormData] = useState({
    amount: payment?.amount || (worker?.pendingSalary || 0),
    date: payment?.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: payment?.paymentMethod || 'cash',
    notes: payment?.notes || '',
    periodStart: payment?.periodStart ? new Date(payment.periodStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    periodEnd: payment?.periodEnd ? new Date(payment.periodEnd).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod || 'cash',
        notes: payment.notes || '',
        periodStart: payment.periodStart ? new Date(payment.periodStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        periodEnd: payment.periodEnd ? new Date(payment.periodEnd).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else if (worker) {
      setFormData({
        amount: worker.pendingSalary || 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: '',
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0]
      });
    }
  }, [payment, worker, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate amount doesn't exceed pending salary
    const amount = parseFloat(formData.amount);
    const pendingSalary = worker ? worker.pendingSalary : 0;
    
    if (amount > pendingSalary) {
      alert('Payment amount cannot exceed pending salary');
      return;
    }
    
    onSave({
      ...formData,
      workerId: worker?._id,
      amount: amount
    });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const pendingSalary = worker ? worker.pendingSalary : 0;
    
    // Ensure amount doesn't exceed pending salary
    const amount = value === '' ? 0 : Math.min(pendingSalary, Math.max(0, parseFloat(value) || 0));
    
    setFormData({ ...formData, amount: amount });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={payment ? 'Edit Salary Payment' : `Pay ${worker?.name || 'Worker'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {worker && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Worker:</strong> {worker.name} ({worker.role})<br />
              <strong>Pending Salary:</strong> ₹{worker.pendingSalary || 0}<br />
              <strong>Daily Rate:</strong> ₹{worker.dailySalary || 0}
            </p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) {worker && `(Max: ₹${worker.pendingSalary || 0})`}
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="input-field"
            value={formData.amount}
            onChange={handleAmountChange}
            max={worker ? worker.pendingSalary : undefined}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
          <input
            type="date"
            required
            className="input-field"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="input-field"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Payment notes or description"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            type="submit" 
            className="btn-primary flex-1"
            disabled={formData.amount <= 0}
          >
            {payment ? 'Update Payment' : 'Process Payment'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;