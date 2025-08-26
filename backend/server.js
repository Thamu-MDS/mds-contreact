import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';
import { createAdminUser } from './utils/createAdmin.js';

// Route imports - fixed to use default imports
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import projectRoutes from './routes/projects.js';
import projectOwnerRoutes from './routes/projectOwners.js';
import materialRoutes from './routes/materials.js';
import salaryRoutes from './routes/salaries.js';
import attendanceRoutes from './routes/attendance.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Create admin user
createAdminUser();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-owners', projectOwnerRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});