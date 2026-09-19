import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Shield,
  Users,
  LayoutDashboard,
  Plus,
  X,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Archive,
  Activity,
  GraduationCap,
} from 'lucide-react';
import Navbar      from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth }          from '../contexts/AuthContext';
import { listAdmins, createAdmin, deleteAdmin, fetchGlobalStats } from '../services/api';

// ── Field Error (animated, consistent with other forms) ────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.span
      className="field-error"
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.14 }}
    >
      <AlertCircle size={11} aria-hidden="true" />
      {message}
    </motion.span>
  );
}

// ── Global Stats Cards ──────────────────────────────────────────────────────────
// dimVar and colorVar are full CSS var() strings, e.g. 'var(--clr-user-dim)'
const statVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  })
};

function GlobalStatCard({ icon: Icon, label, value, colorVar, dimVar, customIndex }) {
  return (
    <motion.article
      className="stat-card"
      style={{ borderColor: colorVar }}
      custom={customIndex}
      variants={statVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
    >
      <div
        className="stat-icon"
        style={{ background: dimVar, color: colorVar }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div
          className="stat-value"
          style={{ color: colorVar }}
          aria-label={`${value} ${label}`}
        >
          {value ?? '—'}
        </div>
      </div>
    </motion.article>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Global stats ────────────────────────────────────────
  const [globalStats, setGlobalStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError]     = useState('');

  // ── Wardens list ────────────────────────────────────────
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── Create warden form ──────────────────────────────────
  const [form, setForm] = useState({ name: '', email: '', password: '', rollOrEmployeeId: '' });
  const [formErrors,  setFormErrors]  = useState({});
  const [formSuccess, setFormSuccess] = useState('');
  const [creating,    setCreating]    = useState(false);
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    fetchGlobalStats()
      .then(setGlobalStats)
      .catch(() => setStatsError('Could not load global statistics.'))
      .finally(() => setStatsLoading(false));
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load warden accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validateCreate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name     = 'Full name is required.';
    if (!form.email.trim()) errs.email    = 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email.';
    if (!form.password)     errs.password = 'Password is required.';
    if (form.password.length > 0 && form.password.length < 6) errs.password = 'Min. 6 characters.';
    return errs;
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormSuccess('');
    const errs = validateCreate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setCreating(true);
    try {
      await createAdmin(form);
      setFormSuccess(`Warden account for "${form.name}" created successfully.`);
      setForm({ name: '', email: '', password: '', rollOrEmployeeId: '' });
      setShowForm(false);
      loadAdmins();
      // Refresh global stats
      fetchGlobalStats().then(setGlobalStats).catch(() => {});
    } catch (err) {
      const serverErrs = err?.response?.data?.errors;
      if (Array.isArray(serverErrs)) {
        const mapped = {};
        serverErrs.forEach(({ field, message }) => { mapped[field] = message; });
        setFormErrors(mapped);
      } else {
        setFormErrors({ submit: err?.response?.data?.error || 'Failed to create warden.' });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate warden account for "${name}"? They will no longer be able to log in.`)) return;
    try {
      await deleteAdmin(id);
      setAdmins((prev) => prev.map((a) => a._id === id ? { ...a, isActive: false } : a));
      fetchGlobalStats().then(setGlobalStats).catch(() => {});
    } catch (err) {
      alert(err?.response?.data?.error || 'Deactivation failed.');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main" id="admin-main">
        {/* Header */}
        <header className="section-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ShieldAlert size={26} strokeWidth={1.8} aria-hidden="true" />
            Super Admin Panel
          </h1>
          <p>Logged in as <strong>{user?.name}</strong></p>
        </header>

        {/* Warden View quick-link */}
        <Link to="/warden" id="goto-warden-view" className="warden-quick-link">
          <LayoutDashboard size={14} aria-hidden="true" />
          Open Warden View (manage items &amp; resolve reports)
        </Link>

        {/* ── Global Statistics ─────────────────────────────── */}
        <section aria-label="Global statistics" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="subsection-title">
            <TrendingUp size={15} aria-hidden="true" />
            Platform Overview
          </h2>

          {statsLoading ? (
            <div className="stats-bar">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="stat-card" style={{ animation: 'none' }}>
                  <div className="skeleton skeleton-line" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                    <div className="skeleton skeleton-line" style={{ width: '40%', height: 24 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div className="error-banner"><AlertCircle size={14} aria-hidden="true" /> {statsError}</div>
          ) : (
            <div className="stats-bar">
              <GlobalStatCard
                icon={GraduationCap} label="Students" value={globalStats?.totalUsers}
                colorVar="var(--clr-user)" dimVar="var(--clr-user-dim)" customIndex={0}
              />
              <GlobalStatCard
                icon={Shield} label="Active Wardens" value={globalStats?.totalWardens}
                colorVar="var(--clr-admin)" dimVar="var(--clr-admin-dim)" customIndex={1}
              />
              <GlobalStatCard
                icon={Activity} label="Items All‑Time" value={globalStats?.totalItems}
                colorVar="var(--clr-text-primary)" dimVar="var(--clr-surface-3)" customIndex={2}
              />
              <GlobalStatCard
                icon={CheckCircle2} label="Resolved Total" value={globalStats?.resolvedItems}
                colorVar="var(--clr-resolved)" dimVar="var(--clr-resolved-dim)" customIndex={3}
              />
              <GlobalStatCard
                icon={Archive} label="Currently Active" value={globalStats?.activeItems}
                colorVar="var(--clr-lost)" dimVar="var(--clr-lost-dim)" customIndex={4}
              />
              <GlobalStatCard
                icon={TrendingUp} label="Resolution Rate" value={globalStats != null ? `${globalStats.resolutionRate}%` : null}
                colorVar="var(--clr-found)" dimVar="var(--clr-found-dim)" customIndex={5}
              />
            </div>
          )}
        </section>

        {/* ── Warden Management ─────────────────────────────── */}
        <section aria-label="Warden management" style={{ animation: 'fade-in-up 0.4s ease 0.15s both' }}>
          <h2 className="subsection-title">
            <Shield size={15} aria-hidden="true" />
            Warden Accounts
          </h2>

          <AnimatePresence>
            {formSuccess && (
              <motion.div
                className="auth-success"
                style={{ marginBottom: 'var(--space-4)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                {formSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="admin-panel-card">
            {/* Card Header */}
            <div className="admin-panel-header">
              <h3 className="admin-panel-title">
                <Users size={16} aria-hidden="true" />
                Campus Wardens
                <span className="panel-count found" style={{ marginLeft: '8px' }}>
                  {admins.filter((a) => a.isActive).length} active
                </span>
              </h3>
              <button
                id="create-admin-btn"
                className="btn-submit"
                style={{ width: 'auto', padding: '7px 16px', fontSize: '13px' }}
                onClick={() => { setShowForm((v) => !v); setFormErrors({}); }}
              >
                {showForm ? <><X size={13} aria-hidden="true" /> Cancel</> : <><Plus size={13} aria-hidden="true" /> New Warden</>}
              </button>
            </div>

            {/* Create form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <form className="form admin-create-form" onSubmit={handleCreateAdmin} noValidate>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="admin-name" className="form-label">Full Name <span className="form-required">*</span></label>
                        <input id="admin-name" type="text" className={`form-input${formErrors.name ? ' has-error' : ''}`} placeholder="e.g. Dr. Rajesh Kumar" value={form.name} onChange={set('name')} autoComplete="name" />
                        <AnimatePresence>
                          {formErrors.name && <FieldError message={formErrors.name} />}
                        </AnimatePresence>
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-empid" className="form-label">Employee ID</label>
                        <input id="admin-empid" type="text" className="form-input" placeholder="e.g. EMP00123" value={form.rollOrEmployeeId} onChange={set('rollOrEmployeeId')} autoComplete="off" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="admin-email" className="form-label">Email <span className="form-required">*</span></label>
                        <input id="admin-email" type="email" className={`form-input${formErrors.email ? ' has-error' : ''}`} placeholder="warden@campus.edu" value={form.email} onChange={set('email')} autoComplete="email" />
                        <AnimatePresence>
                          {formErrors.email && <FieldError message={formErrors.email} />}
                        </AnimatePresence>
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-password" className="form-label">Password <span className="form-required">*</span></label>
                        <input id="admin-password" type="password" className={`form-input${formErrors.password ? ' has-error' : ''}`} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
                        <AnimatePresence>
                          {formErrors.password && <FieldError message={formErrors.password} />}
                        </AnimatePresence>
                      </div>
                    </div>
                    <AnimatePresence>
                      {formErrors.submit && (
                        <motion.p
                          className="auth-error"
                          role="alert"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <AlertCircle size={14} aria-hidden="true" />
                          {formErrors.submit}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <button id="admin-create-submit" type="submit" className="btn-submit" disabled={creating} style={{ alignSelf: 'flex-start', padding: '9px 20px' }}>
                      {creating ? (
                        <><span className="btn-spinner" aria-hidden="true" /> Creating…</>
                      ) : (
                        'Create Warden Account'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wardens table */}
            {error ? (
              <div className="error-banner" style={{ margin: 'var(--space-5)' }}>
                <AlertCircle size={14} aria-hidden="true" /> {error}
              </div>
            ) : loading ? (
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <SkeletonCard /><SkeletonCard />
              </div>
            ) : admins.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-12) var(--space-6)' }}>
                <div className="empty-state-icon"><Users size={22} strokeWidth={1.5} /></div>
                <p className="empty-state-title">No warden accounts yet</p>
                <p className="empty-state-desc">Create the first campus warden using the button above.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Employee ID</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a._id} className={!a.isActive ? 'row-inactive' : ''}>
                        <td><strong>{a.name}</strong></td>
                        <td style={{ color: 'var(--clr-text-secondary)' }}>{a.email}</td>
                        <td style={{ color: 'var(--clr-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {a.rollOrEmployeeId || '—'}
                        </td>
                        <td>
                          <span className={`status-badge ${a.isActive ? 'active' : 'inactive'}`}>
                            {a.isActive
                              ? <><UserCheck size={10} aria-hidden="true" /> Active</>
                              : <><UserX size={10} aria-hidden="true" /> Inactive</>
                            }
                          </span>
                        </td>
                        <td style={{ color: 'var(--clr-text-muted)' }}>
                          {new Date(a.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          {a.isActive && (
                            <button
                              id={`deactivate-admin-${a._id}`}
                              className="btn-danger-sm"
                              onClick={() => handleDelete(a._id, a.name)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
