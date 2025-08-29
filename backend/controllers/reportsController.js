const Project = require('../models/Project');
const Worker = require('../models/Worker');
const ProjectOwner = require('../models/ProjectOwner');
const Material = require('../models/Material');
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
      totalMaterialsCost,
      totalPayments,
      totalSalaries,
      pendingSalaries
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Worker.countDocuments(),
      ProjectOwner.countDocuments(),
      Material.aggregate([{ $group: { _id: null, total: { $sum: '$totalCost' } } }]),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Salary.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Worker.aggregate([{ $group: { _id: null, total: { $sum: '$pendingSalary' } } }])
    ]);
    
    res.json({
      totalProjects,
      activeProjects,
      totalWorkers,
      totalOwners,
      totalMaterialsCost: totalMaterialsCost[0]?.total || 0,
      totalPayments: totalPayments[0]?.total || 0,
      totalSalaries: totalSalaries[0]?.total || 0,
      pendingSalaries: pendingSalaries[0]?.total || 0
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get financial report
const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    const [projects, materials, payments, salaries] = await Promise.all([
      Project.find().populate('ownerId', 'name company'),
      Material.find(dateFilter).populate('projectId', 'name'),
      Payment.find(dateFilter).populate('projectId', 'name').populate('projectOwnerId', 'name'),
      Salary.find(dateFilter).populate('projectId', 'name').populate('workerId', 'name')
    ]);
    
    // Calculate project-wise financials
    const projectFinancials = projects.map(project => {
      const projectMaterials = materials.filter(m => m.projectId && m.projectId._id.toString() === project._id.toString());
      const projectPayments = payments.filter(p => p.projectId && p.projectId._id.toString() === project._id.toString());
      const projectSalaries = salaries.filter(s => s.projectId && s.projectId._id.toString() === project._id.toString());
      
      const materialCost = projectMaterials.reduce((sum, material) => sum + material.totalCost, 0);
      const paymentAmount = projectPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const salaryAmount = projectSalaries.reduce((sum, salary) => sum + salary.amount, 0);
      
      return {
        project: {
          _id: project._id,
          name: project.name,
          totalAmount: project.totalAmount,
          currentBalance: project.currentBalance
        },
        materialCost,
        paymentAmount,
        salaryAmount,
        expenses: materialCost + salaryAmount,
        netProfit: paymentAmount - (materialCost + salaryAmount)
      };
    });
    
    // Calculate overall financials
    const totalMaterialCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
    const totalPaymentAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalSalaryAmount = salaries.reduce((sum, salary) => sum + salary.amount, 0);
    const totalExpenses = totalMaterialCost + totalSalaryAmount;
    const netProfit = totalPaymentAmount - totalExpenses;
    
    res.json({
      projectFinancials,
      summary: {
        totalMaterialCost,
        totalPaymentAmount,
        totalSalaryAmount,
        totalExpenses,
        netProfit
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker performance report
const getWorkerPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    const [workers, attendance, salaries] = await Promise.all([
      Worker.find(),
      Attendance.find(dateFilter).populate('projectId', 'name'),
      Salary.find(dateFilter)
    ]);
    
    const workerPerformance = workers.map(worker => {
      const workerAttendance = attendance.filter(a => a.workerId.toString() === worker._id.toString());
      const workerSalaries = salaries.filter(s => s.workerId.toString() === worker._id.toString());
      
      const presentDays = workerAttendance.filter(a => a.status === 'present').length;
      const halfDays = workerAttendance.filter(a => a.status === 'halfday').length;
      const absentDays = workerAttendance.filter(a => a.status === 'absent').length;
      const totalDays = presentDays + halfDays + absentDays;
      
      const attendancePercentage = totalDays > 0 ? ((presentDays + (halfDays * 0.5)) / totalDays) * 100 : 0;
      const totalEarned = workerSalaries.reduce((sum, salary) => sum + salary.amount, 0);
      
      return {
        worker: {
          _id: worker._id,
          name: worker.name,
          role: worker.role,
          dailySalary: worker.dailySalary
        },
        attendance: {
          present: presentDays,
          halfday: halfDays,
          absent: absentDays,
          total: totalDays,
          percentage: attendancePercentage.toFixed(2)
        },
        salary: {
          totalEarned,
          pending: worker.pendingSalary
        }
      };
    });
    
    res.json(workerPerformance);
  } catch (error) {
    console.error('Get worker performance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get salary report
const getSalaryReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const dateFilter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    let groupFormat = "%Y-%m";
    if (groupBy === 'week') {
      groupFormat = "%Y-%U";
    } else if (groupBy === 'day') {
      groupFormat = "%Y-%m-%d";
    }
    
    const salaryReport = await Salary.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: "$date" } },
            workerId: "$workerId"
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    
    // Populate worker details
    const populatedReport = await Salary.populate(salaryReport, {
      path: '_id.workerId',
      select: 'name role'
    });
    
    res.json(populatedReport);
  } catch (error) {
    console.error('Get salary report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const dateFilter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    let groupFormat = "%Y-%m";
    if (groupBy === 'week') {
      groupFormat = "%Y-%U";
    } else if (groupBy === 'day') {
      groupFormat = "%Y-%m-%d";
    }
    
    const attendanceReport = await Attendance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: "$date" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1, "_id.status": 1 } }
    ]);
    
    res.json(attendanceReport);
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getFinancialReport,
  getWorkerPerformanceReport,
  getSalaryReport,
  getAttendanceReport
};