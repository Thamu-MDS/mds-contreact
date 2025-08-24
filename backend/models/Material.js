import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  unitCost: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  quality: {
    type: String
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.unitCost * this.quantity;
    }
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

materialSchema.pre('save', function(next) {
  this.totalCost = this.unitCost * this.quantity;
  next();
});

export default mongoose.model('Material', materialSchema);