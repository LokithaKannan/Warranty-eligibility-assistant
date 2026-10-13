import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Plus,
  Save,
} from 'lucide-react';
import { getPolicyById, confirmPolicy, getPolicyExtractedText } from '../../api/policies';
import { Policy, PolicyClause, CLAUSE_TYPE_LABELS } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ActiveBadge,
  ConfirmedBadge,
  ExtractionBadge,
} from '../../components/common/StatusBadge';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

interface EditableClause {
  id?: string;
  clauseType: string;
  clauseText: string;
  pageNumber?: number;
  confirmedByReviewer: boolean;
}

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  // Confirm form state
  const [durationMonths, setDurationMonths] = useState('');
  const [proofRequired, setProofRequired] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [clauses, setClauses] = useState<EditableClause[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Extracted text
  const [showExtracted, setShowExtracted] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'REVIEWER';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPolicyById(id)
      .then((p) => {
        setPolicy(p);
        setDurationMonths(p.durationMonths?.toString() ?? '');
        setProofRequired(p.proofRequired);
        setReviewerNotes(p.reviewerNotes ?? '');
        setClauses(
          (p.clauses ?? []).map((c) => ({
            id: c.id,
            clauseType: c.clauseType,
            clauseText: c.clauseText,
            pageNumber: c.pageNumber,
            confirmedByReviewer: c.confirmedByReviewer,
          }))
        );
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError('');
    const dur = parseInt(durationMonths, 10);
    if (!durationMonths || isNaN(dur) || dur < 1) {
      setConfirmError('Please enter a valid warranty duration in months (minimum 1)');
      return;
    }
    if (!id) return;
    setConfirming(true);
    try {
      const updated = await confirmPolicy(id, {
        durationMonths: dur,
        proofRequired,
        reviewerNotes: reviewerNotes || undefined,
        clauses: clauses.map((c) => ({
          clauseType: c.clauseType,
          clauseText: c.clauseText,
          pageNumber: c.pageNumber,
          confirmedByReviewer: true,
        })),
      });
      setPolicy(updated);
      setConfirmSuccess(true);
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const loadExtractedText = async () => {
    if (!id) return;
    setLoadingText(true);
    try {
      const data = await getPolicyExtractedText(id);
      setExtractedText(data.extractedText ?? '(No text extracted)');
      setShowExtracted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingText(false);
    }
  };

  const addClause = () => {
    setClauses((prev) => [
      ...prev,
      { clauseType: 'GENERAL_TERMS', clauseText: '', confirmedByReviewer: true },
    ]);
  };

  const removeClause = (index: number) => {
    setClauses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateClause = (index: number, field: keyof EditableClause, value: string | number | boolean) => {
    setClauses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  if (loading) return <LoadingSpinner message="Loading policy..." />;
  if (!policy) return (
    <div className="page-body">
      <div className="alert alert-error" role="alert">{error || 'Policy not found'}</div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/policies')} aria-label="Back to policies">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{policy.name}</h1>
            <p className="page-subtitle">{policy.productCategory} · {policy.manufacturerLabel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExtractionBadge status={policy.extractionStatus} />
          <ConfirmedBadge confirmed={policy.isConfirmed} />
          <ActiveBadge active={policy.isActive} />
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}
        {confirmSuccess && (
          <div className="alert alert-success mb-4" role="status">
            <CheckCircle size={16} aria-hidden="true" />
            <span>Policy confirmed successfully. It can now be used in eligibility checks.</span>
          </div>
        )}

        {/* Policy metadata */}
        <div className="grid-2 mb-6">
          <div className="card">
            <div className="card-header"><h2 className="card-title">Policy Details</h2></div>
            <div className="card-body">
              {[
                ['Policy Name', policy.name],
                ['Product Category', policy.productCategory],
                ['Manufacturer', policy.manufacturerLabel],
                ['Warranty Duration', policy.durationMonths ? `${policy.durationMonths} months` : 'Not confirmed'],
                ['Proof of Purchase', policy.proofRequired ? 'Required' : 'Not required'],
                ['Original File', policy.originalFilename],
                ['Created', formatDate(policy.createdAt)],
                ['Created By', policy.createdBy?.username ?? '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Claims made against this policy */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Claims Activity</h2></div>
            <div className="card-body">
              <div className="stat-card" style={{ border: 'none', padding: 0 }}>
                <div className="stat-label">Total Claim Checks</div>
                <div className="stat-value">{policy._count?.claimChecks ?? 0}</div>
              </div>
              {policy.reviewerNotes && (
                <div className="mt-4">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Reviewer Notes
                  </div>
                  <div style={{ fontSize: '0.875rem', background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    {policy.reviewerNotes}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <Link to={`/claims/new?policyId=${policy.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  <FileText size={15} aria-hidden="true" /> Create Claim Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted text */}
        {canEdit && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Extracted PDF Text</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadExtractedText}
                disabled={loadingText}
              >
                {loadingText ? <span className="spinner spinner-sm" aria-hidden="true" /> : <Info size={14} aria-hidden="true" />}
                {showExtracted ? 'Refresh' : 'View Extracted Text'}
              </button>
            </div>
            {showExtracted && (
              <div className="card-body">
                <pre style={{
                  background: 'var(--color-bg)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8125rem',
                  overflow: 'auto',
                  maxHeight: 300,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: '1px solid var(--color-border)',
                }}>
                  {extractedText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Confirm / edit form */}
        {canEdit && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">
                {policy.isConfirmed ? 'Update Policy Configuration' : 'Confirm Policy Details'}
              </h2>
              {!policy.isConfirmed && (
                <span className="badge badge-warning">Action required before use</span>
              )}
            </div>
            <div className="card-body">
              {!policy.isConfirmed && (
                <div className="alert alert-info mb-4" role="note">
                  <Info size={14} aria-hidden="true" />
                  <span>
                    Review the automatically detected clauses below. Confirm or correct the warranty
                    duration and exclusions before this policy can be used in eligibility checks.
                    Automatically detected values are suggestions only.
                  </span>
                </div>
              )}

              {confirmError && (
                <div className="alert alert-error mb-4" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{confirmError}</span>
                </div>
              )}

              <form onSubmit={handleConfirm} noValidate>
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="durationMonths" className="form-label">
                      Warranty Duration (months) <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="durationMonths"
                      type="number"
                      className="form-input"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      min={1}
                      max={600}
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proof of Purchase Required</label>
                    <div className="form-checkbox-group" style={{ marginTop: 'var(--space-2)' }}>
                      <input
                        type="checkbox"
                        id="proofRequired"
                        className="form-checkbox"
                        checked={proofRequired}
                        onChange={(e) => setProofRequired(e.target.checked)}
                      />
                      <label htmlFor="proofRequired" style={{ fontSize: '0.875rem' }}>
                        Proof of purchase is required for this policy
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reviewerNotes" className="form-label">Reviewer Notes</label>
                  <textarea
                    id="reviewerNotes"
                    className="form-textarea"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Notes about this policy for other reviewers..."
                  />
                </div>

                {/* Clauses */}
                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Policy Clauses</h3>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addClause}>
                      <Plus size={14} aria-hidden="true" /> Add Clause
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {clauses.map((clause, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                        <div className="grid-2" style={{ marginBottom: 'var(--space-3)' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Clause Type</label>
                            <select
                              className="form-select"
                              value={clause.clauseType}
                              onChange={(e) => updateClause(i, 'clauseType', e.target.value)}
                            >
                              {Object.entries(CLAUSE_TYPE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Page Number</label>
                            <input
                              type="number"
                              className="form-input"
                              value={clause.pageNumber ?? ''}
                              onChange={(e) => updateClause(i, 'pageNumber', parseInt(e.target.value) || 0)}
                              min={1}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                          <label className="form-label">Clause Text</label>
                          <textarea
                            className="form-textarea"
                            value={clause.clauseText}
                            onChange={(e) => updateClause(i, 'clauseText', e.target.value)}
                            placeholder="Enter the exact clause text from the document..."
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => removeClause(i)}
                        >
                          Remove clause
                        </button>
                      </div>
                    ))}
                    {clauses.length === 0 && (
                      <div
                        style={{
                          padding: 'var(--space-6)',
                          textAlign: 'center',
                          color: 'var(--color-text-muted)',
                          border: '1px dashed var(--color-border)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem',
                        }}
                      >
                        No clauses configured. Click "Add Clause" to add warranty clauses.
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={confirming}>
                  {confirming ? (
                    <><span className="spinner spinner-sm" aria-hidden="true" /> Saving...</>
                  ) : (
                    <><Save size={15} aria-hidden="true" /> {policy.isConfirmed ? 'Update Policy' : 'Confirm Policy'}</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Read-only clauses for customers */}
        {!canEdit && policy.clauses && policy.clauses.length > 0 && (
          <div className="card">
            <div className="card-header"><h2 className="card-title">Policy Clauses</h2></div>
            <div className="card-body flex flex-col gap-3">
              {policy.clauses.map((clause) => (
                <div key={clause.id} className="evidence-card">
                  <div className="evidence-card-header">
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      {CLAUSE_TYPE_LABELS[clause.clauseType as keyof typeof CLAUSE_TYPE_LABELS] ?? clause.clauseType}
                    </span>
                    {clause.pageNumber && (
                      <span className="text-xs text-muted">Page {clause.pageNumber}</span>
                    )}
                  </div>
                  <div className="evidence-card-body">{clause.clauseText}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
