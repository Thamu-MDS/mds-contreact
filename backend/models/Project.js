import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientContact: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - this.paidAmount;
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'on-hold'],
    default: 'planning'
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectOwner',
    required: true
  },
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  }],
  payments: [{
    amount: Number,
    date: Date,
    method: String,
    reference: String
  }]
}, {
  timestamps: true
});

projectSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  next();
});

export default mongoose.model('Project', projectSchema);