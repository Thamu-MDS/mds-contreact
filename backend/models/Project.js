const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectOwner',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold'],
    default: 'active'
  },
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  }],
  currentBalance: {
    type: Number,
    default: function() {
      return this.totalAmount;
    },
    min: 0
  }
}, {
  timestamps: true
});

// Update current balance when materials are added
projectSchema.methods.updateBalance = function(amount) {
  this.currentBalance -= amount;
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);