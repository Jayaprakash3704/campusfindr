import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { login as apiLogin } from '../services/api';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || null;

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validateField = (field, value) => {
    if (field === 'email') {
      if (!value.trim()) return 'Email is required.';
      if (!isValidEmail(value)) return 'Enter a valid email address.';
    }
    if (field === 'password') {
      if (!value) return 'Password is required.';
    }
    return '';
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((p) => ({ ...p, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr    = validateField('email', form.email);
    const passwordErr = validateField('password', form.password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setLoading(true);
    try {
      const { token, user } = await apiLogin(form.email.trim(), form.password);
      login(token, user);
      if (from) { navigate(from, { replace: true }); return; }
      if (user.role === 'superadmin') navigate('/admin',     { replace: true });
      else if (user.role === 'admin') navigate('/warden',    { replace: true });
      else                            navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ submit: err?.response?.data?.error || 'Login failed. Check your credentials and try again.' });
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
        {/* Logo */}
        <div className="auth-logo">
          <div className="navbar-logo-mark" aria-hidden="true">
            <MapPin size={14} strokeWidth={2.2} />
          </div>
          <span className="navbar-title">CampusFindr</span>
        </div>
        <p className="auth-sih">SIH1516 · Smart Education</p>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access the lost &amp; found hub</p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address <span className="form-required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              className={`form-input${touched.email && errors.email ? ' has-error' : ''}`}
              placeholder="you@campus.edu"
              value={form.email}
              onChange={set('email')}
              onBlur={() => handleBlur('email')}
              autoComplete="email"
              autoFocus
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? 'login-email-error' : undefined}
            />
            <AnimatePresence>
              {touched.email && errors.email && (
                <span id="login-email-error">
                  <FieldError message={errors.email} />
                </span>
              )}
            </AnimatePresence>
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password <span className="form-required">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              className={`form-input${touched.password && errors.password ? ' has-error' : ''}`}
              placeholder="Your password"
              value={form.password}
              onChange={set('password')}
              onBlur={() => handleBlur('password')}
              autoComplete="current-password"
              aria-invalid={touched.password && !!errors.password}
            />
            <AnimatePresence>
              {touched.password && errors.password && <FieldError message={errors.password} />}
            </AnimatePresence>
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
            id="login-submit-btn"
            type="submit"
            className="btn-submit"
            disabled={loading}
            aria-busy={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><span className="btn-spinner" aria-hidden="true" /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-switch">
          New to CampusFindr?{' '}
          <Link to="/signup" id="goto-signup-link">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
