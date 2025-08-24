import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Main pages
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Projects from './pages/Projects';
import ProjectOwners from './pages/ProjectOwners';
import Materials from './pages/Materials';
import Attendance from './pages/Attendance';
import Salaries from './pages/Salaries';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="project-owners" element={<ProjectOwners />} />
            <Route path="materials" element={<Materials />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="salaries" element={<Salaries />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;