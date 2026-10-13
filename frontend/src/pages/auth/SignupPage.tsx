import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../api/client';
import { register as apiRegister } from '../../api/auth';

export function SignupPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) errors.username = 'Only letters, numbers, dots, dashes, underscores';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await apiRegister(username.trim(), email.trim(), password);
      // Store token and user, then navigate — reuse auth context
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      // Trigger auth state update via login (re-uses stored token)
      await login(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][passwordStrength];

  return (
    <div className="login-page">

      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.35)', fontSize: '.875rem', marginBottom: 48, textDecoration: 'none' }}
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--amber-400)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color="#0d1526" aria-hidden="true" />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>WarrantyAssist</span>
        </div>

        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'white', letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: 14 }}>
          Start checking<br />your warranty
        </h2>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.9375rem', lineHeight: 1.75, maxWidth: 380, marginBottom: 44 }}>
          Create a free customer account to submit warranty claim assessments
          and track your claim history.
        </p>

        <div className="login-left-features">
          {[
            {
              icon: <CheckCircle size={15} aria-hidden="true" />,
              title: 'Instant eligibility results',
              desc: 'Get a preliminary result in seconds, backed by 8 deterministic rules.',
            },
            {
              icon: <Lock size={15} aria-hidden="true" />,
              title: 'Secure account',
              desc: 'Your data is protected with JWT auth and bcrypt password hashing.',
            },
            {
              icon: <ShieldCheck size={15} aria-hidden="true" />,
              title: 'Full claim history',
              desc: 'All your claim checks are saved and accessible at any time.',
            },
          ].map((f) => (
            <div className="login-feature" key={f.title}>
              <div className="login-feature-icon">{f.icon}</div>
              <div className="login-feature-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="login-card">
          {/* Mobile back link */}
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.3)', fontSize: '.8125rem', marginBottom: 20, textDecoration: 'none' }}
          >
            <ArrowLeft size={13} aria-hidden="true" /> Home
          </Link>

          <div className="login-header">
            <div className="login-logo-wrap">
              <ShieldCheck size={26} color="#0d1526" aria-hidden="true" />
            </div>
            <h1>Create Account</h1>
            <p>Register as a Customer to get started</p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)',
                borderRadius: 'var(--r-md)', padding: '10px 12px',
                color: '#f87171', fontSize: '.875rem',
                display: 'flex', gap: 8, alignItems: 'center',
                marginBottom: 16,
              }}
              role="alert"
            >
              <AlertCircle size={15} aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  className={`form-input${fieldErrors.username ? ' error' : ''}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={submitting}
                  aria-required="true"
                  placeholder="e.g. johndoe"
                  style={{ paddingLeft: 34 }}
                />
              </div>
              {fieldErrors.username && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {fieldErrors.username}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  className={`form-input${fieldErrors.email ? ' error' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                  aria-required="true"
                  placeholder="you@example.com"
                  style={{ paddingLeft: 34 }}
                />
              </div>
              {fieldErrors.email && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input${fieldErrors.password ? ' error' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                  aria-required="true"
                  placeholder="Min. 8 characters"
                  style={{ paddingLeft: 34, paddingRight: 40 }}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', padding: 0, lineHeight: 0, cursor: 'pointer',
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: i <= passwordStrength ? strengthColor : 'rgba(255,255,255,.1)',
                          transition: 'background 200ms ease',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '.75rem', color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
              {fieldErrors.password && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input${fieldErrors.confirmPassword ? ' error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                  aria-required="true"
                  placeholder="Re-enter your password"
                  style={{ paddingLeft: 34, paddingRight: 40 }}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', padding: 0, lineHeight: 0, cursor: 'pointer',
                  }}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '11px 16px',
                background: 'var(--amber-500)', color: '#0d1526',
                border: '1px solid var(--amber-400)',
                borderRadius: 'var(--r-md)',
                fontWeight: 700, fontSize: '.9375rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 140ms ease',
                opacity: submitting ? .7 : 1,
                letterSpacing: '-.01em',
                marginBottom: 16,
              }}
            >
              {submitting
                ? <><span className="spinner spinner-sm" aria-hidden="true" /> Creating account...</>
                : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '.875rem', color: 'rgba(255,255,255,.35)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--amber-400)', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>

          <div
            style={{
              marginTop: 16, padding: '10px 12px',
              background: 'rgba(180,83,9,.08)',
              border: '1px solid rgba(180,83,9,.2)',
              borderRadius: 'var(--r-md)',
              fontSize: '.75rem', color: 'rgba(252,211,77,.6)',
              lineHeight: 1.5,
            }}
          >
            New accounts are created as <strong style={{ color: 'rgba(252,211,77,.8)' }}>Customer</strong> role. Contact an admin to request Reviewer access.
          </div>
        </div>
      </div>
    </div>
  );
}
