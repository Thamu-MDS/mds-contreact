import React, { useState, useEffect } from 'react';
import { projectOwnersAPI } from '../api/api';
import Table from '../components/Table';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectOwnersAPI.getAll();
      // Transform the owners data into projects data
      const projectsData = response.data.map(owner => ({
        id: owner._id,
        projectName: owner.projectName || 'Unnamed Project',
        ownerName: owner.name,
        totalAmount: owner.totalProjectValue || 0,
        company: owner.company,
        email: owner.email,
        phone: owner.phone
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectColumns = [
    { key: 'projectName', title: 'Project Name' },
    { key: 'ownerName', title: 'Owner' },
    { 
      key: 'totalAmount', 
      title: 'Total Amount',
      render: (value) => value ? `$${parseFloat(value).toLocaleString()}` : '$0'
    },
    { key: 'company', title: 'Company' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone' },
    {
      key: 'actions',
      title: '',
      render: (_, project) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewProject(project)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="View Project Details"
          >
            View Details
          </button>

          {isAdmin && (
            <button
              onClick={() => handleEditProject(project)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Edit Project"
            >
              Edit
            </button>
          )}
        </div>
      )
    }
  ];

  const handleViewProject = (project) => {
    // Navigate to project details page or show modal
    console.log('View project:', project);
  };

  const handleEditProject = (project) => {
    // Navigate to edit project page or show modal
    console.log('Edit project:', project);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        {/* Add Project button has been removed as requested */}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={projectColumns}
          data={projects}
          showActions={false}
        />
      </div>
    </div>
  );
};

export default Projects;