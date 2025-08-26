import React, { useState, useEffect } from 'react';
import { attendanceAPI, workersAPI, projectsAPI } from '../api/api';
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

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchAttendance();
    fetchWorkers();
    fetchProjects();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await attendanceAPI.getAll();
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await attendanceAPI.update(editingRecord._id, formData);
      } else {
        await attendanceAPI.create(formData);
      }
      
      // Update worker's pending salary if present
      if (formData.status === 'present') {
        const worker = workers.find(w => w._id === formData.workerId);
        if (worker) {
          const dailySalary = worker.dailySalary || 0;
          const overtimeRate = dailySalary / 8; // Assuming 8 hours per day
          const overtimeAmount = formData.overtimeHours * overtimeRate;
          const totalAmount = dailySalary + overtimeAmount;
          
          await workersAPI.update(formData.workerId, {
            pendingSalary: (worker.pendingSalary || 0) + totalAmount
          });
        }
      }
      
      fetchAttendance();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      date: record.date ? record.date.split('T')[0] : '',
      workerId: record.workerId._id || record.workerId,
      projectId: record.projectId._id || record.projectId,
      status: record.status,
      overtimeHours: record.overtimeHours || 0,
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        // Deduct salary if record was present
        if (record.status === 'present') {
          const worker = workers.find(w => w._id === record.workerId._id || w._id === record.workerId);
          if (worker) {
            const dailySalary = worker.dailySalary || 0;
            const overtimeRate = dailySalary / 8;
            const overtimeAmount = (record.overtimeHours || 0) * overtimeRate;
            const totalAmount = dailySalary + overtimeAmount;
            
            await workersAPI.update(record.workerId._id || record.workerId, {
              pendingSalary: Math.max(0, (worker.pendingSalary || 0) - totalAmount)
            });
          }
        }
        
        await attendanceAPI.delete(record._id);
        fetchAttendance();
      } catch (error) {
        console.error('Error deleting attendance:', error);
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
  };

  const columns = [
    { 
      key: 'date', 
      title: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'workerId', 
      title: 'Worker',
      render: (value) => value?.name || 'N/A'
    },
    { 
      key: 'projectId', 
      title: 'Project',
      render: (value) => value?.name || 'N/A'
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Mark Attendance
          </button>
        )}
      </div>

      <div className="card">
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
              className="input-field"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
            <select
              required
              className="input-field"
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
              className="input-field"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="input-field"
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
              className="input-field"
              value={formData.overtimeHours}
              onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingRecord ? 'Update Attendance' : 'Mark Attendance'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn-secondary flex-1"
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