import asyncHandler from 'express-async-handler';
import Worker from '../models/Worker.js';
import Project from '../models/Project.js';
import Material from '../models/Material.js';
import Salary from '../models/Salary.js';
import Attendance from '../models/Attendance.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [workers, projects, materials, salaries] = await Promise.all([
    Worker.countDocuments({ isActive: true }),
    Project.find({}),
    Material.find({}),
    Salary.find({})
  ]);

  const totalIncome = projects.reduce((sum, p) => sum + p.paidAmount, 0);
  const materialCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
  const salaryCost = salaries.reduce((sum, s) => sum + s.amount, 0);
  const totalCost = materialCost + salaryCost;
  const profit = totalIncome - totalCost;

  const stats = {
    totalWorkers: workers,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in-progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalIncome,
    materialCost,
    salaryCost,
    totalCost,
    profit,
    profitMargin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0
  };

  res.json(stats);
});

export const getFinancialReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};

  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const [projects, materials, salaries] = await Promise.all([
    Project.find(dateFilter),
    Material.find(dateFilter),
    Salary.find(dateFilter)
  ]);

  const report = {
    income: projects.reduce((sum, p) => sum + p.paidAmount, 0),
    materialCosts: materials.reduce((sum, m) => sum + m.totalCost, 0),
    salaryCosts: salaries.reduce((sum, s) => sum + s.amount, 0),
    projects: projects.length,
    materials: materials.length,
    salaryPayments: salaries.length
  };

  report.totalCosts = report.materialCosts + report.salaryCosts;
  report.profit = report.income - report.totalCosts;

  res.json(report);
});

export const getWorkerPerformanceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};

  if (startDate && endDate) {
    dateFilter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const attendance = await Attendance.find(dateFilter)
    .populate('workerId', 'name role dailySalary');

  const workerStats = {};

  attendance.forEach(record => {
    const workerId = record.workerId._id.toString();
    
    if (!workerStats[workerId]) {
      workerStats[workerId] = {
        worker: record.workerId,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        halfDays: 0,
        overtimeHours: 0,
        attendanceRate: 0
      };
    }

    workerStats[workerId].totalDays++;
    
    switch (record.status) {
      case 'present':
        workerStats[workerId].presentDays++;
        break;
      case 'absent':
        workerStats[workerId].absentDays++;
        break;
      case 'halfday':
        workerStats[workerId].halfDays++;
        break;
    }
    
    workerStats[workerId].overtimeHours += record.overtimeHours || 0;
  });

  // Calculate attendance rates
  Object.values(workerStats).forEach(stats => {
    if (stats.totalDays > 0) {
      stats.attendanceRate = ((stats.presentDays + (stats.halfDays * 0.5)) / stats.totalDays * 100).toFixed(2);
    }
  });

  res.json(Object.values(workerStats));
});