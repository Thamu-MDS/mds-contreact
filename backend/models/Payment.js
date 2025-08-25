import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  projectOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectOwner',
    required: true
  },
  projectOwnerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank transfer', 'cheque', 'credit card', 'debit card', 'upi', 'other'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);