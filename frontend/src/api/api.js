import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to format numbers for API requests
const formatNumberFields = (data, fields) => {
  const formattedData = { ...data };
  fields.forEach(field => {
    if (formattedData[field] !== undefined && formattedData[field] !== null && formattedData[field] !== '') {
      formattedData[field] = parseFloat(formattedData[field]);
    }
  });
  return formattedData;
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Workers API
export const workersAPI = {
  getAll: () => api.get('/workers'),
  getById: (id) => api.get(`/workers/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['dailySalary', 'monthlySalary', 'pendingSalary']);
    return api.post('/workers', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['dailySalary', 'monthlySalary', 'pendingSalary']);
    return api.put(`/workers/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/workers/${id}`),
  getAttendance: (id, params) => api.get(`/workers/${id}/attendance`, { params }),
  getSalaryHistory: (id) => api.get(`/workers/${id}/salaries`),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['totalAmount']);
    return api.post('/projects', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['totalAmount']);
    return api.put(`/projects/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/projects/${id}`),
  getFinanceSummary: (id) => api.get(`/projects/${id}/finance-summary`),
  processPayment: (id, data) => api.post(`/projects/${id}/process-payment`, data),
  assignWorkers: (id, workerIds) => api.post(`/projects/${id}/assign-workers`, { workerIds }),
  getAssignedWorkers: (id) => api.get(`/projects/${id}/assigned-workers`),
};

// Project Owners API
export const projectOwnersAPI = {
  getAll: () => api.get('/project-owners'),
  getById: (id) => api.get(`/project-owners/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['totalProjectValue']);
    return api.post('/project-owners', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['totalProjectValue']);
    return api.put(`/project-owners/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/project-owners/${id}`),
  getProjectsSummary: (id, sort) => api.get(`/project-owners/${id}/projects-summary?sort=${sort}`),
};

// Materials API
export const materialsAPI = {
  getAll: (projectId) => api.get(`/materials${projectId ? `?projectId=${projectId}` : ''}`),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['quantity', 'unitPrice', 'totalCost']);
    return api.post('/materials', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['quantity', 'unitPrice', 'totalCost']);
    return api.put(`/materials/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/materials/${id}`),
};

// Salaries API
export const salariesAPI = {
  getAll: (params) => api.get('/salaries', { params }),
  getById: (id) => api.get(`/salaries/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['amount']);
    return api.post('/salaries', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['amount']);
    return api.put(`/salaries/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/salaries/${id}`),
  getWorkerSalaries: (workerId) => api.get(`/salaries/worker/${workerId}`),
  getProjectSalaries: (projectId) => api.get(`/salaries/project/${projectId}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['overtimeHours']);
    return api.post('/attendance', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['overtimeHours']);
    return api.put(`/attendance/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/attendance/${id}`),
  getReport: (params) => api.get('/attendance/report', { params }),
  getWorkerAttendance: (workerId, params) => api.get(`/attendance/worker/${workerId}`, { params }),
  getProjectAttendance: (projectId, params) => api.get(`/attendance/project/${projectId}`, { params }),
};

// Payments API
export const paymentsAPI = {
  getAll: (projectId) => api.get(`/payments${projectId ? `?projectId=${projectId}` : ''}`),
  getByOwner: (ownerId) => api.get(`/payments?projectOwner=${ownerId}`),
  getByOwnerId: (ownerId) => api.get(`/payments/owner/${ownerId}`),
  create: (data) => {
    const formattedData = formatNumberFields(data, ['amount']);
    return api.post('/payments', formattedData);
  },
  update: (id, data) => {
    const formattedData = formatNumberFields(data, ['amount']);
    return api.put(`/payments/${id}`, formattedData);
  },
  delete: (id) => api.delete(`/payments/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getWorkerPerformance: (params) => api.get('/reports/worker-performance', { params }),
  getSalaryReport: (params) => api.get('/reports/salary', { params }),
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getUpcomingPayments: () => api.get('/dashboard/upcoming-payments'),
};

export default api;