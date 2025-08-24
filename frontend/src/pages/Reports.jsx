import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api/api';

const Reports = () => {
  const [financialReport, setFinancialReport] = useState(null);
  const [workerPerformance, setWorkerPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReports();
    }
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [financialResponse, performanceResponse] = await Promise.all([
        reportsAPI.getFinancial(dateRange),
        reportsAPI.getWorkerPerformance(dateRange)
      ]);
      
      setFinancialReport(financialResponse.data);
      setWorkerPerformance(performanceResponse.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Date Range Selector */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="btn-primary"
            >
              Generate Reports
            </button>
          </div>
        </div>
      </div>

      {/* Financial Report */}
      {financialReport && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(financialReport.income)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-600">Material Costs</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(financialReport.materialCosts)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-600">Salary Costs</p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatCurrency(financialReport.salaryCosts)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Net Profit</p>
              <p className={`text-2xl font-bold ${
                financialReport.profit >= 0 ? 'text-blue-900' : 'text-red-900'
              }`}>
                {formatCurrency(financialReport.profit)}
              </p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-xl font-semibold">{financialReport.projects}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Material Purchases</p>
              <p className="text-xl font-semibold">{financialReport.materials}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Salary Payments</p>
              <p className="text-xl font-semibold">{financialReport.salaryPayments}</p>
            </div>
          </div>
        </div>
      )}

      {/* Worker Performance Report */}
      {workerPerformance.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Worker Performance</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Role</th>
                  <th>Total Days</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Half Days</th>
                  <th>Overtime Hours</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {workerPerformance.map((worker, index) => (
                  <tr key={index}>
                    <td className="font-medium">{worker.worker.name}</td>
                    <td>{worker.worker.role}</td>
                    <td>{worker.totalDays}</td>
                    <td className="text-green-600">{worker.presentDays}</td>
                    <td className="text-red-600">{worker.absentDays}</td>
                    <td className="text-yellow-600">{worker.halfDays}</td>
                    <td>{worker.overtimeHours}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        worker.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                        worker.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {worker.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            Print Report
          </button>
          <button
            onClick={() => {
              // This would typically trigger a PDF export
              alert('PDF export functionality would be implemented here');
            }}
            className="btn-secondary"
          >
            Export to PDF
          </button>
          <button
            onClick={() => {
              // This would typically trigger a CSV export
              alert('CSV export functionality would be implemented here');
            }}
            className="btn-secondary"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;