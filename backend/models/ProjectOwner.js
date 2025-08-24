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
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  company: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('ProjectOwner', projectOwnerSchema);