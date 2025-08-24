import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank', 'cheque', 'upi'],
    required: true
  },
  reference: {
    type: String
  },
  notes: {
    type: String
  },
  isAdvance: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);