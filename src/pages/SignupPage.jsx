import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signup as apiSignup } from '../services/api';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Password strength: 0 (empty) → 4 (strong)
 * Checks length, uppercase, number, special char.
 */
function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
/* Use CSS variables so colors adapt to light/dark mode automatically */
const STRENGTH_COLORS = [
  '',
  'var(--clr-danger)',
  'var(--clr-found)',
  'var(--clr-lost)',
  'var(--clr-resolved)',
];

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

/** Inline eye-toggle button, reused for both password fields */
function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--clr-text-muted)',
        display: 'flex',
        padding: 0,
        transition: 'color 120ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--clr-text-secondary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--clr-text-muted)'; }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

export default function SignupPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', rollOrEmployeeId: '', email: '', password: '', confirm: '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);

  const pwStrength = getPasswordStrength(form.password);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!isValidEmail(value)) return 'Enter a valid email address.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        return '';
      case 'confirm':
        if (!value) return 'Please confirm your password.';
        if (value !== form.password) return 'Passwords do not match.';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((p) => ({ ...p, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = ['name', 'email', 'password', 'confirm'];
    const errs = {};
    fields.forEach((f) => {
      const e = validateField(f, form[f]);
      if (e) errs[f] = e;
    });
    setTouched({ name: true, email: true, password: true, confirm: true });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { token, user } = await apiSignup({
        name:             form.name.trim(),
        email:            form.email.trim(),
        password:         form.password,
        rollOrEmployeeId: form.rollOrEmployeeId.trim() || null,
      });
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const serverErrs = err?.response?.data?.errors;
      if (Array.isArray(serverErrs)) {
        const mapped = {};
        serverErrs.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setErrors({ submit: err?.response?.data?.error || 'Signup failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="auth-logo">
          <div className="navbar-logo-mark" aria-hidden="true">
            <MapPin size={14} strokeWidth={2.2} />
          </div>
          <span className="navbar-title">CampusFindr</span>
        </div>
        <p className="auth-sih">SIH1516 · Smart Education</p>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          Join CampusFindr to report and recover lost items on campus
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">
                Full Name <span className="form-required">*</span>
              </label>
              <input
                id="signup-name"
                type="text"
                className={`form-input${touched.name && errors.name ? ' has-error' : ''}`}
                placeholder="Aditya Sharma"
                value={form.name}
                onChange={set('name')}
                onBlur={() => handleBlur('name')}
                autoFocus
                aria-invalid={touched.name && !!errors.name}
              />
              <AnimatePresence>
                {touched.name && errors.name && <FieldError message={errors.name} />}
              </AnimatePresence>
            </div>

            <div className="form-group">
              <label htmlFor="signup-rollid" className="form-label">Roll / Employee ID</label>
              <input
                id="signup-rollid"
                type="text"
                className="form-input"
                placeholder="e.g. STU10293"
                value={form.rollOrEmployeeId}
                onChange={set('rollOrEmployeeId')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Email Address <span className="form-required">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              className={`form-input${touched.email && errors.email ? ' has-error' : ''}`}
              placeholder="you@campus.edu"
              value={form.email}
              onChange={set('email')}
              onBlur={() => handleBlur('email')}
              autoComplete="email"
              aria-invalid={touched.email && !!errors.email}
            />
            <AnimatePresence>
              {touched.email && errors.email && <FieldError message={errors.email} />}
            </AnimatePresence>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">
                Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input${touched.password && errors.password ? ' has-error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  onBlur={() => handleBlur('password')}
                  autoComplete="new-password"
                  aria-invalid={touched.password && !!errors.password}
                  style={{ paddingRight: '36px' }}
                />
                <EyeToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />
              </div>
              {/* Password strength meter */}
              <AnimatePresence>
                {form.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="pw-strength">
                      <div
                        className="pw-strength-bar"
                        style={{
                          width: `${(pwStrength / 4) * 100}%`,
                          background: STRENGTH_COLORS[pwStrength],
                        }}
                      />
                    </div>
                    <div className="pw-strength-label" style={{ color: STRENGTH_COLORS[pwStrength] }}>
                      {STRENGTH_LABELS[pwStrength]}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {touched.password && errors.password && <FieldError message={errors.password} />}
              </AnimatePresence>
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm" className="form-label">
                Confirm Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-confirm"
                  type={showCf ? 'text' : 'password'}
                  className={`form-input${touched.confirm && errors.confirm ? ' has-error' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  onBlur={() => handleBlur('confirm')}
                  autoComplete="new-password"
                  aria-invalid={touched.confirm && !!errors.confirm}
                  style={{ paddingRight: '36px' }}
                />
                <EyeToggle show={showCf} onToggle={() => setShowCf((v) => !v)} />
              </div>
              <AnimatePresence>
                {touched.confirm && errors.confirm && <FieldError message={errors.confirm} />}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {errors.submit && (
              <motion.p
                className="auth-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                {errors.submit}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            id="signup-submit-btn"
            type="submit"
            className="btn-submit"
            disabled={loading}
            aria-busy={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><span className="btn-spinner" aria-hidden="true" /> Creating account…</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-note">
          By signing up you are registered as a <strong>Student</strong>.
          Admin accounts are created by the superadmin only.
        </p>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" id="goto-login-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
