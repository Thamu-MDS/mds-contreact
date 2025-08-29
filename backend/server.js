const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const projectRoutes = require('./routes/projects');
const projectOwnerRoutes = require('./routes/projectOwners');
const materialRoutes = require('./routes/materials');
const attendanceRoutes = require('./routes/attendance');
const salaryRoutes = require('./routes/salaries');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-owners', projectOwnerRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});