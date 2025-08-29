const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectOwner',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'cheque', 'upi'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isAdvance: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);