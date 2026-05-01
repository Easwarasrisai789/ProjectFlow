// src/components/shared/RouteGuards.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from './UI';

export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={36} />
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
};

export const RequireGuest = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export const RequireAdmin = ({ children }) => {
  const { profile, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spinner size={28} /></div>;
  if (profile?.role !== 'admin') return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Access Denied</h2>
      <p style={{ color: 'var(--text2)' }}>This page requires admin privileges.</p>
    </div>
  );
  return children;
};
