import React, { useState, useEffect } from 'react';
import { reportsAPI, projectsAPI } from '../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectStats(selectedProject);
    }
  }, [selectedProject]);

  const fetchDashboardStats = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
      // Set the first project as default selection if available
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchProjectStats = async (projectId) => {
    try {
      const response = await reportsAPI.getProjectDashboard(projectId);
      // Update the stats with project-specific data
      setStats(prevStats => ({
        ...prevStats,
        projectStats: response.data
      }));
    } catch (error) {
      console.error('Error fetching project stats:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getFinancialData = () => {
    if (selectedProject && stats?.projectStats) {
      return {
        totalIncome: stats.projectStats.totalIncome || 0,
        materialCost: stats.projectStats.materialCost || 0,
        salaryCost: stats.projectStats.salaryCost || 0,
        profit: stats.projectStats.profit || 0,
        profitMargin: stats.projectStats.profitMargin || 0
      };
    }
    
    return {
      totalIncome: stats?.totalIncome || 0,
      materialCost: stats?.materialCost || 0,
      salaryCost: stats?.salaryCost || 0,
      profit: stats?.profit || 0,
      profitMargin: stats?.profitMargin || 0
    };
  };

  const financialData = getFinancialData();

  if (loading || projectsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your construction management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-600 mb-1">Total Workers</p>
              <p className="text-3xl font-bold text-blue-900">{stats?.totalWorkers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-green-900">{stats?.totalProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-yellow-900">{stats?.activeProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-600 mb-1">Completed Projects</p>
              <p className="text-3xl font-bold text-purple-900">{stats?.completedProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Financial Overview</h3>
            <div className="relative">
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Income</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(financialData.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Material Costs</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(financialData.materialCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Salary Costs</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(financialData.salaryCost)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Net Profit</span>
                <span className={`text-xl font-bold ${financialData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialData.profit)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Profit Margin</span>
                <span className={`text-sm font-medium ${financialData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.profitMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/workers'}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200"
            >
              <div className="text-blue-600 text-xl mb-2">👥</div>
              <div className="text-sm font-medium text-blue-900">Manage Workers</div>
            </button>
            <button
              onClick={() => window.location.href = '/projects'}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors duration-200"
            >
              <div className="text-green-600 text-xl mb-2">🏗️</div>
              <div className="text-sm font-medium text-green-900">View Projects</div>
            </button>
            <button
              onClick={() => window.location.href = '/attendance'}
              className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors duration-200"
            >
              <div className="text-yellow-600 text-xl mb-2">📅</div>
              <div className="text-sm font-medium text-yellow-900">Mark Attendance</div>
            </button>
            <button
              onClick={() => window.location.href = '/reports'}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors duration-200"
            >
              <div className="text-purple-600 text-xl mb-2">📊</div>
              <div className="text-sm font-medium text-purple-900">View Reports</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;