const mongoose = require('mongoose');

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
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  company: {
    type: String,
    trim: true
  },
  projectName: {
    type: String,
    trim: true
  },
  totalProjectValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectOwner', projectOwnerSchema);