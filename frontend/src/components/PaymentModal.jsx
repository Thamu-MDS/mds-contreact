import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const PaymentModal = ({ isOpen, onClose, onSave, payment = null }) => {
  const [formData, setFormData] = useState({
    amount: payment?.amount || '',
    date: payment?.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: payment?.description || '',
    paymentMethod: payment?.paymentMethod || 'bank_transfer'
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: payment.description || '',
        paymentMethod: payment.paymentMethod || 'bank_transfer'
      });
    } else {
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'bank_transfer'
      });
    }
  }, [payment, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? 'Edit Payment' : 'Add Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="input-field"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            required
            className="input-field"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="input-field"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Payment description or notes"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            className="input-field"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="online">Online Payment</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="btn-primary flex-1">
            {payment ? 'Update Payment' : 'Add Payment'}
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