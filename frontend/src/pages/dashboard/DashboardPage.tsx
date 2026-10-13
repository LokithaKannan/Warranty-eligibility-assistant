import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getDashboardStats } from '../../api/admin';
import { DashboardStats } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ResultBadge, ReviewStatusBadge } from '../../components/common/StatusBadge';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.username}</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'ADMIN' || user?.role === 'REVIEWER') && (
            <Link to="/policies/upload" className="btn btn-secondary">
              <Upload size={15} aria-hidden="true" /> Upload Policy
            </Link>
          )}
          <Link to="/claims/new" className="btn btn-primary">
            <Plus size={15} aria-hidden="true" /> New Claim Check
          </Link>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div
          className="disclaimer-banner mb-6"
          role="note"
          aria-label="Important disclaimer"
        >
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>
            <strong>Important:</strong> This application provides preliminary warranty eligibility
            checks for informational purposes only. Results do not guarantee claim approval. Final
            eligibility must be confirmed by the manufacturer or authorized service provider.
          </span>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid-4 mb-6">
            <StatCard
              icon={<Shield size={20} aria-hidden="true" />}
              iconBg="rgba(251,191,36,.12)"
              iconColor="var(--amber-400)"
              label="Total Policies"
              value={stats.totalPolicies}
            />
            <StatCard
              icon={<FileText size={20} aria-hidden="true" />}
              iconBg="rgba(34,197,94,.12)"
              iconColor="#4ade80"
              label="Total Claims"
              value={stats.totalClaims}
            />
            <StatCard
              icon={<Clock size={20} aria-hidden="true" />}
              iconBg="rgba(251,191,36,.12)"
              iconColor="var(--amber-400)"
              label="Awaiting Review"
              value={stats.pendingClaims}
            />
            <StatCard
              icon={<AlertCircle size={20} aria-hidden="true" />}
              iconBg="rgba(99,179,237,.12)"
              iconColor="#63b3ed"
              label="Needs More Info"
              value={stats.needsInfoClaims}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid-2 mb-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-col gap-3">
                <Link
                  to="/claims/new"
                  className="btn btn-primary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <FileText size={16} aria-hidden="true" />
                  Submit New Claim Assessment
                </Link>
                {(user?.role === 'ADMIN' || user?.role === 'REVIEWER') && (
                  <Link
                    to="/policies/upload"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Upload size={16} aria-hidden="true" />
                    Upload Warranty Policy
                  </Link>
                )}
                <Link
                  to="/policies"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Shield size={16} aria-hidden="true" />
                  Browse Warranty Policies
                </Link>
              </div>
            </div>
          </div>

          {/* How it works card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">How It Works</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-col gap-3">
                {[
                  { num: 1, title: 'Upload a Warranty Policy', desc: 'Reviewers upload PDF documents — terms are extracted automatically.' },
                  { num: 2, title: 'Confirm Policy Terms', desc: 'A reviewer verifies the extracted clauses before they go live.' },
                  { num: 3, title: 'Submit a Claim Check', desc: 'Customers enter product and issue details to get an instant result.' },
                  { num: 4, title: 'Review the Assessment', desc: 'Results are rule-based, traceable to exact policy clauses.' },
                ].map((m) => (
                  <div key={m.num} className="flex gap-3 items-center">
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--r-full)',
                        background: 'rgba(251,191,36,.15)',
                        color: 'var(--amber-400)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                      }}
                    >
                      {m.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{m.title}</div>
                      <div className="text-xs text-muted">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent claims */}
        {stats && stats.recentClaims.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Claim Assessments</h2>
              <Link to="/claims" className="btn btn-ghost btn-sm">
                View all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Product</th>
                    <th>Policy</th>
                    <th>Result</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <code style={{ fontSize: '0.8125rem' }}>{claim.referenceCode}</code>
                      </td>
                      <td>{claim.productName}</td>
                      <td className="text-muted">{claim.policy?.name ?? '—'}</td>
                      <td><ResultBadge result={claim.preliminaryResult} /></td>
                      <td><ReviewStatusBadge status={claim.reviewStatus} /></td>
                      <td className="text-muted">{formatDate(claim.createdAt)}</td>
                      <td>
                        <Link
                          to={`/claims/${claim.referenceCode}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value.toLocaleString()}</div>
    </div>
  );
}
