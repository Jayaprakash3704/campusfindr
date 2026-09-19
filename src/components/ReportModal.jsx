import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Search, PackageCheck, User, Building2, X } from 'lucide-react';
import { reportItem } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ITEM_CATEGORIES } from '../config/statusConfig';

const INITIAL_FORM = {
  reportType:  'lost',
  type:        'personal',
  title:       '',
  category:    '',
  location:    '',
  date:        '',
  description: '',
  serialNumber: '',
  associatedDepartment: '',
};

function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.span
      className="field-error"
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      <AlertCircle size={11} aria-hidden="true" />
      {message}
    </motion.span>
  );
}

/** Returns today's date in YYYY-MM-DD for max attribute on date input */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Slide-up modal sheet for reporting a new lost/found item.
 * Uses Framer Motion for spring-based enter/exit.
 */
export default function ReportModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const reporterId = user?.rollOrEmployeeId || user?.email || user?._id || '';

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setDirect = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const touch = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // ── Field-level validation ─────────────────────────────────
  const validateField = useCallback((field, value, allForm) => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Item title is required.';
        if (value.trim().length < 3) return 'Title must be at least 3 characters.';
        if (value.trim().length > 120) return 'Title must be 120 characters or less.';
        return '';
      case 'category':
        if (!value) return 'Please select a category.';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required.';
        if (value.trim().length < 3) return 'Please be more specific about the location.';
        return '';
      case 'date':
        if (!value) return 'Date is required.';
        if (new Date(value) > new Date()) return 'Date cannot be in the future.';
        return '';
      case 'description':
        if (value && value.length > 500) return 'Description must be 500 characters or less.';
        if (value && value.length > 0 && value.length < 10) return 'Description must be at least 10 characters.';
        return '';
      default:
        return '';
    }
  }, []);

  const handleBlur = (field) => {
    touch(field)();
    const err = validateField(field, form[field], form);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // ── Full form validation ───────────────────────────────────
  function validateAll() {
    const fields = ['title', 'category', 'location', 'date', 'description'];
    const errs = {};
    fields.forEach((f) => {
      const e = validateField(f, form[f], form);
      if (e) errs[f] = e;
    });
    if (!reporterId) errs.reporterId = 'Could not determine reporter identity.';
    return errs;
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Mark all touched so errors show
      setTouched({ title: true, category: true, location: true, date: true, description: true });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        reporterId,
        type:        form.type,
        reportType:  form.reportType,
        title:       form.title.trim(),
        category:    form.category,
        description: form.description.trim(),
        location:    form.location.trim(),
        date:        form.date || undefined,
        metadata: {
          serialNumber:         form.serialNumber.trim() || null,
          associatedDepartment: form.associatedDepartment.trim() || null,
        },
      };
      const result = await reportItem(payload);
      onSuccess(result.data);
      setForm(INITIAL_FORM);
      setTouched({});
      setErrors({});
      onClose();
    } catch (err) {
      const serverErrs = err?.response?.data?.errors;
      if (Array.isArray(serverErrs)) {
        const mapped = {};
        serverErrs.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setErrors({ submit: err?.response?.data?.error || 'Submission failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched({});
    onClose();
  };

  const overlayVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
    exit:    { opacity: 0 },
  };

  const sheetVariants = {
    hidden:  { y: '100%', opacity: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 340, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0.8,
      transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            className="modal-sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="modal-handle" aria-hidden="true" />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <h2 id="modal-title" className="modal-title">Report an Item</h2>
                <p className="modal-subtitle">
                  Submit a lost or found item to the CampusFindr hub
                </p>
              </div>
              <button
                onClick={handleClose}
                className="theme-toggle"
                aria-label="Close modal"
                style={{ flexShrink: 0, marginTop: '2px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form className="form" onSubmit={handleSubmit} noValidate>

              {/* Report Type toggle */}
              <div className="form-group">
                <label className="form-label">I am reporting a<span className="form-required">*</span></label>
                <div className="report-type-group">
                  {['lost', 'found'].map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      id={`report-type-${rt}`}
                      className={`report-type-btn ${rt}${form.reportType === rt ? ' active' : ''}`}
                      onClick={() => setDirect('reportType', rt)}
                      aria-pressed={form.reportType === rt}
                    >
                      {rt === 'lost'
                        ? <><Search size={13} aria-hidden="true" /> Lost Item</>
                        : <><PackageCheck size={13} aria-hidden="true" /> Found Item</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Type toggle */}
              <div className="form-group">
                <label className="form-label">Item belongs to</label>
                <div className="item-type-group">
                  {[
                    { value: 'personal',      Icon: User,      label: 'Personal' },
                    { value: 'institutional', Icon: Building2, label: 'Institutional' },
                  ].map(({ value, Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      id={`item-type-${value}`}
                      className={`item-type-btn${form.type === value ? ' active' : ''}`}
                      onClick={() => setDirect('type', value)}
                      aria-pressed={form.type === value}
                    >
                      <Icon size={13} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reporting As */}
              <div className="form-group">
                <label className="form-label">Reporting As</label>
                <div className="reporter-pill">
                  <User size={13} aria-hidden="true" />
                  <span>{user?.name}</span>
                  {reporterId && <span className="reporter-id">ID: {reporterId}</span>}
                </div>
                <AnimatePresence>
                  {errors.reporterId && <FieldError message={errors.reporterId} />}
                </AnimatePresence>
              </div>

              {/* Category + Date row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="report-category" className="form-label">
                    Category <span className="form-required">*</span>
                  </label>
                  <select
                    id="report-category"
                    className={`form-select${touched.category && errors.category ? ' has-error' : ''}`}
                    value={form.category}
                    onChange={set('category')}
                    onBlur={() => handleBlur('category')}
                    aria-invalid={!!errors.category}
                    aria-describedby={errors.category ? 'category-error' : undefined}
                  >
                    <option value="">Select category…</option>
                    {ITEM_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {touched.category && errors.category && (
                      <FieldError message={errors.category} />
                    )}
                  </AnimatePresence>
                </div>

                <div className="form-group">
                  <label htmlFor="report-date" className="form-label">
                    Date <span className="form-required">*</span>
                  </label>
                  <input
                    id="report-date"
                    type="date"
                    className={`form-input${touched.date && errors.date ? ' has-error' : ''}`}
                    value={form.date}
                    onChange={set('date')}
                    onBlur={() => handleBlur('date')}
                    min="2000-01-01"
                    max={todayStr()}
                    aria-invalid={!!errors.date}
                  />
                  <AnimatePresence>
                    {touched.date && errors.date && <FieldError message={errors.date} />}
                  </AnimatePresence>
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="report-title" className="form-label">
                  Item Title <span className="form-required">*</span>
                </label>
                <input
                  id="report-title"
                  type="text"
                  className={`form-input${touched.title && errors.title ? ' has-error' : ''}`}
                  placeholder="e.g. Black Leather Wallet"
                  value={form.title}
                  onChange={set('title')}
                  onBlur={() => handleBlur('title')}
                  maxLength={120}
                  aria-invalid={!!errors.title}
                />
                <AnimatePresence>
                  {touched.title && errors.title && <FieldError message={errors.title} />}
                </AnimatePresence>
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="report-location" className="form-label">
                  Location <span className="form-required">*</span>
                </label>
                <input
                  id="report-location"
                  type="text"
                  className={`form-input${touched.location && errors.location ? ' has-error' : ''}`}
                  placeholder="e.g. Central Library, 2nd Floor Reading Room"
                  value={form.location}
                  onChange={set('location')}
                  onBlur={() => handleBlur('location')}
                  aria-invalid={!!errors.location}
                />
                <AnimatePresence>
                  {touched.location && errors.location && <FieldError message={errors.location} />}
                </AnimatePresence>
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="report-description" className="form-label">
                  Description
                  <span style={{ color: 'var(--clr-text-muted)', fontSize: '11px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>
                    {form.description.length}/500
                  </span>
                </label>
                <textarea
                  id="report-description"
                  className={`form-textarea${touched.description && errors.description ? ' has-error' : ''}`}
                  placeholder="Any identifying details that would help — color, brand, distinguishing marks…"
                  value={form.description}
                  onChange={set('description')}
                  onBlur={() => handleBlur('description')}
                  maxLength={500}
                  rows={3}
                  aria-invalid={!!errors.description}
                />
                <AnimatePresence>
                  {touched.description && errors.description && (
                    <FieldError message={errors.description} />
                  )}
                </AnimatePresence>
              </div>

              {/* Institutional fields */}
              {form.type === 'institutional' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="report-serial" className="form-label">Serial Number</label>
                    <input
                      id="report-serial"
                      type="text"
                      className="form-input"
                      placeholder="e.g. OSC-PL-07"
                      value={form.serialNumber}
                      onChange={set('serialNumber')}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="report-dept" className="form-label">Department</label>
                    <input
                      id="report-dept"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Physics Lab"
                      value={form.associatedDepartment}
                      onChange={set('associatedDepartment')}
                    />
                  </div>
                </div>
              )}

              {/* Server error */}
              <AnimatePresence>
                {errors.submit && (
                  <motion.p
                    role="alert"
                    className="auth-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <AlertCircle size={14} aria-hidden="true" />
                    {errors.submit}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  id="modal-cancel-btn"
                  className="btn-cancel"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-submit-btn"
                  className="btn-submit"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting
                    ? 'Submitting…'
                    : `Submit ${form.reportType === 'lost' ? 'Lost' : 'Found'} Report`
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
