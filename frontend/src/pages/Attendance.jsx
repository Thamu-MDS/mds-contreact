import React, { useState, useEffect } from 'react';
import { attendanceAPI, workersAPI, projectOwnersAPI } from '../api/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    projectId: '',
    status: 'present',
    overtimeHours: 0,
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchAttendance();
    fetchWorkers();
    fetchProjects();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAll();
      setAttendance(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workersAPI.getAll();
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectOwnersAPI.getAll();
      const projectsData = response.data.map(owner => ({
        _id: owner._id,
        name: owner.projectName || 'Unnamed Project',
        clientName: owner.company || owner.name || ''
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!formData.workerId || !formData.projectId || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      // Format the data correctly for the backend
      const submitData = {
        date: new Date(formData.date).toISOString(),
        worker: formData.workerId,
        project: formData.projectId,
        status: formData.status,
        overtimeHours: parseFloat(formData.overtimeHours) || 0,
        notes: formData.notes || ''
      };

      let response;
      if (editingRecord) {
        response = await attendanceAPI.update(editingRecord._id, submitData);
        setSuccess('Attendance record updated successfully');
      } else {
        response = await attendanceAPI.create(submitData);
        setSuccess('Attendance record created successfully');
      }
      
      // Update local state with the returned data
      if (editingRecord) {
        setAttendance(attendance.map(item => 
          item._id === editingRecord._id ? response.data : item
        ));
      } else {
        setAttendance([response.data, ...attendance]);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving attendance:', error);
      if (error.response?.data?.code === 11000) {
        setError('Attendance record already exists for this worker on this date');
      } else {
        setError(`Error saving attendance: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    
    // Format the date correctly for the input field (YYYY-MM-DD)
    let formattedDate = '';
    if (record.date) {
      const dateObj = new Date(record.date);
      formattedDate = dateObj.toISOString().split('T')[0];
    }
    
    // Extract the correct IDs (handle both populated objects and raw IDs)
    const workerId = record.worker?._id || record.worker;
    const projectId = record.project?._id || record.project;
    
    setFormData({
      date: formattedDate,
      workerId: workerId,
      projectId: projectId,
      status: record.status,
      overtimeHours: record.overtimeHours || 0,
      notes: record.notes || ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (record) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceAPI.delete(record._id);
        setSuccess('Attendance record deleted successfully');
        // Remove from local state
        setAttendance(attendance.filter(item => item._id !== record._id));
      } catch (error) {
        console.error('Error deleting attendance:', error);
        setError(`Error deleting attendance: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workerId: '',
      projectId: '',
      status: 'present',
      overtimeHours: 0,
      notes: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const columns = [
    { 
      key: 'date', 
      title: 'Date',
      render: (value) => {
        if (!value) return 'N/A';
        try {
          return new Date(value).toLocaleDateString();
        } catch (e) {
          console.error('Error parsing date:', e, value);
          return 'Invalid Date';
        }
      }
    },
    { 
      key: 'worker',
      title: 'Worker',
      render: (value) => {
        // Handle both populated object and ID string
        if (typeof value === 'object' && value !== null) {
          return value.name || 'N/A';
        } else {
          const worker = workers.find(w => w._id === value);
          return worker ? worker.name : 'N/A';
        }
      }
    },
    { 
      key: 'project',
      title: 'Project',
      render: (value) => {
        // Handle both populated object and ID string
        if (typeof value === 'object' && value !== null) {
          return value.name || value.projectName || 'N/A';
        } else {
          const project = projects.find(p => p._id === value);
          return project ? project.name : 'N/A';
        }
      }
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'present' ? 'bg-green-100 text-green-800' :
          value === 'absent' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'overtimeHours', title: 'Overtime Hours' },
    { key: 'notes', title: 'Notes' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Mark Attendance
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError('')}
            className="absolute top-0 right-0 p-2"
          >
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="absolute top-0 right-0 p-2"
          >
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={attendance}
          onEdit={isAdmin ? handleEdit : null}
          onDelete={isAdmin ? handleDelete : null}
          showActions={isAdmin}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.workerId}
              onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.name} - {worker.role} (₹{worker.dailySalary}/day)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} {project.clientName ? `- ${project.clientName}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="halfday">Half Day</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.overtimeHours}
              onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              {editingRecord ? 'Update Attendance' : 'Mark Attendance'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;