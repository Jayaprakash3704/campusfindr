import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — Wraps a route and enforces:
 *  1. Authentication  → redirect to /login
 *  2. Role check      → redirect to /dashboard with 403 message (if roles provided)
 *
 * Usage:
 *  <ProtectedRoute>              — any authenticated user
 *  <ProtectedRoute roles={['admin','superadmin']}>  — role-gated
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
        <span style={{ color: 'var(--clr-text-muted)', fontSize: '13px' }}>Verifying session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
