import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, CalendarDays, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar      from '../components/Navbar';
import StatsBar    from '../components/StatsBar';
import ItemGrid    from '../components/ItemGrid';
import ReportModal from '../components/ReportModal';
import { useItems }   from '../hooks/useItems';
import { useAuth }    from '../contexts/AuthContext';
import { fetchStats } from '../services/api';

function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const show = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);
  return { toast, show };
}

/**
 * Warden Dashboard — accessible by role: admin and superadmin.
 *
 * Wardens see:
 *  - Live stats bar (lost / found / resolved)
 *  - Full item feed with Resolve/Archive controls on every card
 *  - FAB to submit reports on behalf of students
 *  - Superadmin also sees a quick-link to Admin Panel
 */
export default function WardenDashboard() {
  const { user }  = useAuth();
  const { lostItems, foundItems, loading, error, removeItem, addItem } = useItems();
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isModalOpen, setModalOpen]       = useState(false);
  const { toast, show: showToast }        = useToast();

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    fetchStats()
      .then((s) => setResolvedCount(s.resolved))
      .catch(console.error);
  }, []);

  // Keyboard shortcut: N → open modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !isModalOpen && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        setModalOpen(true);
      }
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  const handleResolve = useCallback((id) => {
    removeItem(id);
    setResolvedCount((c) => c + 1);
    showToast('Item archived and marked as claimed', 'success');
  }, [removeItem, showToast]);

  const handleNewItem = useCallback((item) => {
    addItem(item);
    showToast(`${item.reportType === 'lost' ? 'Lost' : 'Found'} report submitted`, 'success');
  }, [addItem, showToast]);

  const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main" id="warden-main">
        {/* Header */}
        <header className="section-header">
          <h1>
            Warden Dashboard
            {isSuperAdmin && (
              <Link
                to="/admin"
                id="goto-admin-panel"
                className="admin-nav-link"
                style={{ fontSize: '13px', marginLeft: '16px', verticalAlign: 'middle', animation: 'fade-in-up 0.4s ease both' }}
              >
                <ShieldAlert size={13} aria-hidden="true" /> Admin Panel
              </Link>
            )}
          </h1>
          <p>
            <CalendarDays size={13} aria-hidden="true" />
            <span>{today} · Warden: <strong>{user?.name}</strong></span>
          </p>
        </header>

        {/* Warden notice */}
        <div className="warden-notice">
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>Resolve mode active — use the <strong>Mark Claimed &amp; Archive</strong> button on any card to close a report.</span>
        </div>

        {/* Stats */}
        <StatsBar
          lostCount={lostItems.length}
          foundCount={foundItems.length}
          resolvedCount={resolvedCount}
        />

        {error && (
          <div role="alert" className="error-banner" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </div>
        )}

        {/* Item feed — both columns show resolve buttons */}
        <div className="dashboard-grid">
          <ItemGrid
            items={lostItems}
            reportType="lost"
            isAdmin={true}
            onResolve={handleResolve}
            loading={loading}
          />
          <ItemGrid
            items={foundItems}
            reportType="found"
            isAdmin={true}
            onResolve={handleResolve}
            loading={loading}
          />
        </div>
      </main>

      {/* FAB */}
      <motion.button
        id="warden-fab-report-btn"
        className="fab"
        onClick={() => setModalOpen(true)}
        aria-label="Report a lost or found item (press N)"
        title="Report Item (N)"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
        <span className="fab-label">Report Item</span>
      </motion.button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNewItem}
      />

      {toast.message && (
        <div
          role="status"
          aria-live="polite"
          className={`toast ${toast.type}${toast.visible ? ' visible' : ''}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={14} aria-hidden="true" />
          ) : (
            <AlertCircle size={14} aria-hidden="true" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
