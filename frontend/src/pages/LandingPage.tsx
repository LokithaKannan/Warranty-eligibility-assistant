import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  ClipboardList,
  Lock,
  Zap,
  BookOpen,
  ArrowRight,
  Users,
  Eye,
  UserCog,
  CheckCircle,
  Upload,
  Search,
  FileCheck,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="landing">

      {/* ── NAV ── */}
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="landing-nav-logo">
          <div className="landing-nav-logo-icon">
            <ShieldCheck size={17} color="#0d1526" aria-hidden="true" />
          </div>
          <span>WarrantyAssist</span>
        </div>
        <div className="landing-nav-links">
          <a href="#how-it-works" className="landing-nav-link">How it works</a>
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#roles" className="landing-nav-link">Roles</a>
        </div>
        <div className="landing-nav-actions">
          <Link to="/signup" className="btn-landing-secondary" style={{ padding: '8px 20px', fontSize: '.8125rem' }}>
            Sign Up
          </Link>
          <Link to="/login" className="btn-landing-primary" style={{ padding: '8px 20px', fontSize: '.8125rem' }}>
            Sign In <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, position: 'relative', zIndex: 1 }}>
          {/* Left: text */}
          <div className="landing-hero-inner" style={{ flex: '0 0 auto', maxWidth: 560 }}>
            <div className="landing-pill">
              <ShieldCheck size={12} aria-hidden="true" />
              Warranty Eligibility Portal
            </div>
            <h1 id="hero-heading">
              Know your warranty<br />
              status in <span>seconds</span>
            </h1>
            <p>
              Upload warranty PDFs, extract policy terms automatically, and get
              instant eligibility assessments backed by transparent,
              deterministic rules — every answer traced to the source.
            </p>
            <div className="landing-hero-btns">
              <Link to="/signup" className="btn-landing-primary">
                Create Free Account <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className="btn-landing-secondary">
                See How It Works
              </a>
            </div>
          </div>

          {/* Right: visual panel */}
          <div className="landing-hero-right-panel" style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }} aria-hidden="true">
            <div style={{
              width: '100%', maxWidth: 400,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '1.25rem',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}>
              {/* Claim result header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, background: 'var(--amber-400)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={15} color="#0d1526" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.8125rem', fontWeight: 700, color: 'white' }}>Claim Assessment</div>
                  <div style={{ fontSize: '.6875rem', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>WR-2026-00142</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,.2)', borderRadius: 99, fontSize: '.6875rem', fontWeight: 700, padding: '3px 10px', flexShrink: 0 }}>
                  ELIGIBLE
                </div>
              </div>

              {/* Product info */}
              <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '.6875rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>Product</div>
                  <div style={{ fontSize: '.8125rem', color: 'white', fontWeight: 500 }}>SoundWave X200 Headphones</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.6875rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>Purchased</div>
                  <div style={{ fontSize: '.8125rem', color: 'white', fontWeight: 500 }}>Jan 15, 2026</div>
                </div>
              </div>

              {/* Rule results */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '.6875rem', fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Rule Checks</div>
                {[
                  { label: 'Within warranty period', pass: true },
                  { label: 'Policy active & confirmed', pass: true },
                  { label: 'No exclusions matched', pass: true },
                  { label: 'Proof of purchase available', pass: true },
                  { label: 'Issue type covered', pass: true },
                ].map((r) => (
                  <div key={r.label} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(34,197,94,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <CheckCircle size={11} style={{ color: '#4ade80' }} />
                    </div>
                    <span style={{ fontSize: '.8125rem', color: 'rgba(255,255,255,.5)' }}>{r.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '.6875rem', fontWeight: 700, color: '#4ade80' }}>PASS</span>
                  </div>
                ))}
              </div>

              {/* Evidence snippet */}
              <div style={{
                background: 'rgba(37,99,235,.08)',
                border: '1px solid rgba(37,99,235,.18)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 14,
              }}>
                <div style={{ fontSize: '.6875rem', fontWeight: 700, color: 'rgba(147,179,255,.7)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>
                  Evidence — Policy Clause, p.1
                </div>
                <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "…warranty covers defects for a period of twelve (12) months from the date of original retail purchase…"
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.25)' }}>Warranty expires</span>
                <span style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--amber-400)' }}>Jan 15, 2027</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="landing-stats" role="list" aria-label="Platform statistics">
        {[
          { val: '8', label: 'Deterministic Rules' },
          { val: '5', label: 'Eligibility Outcomes' },
          { val: '3', label: 'User Roles' },
          { val: '100%', label: 'Evidence-Traced' },
        ].map((s) => (
          <div className="landing-stat" key={s.label} role="listitem">
            <div className="landing-stat-val">{s.val}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="landing-section" aria-labelledby="how-heading">
        <div className="landing-section-label">Process</div>
        <h2 id="how-heading">Three steps to an answer</h2>
        <p>
          No manual reading of warranty documents. The system does the
          heavy lifting — you get a clear, sourced result.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">Step 01</div>
            <div className="step-icon">
              <Upload size={20} aria-hidden="true" />
            </div>
            <h3>Upload the Policy PDF</h3>
            <p>
              A reviewer uploads the warranty document. The system reads it
              page by page and identifies duration, exclusions, and proof
              requirements automatically.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">Step 02</div>
            <div className="step-icon">
              <Search size={20} aria-hidden="true" />
            </div>
            <h3>Reviewer Confirms Terms</h3>
            <p>
              Auto-detected clauses are flagged as suggestions. A reviewer
              verifies and confirms them before they are used in any
              eligibility check.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">Step 03</div>
            <div className="step-icon">
              <FileCheck size={20} aria-hidden="true" />
            </div>
            <h3>Submit Your Claim</h3>
            <p>
              Enter your product, purchase date, and issue description.
              Eight rules run instantly and return a clear preliminary result
              with full evidence citations.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="landing-section" aria-labelledby="features-heading">
        <div className="landing-section-label">Capabilities</div>
        <h2 id="features-heading">Everything you need</h2>
        <p>
          Built with transparency and traceability at its core — every
          decision is explained and traceable to a source clause.
        </p>
        <div className="features-grid">
          {[
            {
              icon: <FileText size={20} aria-hidden="true" />,
              title: 'PDF Extraction',
              desc: 'Upload any text-based warranty PDF. The system extracts text page by page and auto-detects duration, exclusions, and proof requirements.',
            },
            {
              icon: <Zap size={20} aria-hidden="true" />,
              title: 'Instant Assessment',
              desc: 'Eight deterministic rules evaluate your claim in real time. You get a preliminary result with a rule-by-rule breakdown the moment you submit.',
            },
            {
              icon: <BookOpen size={20} aria-hidden="true" />,
              title: 'Evidence Traceability',
              desc: 'Every rule result links to the exact policy clause and page number. No black-box answers — each decision is grounded in source text.',
            },
            {
              icon: <Lock size={20} aria-hidden="true" />,
              title: 'Secure by Design',
              desc: 'JWT authentication, bcrypt password hashing, and strict role-based access control. Customers only see their own data.',
            },
            {
              icon: <ClipboardList size={20} aria-hidden="true" />,
              title: 'Full Audit Trail',
              desc: 'Every upload, assessment, review, and login attempt is recorded in an immutable audit log accessible only to administrators.',
            },
            {
              icon: <ShieldCheck size={20} aria-hidden="true" />,
              title: 'Reviewer Confirmation',
              desc: 'Auto-extracted clauses require human sign-off before use. Reviewers can add notes and confirm or correct any term.',
            },
          ].map((f) => (
            <div className="feature-item" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="landing-section" aria-labelledby="roles-heading">
        <div className="landing-section-label">Access</div>
        <h2 id="roles-heading">Three roles, one platform</h2>
        <p>
          Sign in with the role that matches your use case — each sees a
          tailored interface with only the tools they need.
        </p>
        <div className="roles-grid">

          {/* Admin */}
          <Link to="/login?role=ADMIN" className="role-card" aria-label="Sign in as Administrator">
            <div
              className="role-card-icon"
              style={{ background: 'rgba(124,58,237,.15)', color: '#a78bfa' }}
              aria-hidden="true"
            >
              <UserCog size={22} />
            </div>
            <h3>Administrator</h3>
            <p>
              Manage users, oversee all system activity, review audit logs,
              and configure policies across the platform.
            </p>
            <div style={{ marginBottom: 16 }}>
              {['User management', 'Audit logs', 'Full policy access'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: '.8125rem', color: 'rgba(255,255,255,.35)',
                    marginBottom: 5,
                  }}
                >
                  <CheckCircle size={12} style={{ color: '#a78bfa', flexShrink: 0 }} aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <div className="role-card-link">
              Sign in as Admin <ArrowRight size={13} aria-hidden="true" />
            </div>
          </Link>

          {/* Reviewer */}
          <Link to="/login?role=REVIEWER" className="role-card" aria-label="Sign in as Reviewer">
            <div
              className="role-card-icon"
              style={{ background: 'rgba(37,99,235,.15)', color: 'var(--navy-300)' }}
              aria-hidden="true"
            >
              <Eye size={22} />
            </div>
            <h3>Reviewer</h3>
            <p>
              Upload and confirm warranty policy documents, review submitted
              claims, and request additional information when needed.
            </p>
            <div style={{ marginBottom: 16 }}>
              {['Policy upload', 'Clause confirmation', 'Claim review'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: '.8125rem', color: 'rgba(255,255,255,.35)',
                    marginBottom: 5,
                  }}
                >
                  <CheckCircle size={12} style={{ color: 'var(--navy-300)', flexShrink: 0 }} aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <div className="role-card-link">
              Sign in as Reviewer <ArrowRight size={13} aria-hidden="true" />
            </div>
          </Link>

          {/* Customer */}
          <Link to="/login?role=CUSTOMER" className="role-card" aria-label="Sign in as Customer">
            <div
              className="role-card-icon"
              style={{ background: 'rgba(251,191,36,.1)', color: 'var(--amber-400)' }}
              aria-hidden="true"
            >
              <Users size={22} />
            </div>
            <h3>Customer</h3>
            <p>
              Submit warranty claim assessments, browse active policies, and
              track the full history of your own claims in one place.
            </p>
            <div style={{ marginBottom: 16 }}>
              {['New claim checks', 'Claim history', 'Policy browsing'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: '.8125rem', color: 'rgba(255,255,255,.35)',
                    marginBottom: 5,
                  }}
                >
                  <CheckCircle size={12} style={{ color: 'var(--amber-400)', flexShrink: 0 }} aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <div className="role-card-link">
              Sign in as Customer <ArrowRight size={13} aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="landing-cta">
        <div>
          <h2>Ready to check your warranty?</h2>
          <p>
            Get a preliminary eligibility result in under a minute — no
            manual document reading required.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <Link to="/signup" className="btn-landing-primary">
            Get Started <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/login" className="btn-landing-outline">
            Sign In
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-logo">
          <div
            style={{
              width: 26, height: 26, background: 'var(--amber-400)',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <ShieldCheck size={14} color="#0d1526" />
          </div>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.875rem', fontWeight: 600 }}>
            WarrantyAssist
          </span>
        </div>
        <p>
          WarrantyAssist — All data is fictional and for demonstration purposes only.
          This application does not provide legal or warranty advice.
        </p>
      </footer>

    </div>
  );
}
