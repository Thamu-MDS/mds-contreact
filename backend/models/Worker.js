const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
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
    required: true,
    min: 0
  },
  monthlySalary: {
    type: Number,
    min: 0
  },
  pendingSalary: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Worker', workerSchema);