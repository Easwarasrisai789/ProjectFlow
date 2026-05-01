// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireGuest } from './components/shared/RouteGuards';
import Layout from './components/shared/Layout';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import ProjectsPage from './components/projects/ProjectsPage';
import ProjectDetail from './components/projects/ProjectDetail';
import TasksPage from './components/tasks/TasksPage';
import TeamPage from './components/team/TeamPage';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#21212a',
            color: '#f0eff6',
            border: '1px solid #2e2e3a',
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#21212a' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#21212a' } },
        }}
      />
      <Routes>
        <Route path="/auth" element={<RequireGuest><AuthPage /></RequireGuest>} />
        <Route path="/" element={<RequireAuth><Layout><Navigate to="/dashboard" replace /></Layout></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
        <Route path="/projects"  element={<RequireAuth><Layout><ProjectsPage /></Layout></RequireAuth>} />
        <Route path="/projects/:projectId" element={<RequireAuth><Layout><ProjectDetail /></Layout></RequireAuth>} />
        <Route path="/tasks"     element={<RequireAuth><Layout><TasksPage /></Layout></RequireAuth>} />
        <Route path="/team"      element={<RequireAuth><Layout><TeamPage /></Layout></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
