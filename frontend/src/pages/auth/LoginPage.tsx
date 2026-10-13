import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ShieldCheck, AlertCircle,
  ArrowLeft, FileText, Lock, UserCog, Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../api/client';

type RoleTab = 'ADMIN' | 'REVIEWER' | 'CUSTOMER';

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
  demo: { username: string; password: string };
  description: string;
}

const ROLE_CONFIG: Record<RoleTab, RoleConfig> = {
  ADMIN: {
    label: 'Admin',
    icon: <UserCog size={15} aria-hidden="true" />,
    demo: { username: 'admin', password: 'Admin@Demo2024!' },
    description: 'Full system access — users, policies, claims, audit logs.',
  },
  REVIEWER: {
    label: 'Reviewer',
    icon: <ShieldCheck size={15} aria-hidden="true" />,
    demo: { username: 'reviewer', password: 'Reviewer@Demo2024!' },
    description: 'Upload policies, confirm terms, review claims.',
  },
  CUSTOMER: {
    label: 'Customer',
    icon: <Users size={15} aria-hidden="true" />,
    demo: { username: 'customer', password: 'Customer@Demo2024!' },
    description: 'Submit claim assessments, view your own claim history.',
  },
};

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const queryRole = (searchParams.get('role')?.toUpperCase() ?? '') as RoleTab;
  const initialRole: RoleTab = ['ADMIN', 'REVIEWER', 'CUSTOMER'].includes(queryRole)
    ? queryRole
    : 'CUSTOMER';

  const [activeRole, setActiveRole] = useState<RoleTab>(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleRoleSwitch = (role: RoleTab) => {
    setActiveRole(role);
    setError('');
    setUsernameError('');
    setPasswordError('');
  };

  const fillDemo = () => {
    const cfg = ROLE_CONFIG[activeRole];
    setUsername(cfg.demo.username);
    setPassword(cfg.demo.password);
    setError('');
    setUsernameError('');
    setPasswordError('');
  };

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    let valid = true;
    setUsernameError('');
    setPasswordError('');
    if (!username.trim()) { setUsernameError('Username is required'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = ROLE_CONFIG[activeRole];

  return (
    <div className="login-page">

      {/* ── LEFT PANEL (50%) ── */}
      <div className="login-left">
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,.35)', fontSize: '.875rem',
            marginBottom: 48, textDecoration: 'none',
          }}
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
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>
            WarrantyAssist
          </span>
        </div>

        <h2 style={{
          fontSize: '2.1rem', fontWeight: 800, color: 'white',
          letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: 14,
        }}>
          Preliminary warranty<br />eligibility checks
        </h2>
        <p style={{
          color: 'rgba(255,255,255,.4)', fontSize: '.9375rem',
          lineHeight: 1.75, maxWidth: 380, marginBottom: 44,
        }}>
          Upload warranty PDFs, confirm policy terms, and get instant
          rule-based eligibility assessments with full evidence traceability.
        </p>

        <div className="login-left-features">
          {[
            {
              icon: <ShieldCheck size={15} aria-hidden="true" />,
              title: 'Deterministic Rule Engine',
              desc: '8 transparent rules — no black-box AI decisions',
            },
            {
              icon: <FileText size={15} aria-hidden="true" />,
              title: 'PDF Policy Extraction',
              desc: 'Auto-detects duration, exclusions, and proof requirements',
            },
            {
              icon: <Lock size={15} aria-hidden="true" />,
              title: 'Role-Based Access',
              desc: 'Admin, Reviewer, and Customer roles enforced on every endpoint',
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

      {/* ── RIGHT PANEL (50%) ── */}
      <div className="login-right">
        <div className="login-card">
          {/* Mobile back link */}
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              color: 'rgba(255,255,255,.3)', fontSize: '.8125rem',
              marginBottom: 20, textDecoration: 'none',
            }}
          >
            <ArrowLeft size={13} aria-hidden="true" /> Home
          </Link>

          <div className="login-header">
            <div className="login-logo-wrap">
              <ShieldCheck size={26} color="#0d1526" aria-hidden="true" />
            </div>
            <h1>Sign In</h1>
            <p>Access the warranty eligibility portal</p>
          </div>

          {/* Role tabs */}
          <div className="role-tabs" role="tablist" aria-label="Select role">
            {(Object.keys(ROLE_CONFIG) as RoleTab[]).map((role) => (
              <button
                key={role}
                role="tab"
                aria-selected={activeRole === role}
                className={`role-tab ${activeRole === role ? 'active' : ''}`}
                onClick={() => handleRoleSwitch(role)}
                type="button"
              >
                <span className="role-tab-icon" aria-hidden="true">{ROLE_CONFIG[role].icon}</span>
                {ROLE_CONFIG[role].label}
              </button>
            ))}
          </div>

          {/* Role description */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              fontSize: '.8125rem',
              color: 'rgba(255,255,255,.45)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--amber-400)', flexShrink: 0 }}>{cfg.icon}</span>
            {cfg.description}
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
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="username"
                type="text"
                className={`form-input${usernameError ? ' error' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={submitting}
                aria-required="true"
                placeholder={`e.g. ${cfg.demo.username}`}
              />
              {usernameError && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {usernameError}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input${passwordError ? ' error' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  style={{ paddingRight: 40 }}
                  aria-required="true"
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,.3)', padding: 0, lineHeight: 0, cursor: 'pointer',
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={15} aria-hidden="true" />
                    : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>
              {passwordError && (
                <span className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden="true" /> {passwordError}
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
              }}
            >
              {submitting
                ? <><span className="spinner spinner-sm" aria-hidden="true" /> Signing in...</>
                : `Sign in as ${cfg.label}`}
            </button>
          </form>

          {/* Demo credentials */}{/*
          <div className="login-demo-box">
            <div style={{ marginBottom: 6 }}>
              <strong>Demo credentials for {cfg.label}:</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>
                <code>{cfg.demo.username}</code> / <code>{cfg.demo.password}</code>
              </span>
              <button
                type="button"
                onClick={fillDemo}
                style={{
                  background: 'rgba(251,191,36,.15)', color: 'var(--amber-300)',
                  border: '1px solid rgba(251,191,36,.25)',
                  borderRadius: 'var(--r-sm)', padding: '3px 10px',
                  fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Use this
              </button>
            </div>
          </div>*/}

          {/* Sign up link */}
          <div style={{
            marginTop: 16, textAlign: 'center',
            fontSize: '.875rem', color: 'rgba(255,255,255,.35)',
          }}>
            New customer?{' '}
            <Link to="/signup" style={{ color: 'var(--amber-400)', fontWeight: 600 }}>
              Create an account
            </Link>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 14, padding: '10px 12px',
              background: 'rgba(180,83,9,.08)',
              border: '1px solid rgba(180,83,9,.2)',
              borderRadius: 'var(--r-md)',
              fontSize: '.75rem', color: 'rgba(252,211,77,.6)',
              lineHeight: 1.5,
            }}
          >
            Preliminary checks only — not a guarantee of claim approval.
          </div>
        </div>
      </div>
    </div>
  );
}
