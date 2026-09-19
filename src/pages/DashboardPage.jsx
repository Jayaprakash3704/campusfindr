import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CalendarDays,
  Search,
  PackageCheck,
  ClipboardList,
  Clock,
  BadgeCheck,
  Archive,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Navbar       from '../components/Navbar';
import StatsBar     from '../components/StatsBar';
import ItemGrid     from '../components/ItemGrid';
import ReportModal  from '../components/ReportModal';
import SkeletonCard from '../components/SkeletonCard';
import { useItems }     from '../hooks/useItems';
import { useAuth }      from '../contexts/AuthContext';
import { fetchMyItems, fetchStats } from '../services/api';
import { STATUS_CONFIG } from '../config/statusConfig';

function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const show = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);
  return { toast, show };
}

/** My Reports — student's own submissions with status badge */
function MyReportsPanel({ userId, email }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetchMyItems()
      .then(setItems)
      .catch(() => setError('Could not load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="empty-state-icon">
          <ClipboardList size={22} strokeWidth={1.5} />
        </div>
        <p className="empty-state-title">No reports yet</p>
        <p className="empty-state-desc">
          When you submit a lost or found report it will appear here with its current status.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          className="my-report-row"
        >
          {/* Status dot */}
          <div
            className="my-report-status-dot"
            style={{
              background: item.status === 'claimed'
                ? 'var(--clr-resolved)'
                : item.reportType === 'lost'
                ? 'var(--clr-lost)'
                : 'var(--clr-found)',
            }}
          />

          <div className="my-report-info">
            <span className="my-report-title">{item.title}</span>
            <span className="my-report-meta">
              {item.category} · {item.location}
            </span>
          </div>

          <div className="my-report-badges">
            {/* Report type */}
            <span
              className="badge"
              style={{
                background: item.reportType === 'lost'
                  ? 'var(--clr-lost-dim)'
                  : 'var(--clr-found-dim)',
                color: item.reportType === 'lost'
                  ? 'var(--clr-lost-text)'
                  : 'var(--clr-found-text)',
              }}
            >
              {item.reportType === 'lost'
                ? <><Search size={10} aria-hidden="true" /> Lost</>
                : <><PackageCheck size={10} aria-hidden="true" /> Found</>
              }
            </span>
            {/* Status */}
            <span
              className="badge"
              style={{
                background: item.status === 'claimed'
                  ? 'var(--clr-resolved-dim)'
                  : 'var(--clr-surface-3)',
                color: item.status === 'claimed'
                  ? 'var(--clr-resolved)'
                  : 'var(--clr-text-muted)',
              }}
            >
              {item.status === 'claimed'
                ? <><BadgeCheck size={10} aria-hidden="true" /> Resolved</>
                : <><Clock size={10} aria-hidden="true" /> Pending</>
              }
            </span>
          </div>

          <time
            className="card-time"
            dateTime={new Date(item.timestamp).toISOString()}
            title={new Date(item.timestamp).toLocaleString()}
          >
            {new Date(item.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </time>
        </motion.div>
      ))}
    </motion.div>
  );
}

const TABS = [
  { id: 'browse', label: 'Browse All', icon: Search },
  { id: 'mine',   label: 'My Reports', icon: ClipboardList },
];

export default function DashboardPage() {
  const { user }  = useAuth();
  const { lostItems, foundItems, loading, error, addItem } = useItems();
  const [resolvedCount, setResolvedCount] = useState(0);
  const [tab, setTab]           = useState('browse');
  const [isModalOpen, setModalOpen] = useState(false);
  const { toast, show: showToast }  = useToast();

  const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

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

  const handleNewItem = useCallback((item) => {
    addItem(item);
    showToast(
      `${item.reportType === 'lost' ? 'Lost' : 'Found'} report submitted. A warden will review it.`,
      'success'
    );
  }, [addItem, showToast]);

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main" id="main-content">
        {/* Page Header */}
        <header className="section-header">
          <h1>Lost &amp; Found Hub</h1>
          <p>
            <CalendarDays size={13} aria-hidden="true" />
            <span>{today} · Logged in as <strong>{user?.name}</strong></span>
          </p>
        </header>

        {/* Student info banner */}
        <div className="student-notice">
          <Search size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            Browse below for lost &amp; found items. Found yours? Contact the warden with your ID.
            Use <kbd>N</kbd> to quickly submit a report.
          </span>
        </div>

        {/* StatsBar for students */}
        <StatsBar
          lostCount={lostItems.length}
          foundCount={foundItems.length}
          resolvedCount={resolvedCount}
        />

        {/* Tabs */}
        <div className="tab-bar" role="tablist" aria-label="Dashboard sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={tab === id}
              className={`tab-btn${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
              {id === 'browse' && (lostItems.length + foundItems.length) > 0 && (
                <span className="tab-count">{lostItems.length + foundItems.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {error && (
                <div role="alert" className="error-banner" style={{ marginBottom: 'var(--space-4)' }}>
                  <AlertCircle size={14} aria-hidden="true" /> {error}
                </div>
              )}
              <div className="dashboard-grid">
                <ItemGrid
                  items={lostItems}
                  reportType="lost"
                  isAdmin={false}
                  onResolve={() => {}}
                  loading={loading}
                />
                <ItemGrid
                  items={foundItems}
                  reportType="found"
                  isAdmin={false}
                  onResolve={() => {}}
                  loading={loading}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mine"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="my-reports-panel"
            >
              <MyReportsPanel userId={user?._id} email={user?.email} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB: report item */}
      <motion.button
        id="fab-report-btn"
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
