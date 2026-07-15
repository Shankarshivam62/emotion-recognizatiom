/**
 * src/components/ProtectedRoute.jsx
 * ───────────────────────────────────
 * Wraps routes that require authentication.
 * Optionally requires admin role.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0D0D1A',
  },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '4px solid rgba(108,99,255,0.2)',
    borderTop: '4px solid #6C63FF',
    animation: 'spin 0.8s linear infinite',
  },
};
