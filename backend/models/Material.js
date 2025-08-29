const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  quality: {
    type: String,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  supplier: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate total cost before saving
materialSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalCost = this.quantity * this.unitPrice;
  }
  next();
});

module.exports = mongoose.model('Material', materialSchema);