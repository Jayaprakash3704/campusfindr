import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider }         from './contexts/ThemeContext';
import PageTransition            from './components/PageTransition';
import LoginPage                 from './pages/LoginPage';
import SignupPage                from './pages/SignupPage';
import DashboardPage             from './pages/DashboardPage';    // student only
import WardenDashboard           from './pages/WardenDashboard'; // admin + superadmin
import AdminPanel                from './pages/AdminPanel';       // superadmin only

/**
 * RoleRedirect — sends each user to their correct home page on first access.
 * Used at "/" and "*" so no one lands on a blank page.
 */
function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'superadmin') return <Navigate to="/admin" replace />;
  if (user?.role === 'admin')      return <Navigate to="/warden" replace />;
  return <Navigate to="/dashboard" replace />;
}

/**
 * RouteGuard — protects a route by role.
 * If authenticated but wrong role, redirects to their correct home.
 */
function RouteGuard({ children, allowed }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
        <span style={{ color: 'var(--clr-text-muted)', fontSize: '13px' }}>
          Verifying session…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowed.includes(user?.role)) {
    // Bounce each role to their correct home
    if (user?.role === 'superadmin') return <Navigate to="/admin" replace />;
    if (user?.role === 'admin')      return <Navigate to="/warden" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login"  element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />

        {/* Student only */}
        <Route
          path="/dashboard"
          element={
            <RouteGuard allowed={['user']}>
              <PageTransition><DashboardPage /></PageTransition>
            </RouteGuard>
          }
        />

        {/* Warden + Superadmin */}
        <Route
          path="/warden"
          element={
            <RouteGuard allowed={['admin', 'superadmin']}>
              <PageTransition><WardenDashboard /></PageTransition>
            </RouteGuard>
          }
        />

        {/* Superadmin only */}
        <Route
          path="/admin"
          element={
            <RouteGuard allowed={['superadmin']}>
              <PageTransition><AdminPanel /></PageTransition>
            </RouteGuard>
          }
        />

        {/* Catch-all: redirect to role-appropriate home */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
