import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ShieldAlert,
  Shield,
  Sun,
  Moon,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuth }  from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ROLE_CONFIG } from '../config/statusConfig';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate   = useNavigate();
  const { theme, toggle } = useTheme();

  const roleInfo = ROLE_CONFIG[user?.role] || ROLE_CONFIG.user;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Home link goes to the role-appropriate page
  const homeHref = user?.role === 'superadmin'
    ? '/admin'
    : user?.role === 'admin'
    ? '/warden'
    : '/dashboard';

  const RoleIcon = user?.role === 'superadmin'
    ? ShieldAlert
    : user?.role === 'admin'
    ? Shield
    : GraduationCap;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">

        {/* Brand — links to role-appropriate home */}
        <div className="navbar-brand">
          <Link to={homeHref} className="navbar-logo" aria-label="CampusFindr home">
            <div className="navbar-logo-mark" aria-hidden="true">
              <MapPin size={15} strokeWidth={2.2} />
            </div>
            <span className="navbar-title">CampusFindr</span>
          </Link>
          <span className="navbar-sih-badge">SIH-1516</span>
        </div>

        {/* Role-aware nav links — hidden on very small screens */}
        <div className="navbar-center-links">
          {user?.role === 'user' && (
            <Link to="/dashboard" id="nav-browse" className="nav-link">
              <GraduationCap size={13} aria-hidden="true" /> Student Hub
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link to="/warden" id="nav-warden" className="nav-link">
              <Shield size={13} aria-hidden="true" /> Warden View
            </Link>
          )}
          {user?.role === 'superadmin' && (
            <Link to="/admin" id="nav-admin" className="nav-link-accent">
              <ShieldAlert size={13} aria-hidden="true" /> Admin Panel
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">

          {/* Theme toggle */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -50, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1 }}
                  exit={{   opacity: 0, rotate:  50, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ display: 'flex' }}
                >
                  <Sun size={15} strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate:  50, scale: 0.7 }}
                  animate={{ opacity: 1, rotate:  0,  scale: 1 }}
                  exit={{   opacity: 0, rotate: -50, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ display: 'flex' }}
                >
                  <Moon size={15} strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User pill — hidden on mobile (CSS) */}
          {user && (
            <div className="user-pill">
              <RoleIcon size={13} style={{ color: roleInfo.colorVar, flexShrink: 0 }} aria-hidden="true" />
              <span className="user-name">{user.name}</span>
              <span className={`role-badge ${roleInfo.cssClass}`}>{roleInfo.label}</span>
            </div>
          )}

          {/* Logout */}
          <button
            id="logout-btn"
            className="btn-sign-out"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={13} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
