const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'halfday'],
    required: true
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate attendance records
attendanceSchema.index({ date: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);