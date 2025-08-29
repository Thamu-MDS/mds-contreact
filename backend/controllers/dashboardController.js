const Project = require('../models/Project');
const Worker = require('../models/Worker');
const ProjectOwner = require('../models/ProjectOwner');
const Payment = require('../models/Payment');
const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProjects,
      activeProjects,
      totalWorkers,
      totalOwners,
      totalMaterials,
      totalPayments,
      totalSalaries,
      pendingSalaries
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Worker.countDocuments(),
      ProjectOwner.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Salary.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Worker.aggregate([{ $group: { _id: null, total: { $sum: '$pendingSalary' } } }])
    ]);
    
    res.json({
      totalProjects,
      activeProjects,
      totalWorkers,
      totalOwners,
      totalPayments: totalPayments[0]?.total || 0,
      totalSalaries: totalSalaries[0]?.total || 0,
      pendingSalaries: pendingSalaries[0]?.total || 0
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const [recentPayments, recentSalaries, recentAttendance] = await Promise.all([
      Payment.find()
        .populate('projectId', 'name')
        .populate('projectOwnerId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit),
      Salary.find()
        .populate('workerId', 'name')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit),
      Attendance.find()
        .populate('workerId', 'name')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
    ]);
    
    // Combine and sort all activities
    const activities = [
      ...recentPayments.map(p => ({
        type: 'payment',
        description: `Payment of ₹${p.amount} received for project ${p.projectId?.name || 'N/A'}`,
        date: p.createdAt,
        data: p
      })),
      ...recentSalaries.map(s => ({
        type: 'salary',
        description: `Salary of ₹${s.amount} paid to ${s.workerId?.name || 'N/A'}`,
        date: s.createdAt,
        data: s
      })),
      ...recentAttendance.map(a => ({
        type: 'attendance',
        description: `${a.workerId?.name || 'N/A'} marked as ${a.status} for project ${a.projectId?.name || 'N/A'}`,
        date: a.createdAt,
        data: a
      }))
    ];
    
    // Sort by date descending and limit
    activities.sort((a, b) => b.date - a.date);
    const limitedActivities = activities.slice(0, limit);
    
    res.json(limitedActivities);
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get upcoming payments
const getUpcomingPayments = async (req, res) => {
  try {
    // Find workers with pending salaries
    const workersWithPendingSalaries = await Worker.find({ 
      pendingSalary: { $gt: 0 } 
    }).sort({ pendingSalary: -1 });
    
    // Find projects with low balance
    const projectsWithLowBalance = await Project.find({ 
      currentBalance: { $lt: 10000 } // Less than 10,000 balance
    }).populate('ownerId', 'name phone');
    
    res.json({
      pendingSalaries: workersWithPendingSalaries,
      lowBalanceProjects: projectsWithLowBalance
    });
  } catch (error) {
    console.error('Get upcoming payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getUpcomingPayments
};