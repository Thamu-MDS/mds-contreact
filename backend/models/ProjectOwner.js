import mongoose from 'mongoose';

const projectOwnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  totalProjectValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Add index for better query performance
projectOwnerSchema.index({ email: 1 });
projectOwnerSchema.index({ phone: 1 });
projectOwnerSchema.index({ company: 1 });

export default mongoose.model('ProjectOwner', projectOwnerSchema);