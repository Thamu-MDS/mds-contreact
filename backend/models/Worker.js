import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  dailySalary: {
    type: Number,
    required: true
  },
  monthlySalary: {
    type: Number,
    default: 0
  },
  pendingSalary: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  lastPaymentDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Worker', workerSchema);