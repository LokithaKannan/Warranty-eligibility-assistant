import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  BookOpen,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getClaimByReference, reviewClaim } from '../../api/claims';
import { ClaimCheck, EligibilityAssessment, RuleResult, ISSUE_TYPE_LABELS, PRELIMINARY_RESULT_LABELS } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EvidenceCard } from '../../components/common/EvidenceCard';
import { ResultBadge, ReviewStatusBadge } from '../../components/common/StatusBadge';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatDateTime } from '../../utils/date';

function getResultVariant(result: string) {
  switch (result) {
    case 'MEETS_BASIC_CHECKS': return 'success';
    case 'OUTSIDE_PERIOD': return 'error';
    case 'POSSIBLE_EXCLUSION': return 'warning';
    case 'MISSING_INFO': return 'info';
    default: return 'neutral';
  }
}

function getRuleIcon(status: string) {
  switch (status) {
    case 'PASS': return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />;
    case 'FAIL': return <XCircle size={18} style={{ color: 'var(--color-error)' }} aria-hidden="true" />;
    default: return <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} aria-hidden="true" />;
  }
}

export function ClaimResultPage() {
  const { referenceCode } = useParams<{ referenceCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [claim, setClaim] = useState<ClaimCheck | null>(null);
  const [assessment, setAssessment] = useState<EligibilityAssessment | null>(
    (location.state as any)?.assessment ?? null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState('REVIEWED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewOutcome, setReviewOutcome] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const canReview = user?.role === 'ADMIN' || user?.role === 'REVIEWER';

  useEffect(() => {
    if (!referenceCode) return;
    getClaimByReference(referenceCode)
      .then((c) => {
        setClaim(c);
        // Parse ruleResults from stored JSON
        if (!assessment && c.ruleResults) {
          try {
            const parsed = JSON.parse(c.ruleResults);
            setAssessment({
              preliminaryResult: c.preliminaryResult,
              explanation: c.explanation,
              calculatedWarrantyEndDate: c.calculatedWarrantyEndDate,
              ruleResults: parsed,
              supportingEvidence: [],
              missingInformation: [],
              recommendedNextStep: '',
            });
          } catch { /* ignore */ }
        }
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [referenceCode]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (reviewAction === 'REQUESTED_MORE_INFO' && !reviewerNotes.trim()) {
      setReviewError('Reviewer notes are required when requesting more information');
      return;
    }
    if (!referenceCode) return;
    setReviewing(true);
    try {
      const result = await reviewClaim(referenceCode, {
        reviewAction,
        reviewerNotes: reviewerNotes.trim() || undefined,
        reviewOutcome: reviewOutcome || undefined,
      });
      setClaim((prev) => prev ? { ...prev, reviewStatus: result.claim.reviewStatus } : prev);
      setReviewSuccess(`Review recorded successfully: ${result.review.reviewAction.replace(/_/g, ' ')}`);
      setShowReviewForm(false);
      setReviewerNotes('');
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading claim..." />;
  if (!claim) return (
    <div className="page-body">
      <div className="alert alert-error" role="alert">{error || 'Claim not found'}</div>
    </div>
  );

  const ruleResults: RuleResult[] = assessment?.ruleResults ?? [];
  const variant = getResultVariant(claim.preliminaryResult);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/claims')} aria-label="Back to claims">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Claim Assessment</h1>
            <p className="page-subtitle">
              <code style={{ fontSize: '0.875rem' }}>{claim.referenceCode}</code>
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <ResultBadge result={claim.preliminaryResult} />
          <ReviewStatusBadge status={claim.reviewStatus} />
        </div>
      </div>

      <div className="page-body">
        {/* Disclaimer */}
        <div className="disclaimer-banner mb-6" role="note">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>
            This is a preliminary assessment only and does not guarantee claim approval. Final
            eligibility must be confirmed by the manufacturer or authorized service provider.
          </span>
        </div>

        {reviewSuccess && (
          <div className="alert alert-success mb-4" role="status">
            <CheckCircle size={16} aria-hidden="true" />
            <span>{reviewSuccess}</span>
          </div>
        )}

        {/* Result hero */}
        <div className={`result-hero ${variant} mb-6`} role="region" aria-label="Preliminary result">
          <div className="reference">Reference: {claim.referenceCode}</div>
          <h2>{PRELIMINARY_RESULT_LABELS[claim.preliminaryResult]}</h2>
          <p style={{ marginTop: 'var(--space-3)', opacity: 0.9 }}>{claim.explanation}</p>
          {assessment?.recommendedNextStep && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgb(0 0 0 / 0.05)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'flex-start',
              }}
            >
              <ChevronRight size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <span><strong>Next step:</strong> {assessment.recommendedNextStep}</span>
            </div>
          )}
        </div>

        <div className="grid-2 mb-6">
          {/* Claim details */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Claim Details</h2></div>
            <div className="card-body">
              {[
                ['Product', claim.productName],
                ['Category', claim.productCategory],
                ['Policy', claim.policy?.name ?? '—'],
                ['Purchase Date', formatDate(claim.purchaseDate)],
                ['Issue Date', formatDate(claim.issueDate)],
                ['Warranty End Date', claim.calculatedWarrantyEndDate ? formatDate(claim.calculatedWarrantyEndDate) : '—'],
                ['Issue Type', ISSUE_TYPE_LABELS[claim.issueType] ?? claim.issueType],
                ['Proof Available', claim.proofAvailable ? 'Yes' : 'No'],
                ['Submitted', formatDateTime(claim.createdAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    gap: 'var(--space-4)',
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issue description */}
          <div className="flex flex-col gap-6">
            <div className="card">
              <div className="card-header"><h2 className="card-title">Issue Description</h2></div>
              <div className="card-body">
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{claim.issueDescription}</p>
              </div>
            </div>

            {assessment?.missingInformation && assessment.missingInformation.length > 0 && (
              <div className="card" style={{ border: '1px solid var(--color-info-border)' }}>
                <div className="card-header" style={{ background: 'var(--color-info-bg)' }}>
                  <h2 className="card-title" style={{ color: 'var(--color-info)' }}>
                    <Info size={16} aria-hidden="true" style={{ marginRight: 'var(--space-2)' }} />
                    Missing Information
                  </h2>
                </div>
                <div className="card-body">
                  <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {assessment.missingInformation.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rule results */}
        {ruleResults.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Applied Rules</h2>
              <div className="flex gap-2">
                <span className="badge badge-success">{ruleResults.filter((r) => r.status === 'PASS').length} Passed</span>
                <span className="badge badge-error">{ruleResults.filter((r) => r.status === 'FAIL').length} Failed</span>
                <span className="badge badge-warning">{ruleResults.filter((r) => r.status === 'REVIEW').length} Review</span>
              </div>
            </div>
            <div>
              {ruleResults.map((rule) => (
                <div key={rule.ruleId} className="rule-row">
                  <div className="rule-icon">{getRuleIcon(rule.status)}</div>
                  <div className="flex-1">
                    <div className="rule-name">{rule.ruleName}</div>
                    <div className="rule-explanation">{rule.explanation}</div>
                    {rule.evidencePageNumber && (
                      <div
                        style={{
                          marginTop: 'var(--space-1)',
                          fontSize: '0.75rem',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <BookOpen size={12} aria-hidden="true" />
                        Source: page {rule.evidencePageNumber}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${rule.status === 'PASS' ? 'badge-success' : rule.status === 'FAIL' ? 'badge-error' : 'badge-warning'}`}>
                    {rule.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting evidence */}
        {assessment?.supportingEvidence && assessment.supportingEvidence.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Supporting Evidence</h2>
              <span className="text-xs text-muted">{claim.policy?.name}</span>
            </div>
            <div className="card-body flex flex-col gap-3">
              {assessment.supportingEvidence.map((ev, i) => (
                <EvidenceCard key={i} evidence={ev} />
              ))}
            </div>
          </div>
        )}

        {/* Reviewer actions */}
        {canReview && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Reviewer Actions</h2>
              <ReviewStatusBadge status={claim.reviewStatus} />
            </div>
            <div className="card-body">
              {claim.reviews && claim.reviews.length > 0 && (
                <div className="mb-4">
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Review History</h3>
                  <div className="flex flex-col gap-3">
                    {claim.reviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ fontWeight: 600 }}>{review.reviewer?.username}</span>
                          <span className="text-xs text-muted">{formatDateTime(review.createdAt)}</span>
                        </div>
                        <div className="text-muted" style={{ marginTop: 2 }}>
                          {review.reviewAction.replace(/_/g, ' ')}
                          {review.reviewOutcome && ` — ${review.reviewOutcome.replace(/_/g, ' ')}`}
                        </div>
                        {review.reviewerNotes && (
                          <div style={{ marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
                            "{review.reviewerNotes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showReviewForm ? (
                <button className="btn btn-primary" onClick={() => setShowReviewForm(true)}>
                  Add Review
                </button>
              ) : (
                <form onSubmit={handleReview} noValidate>
                  {reviewError && (
                    <div className="alert alert-error mb-4" role="alert">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span>{reviewError}</span>
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="reviewAction" className="form-label">
                      Review Action <span className="required" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="reviewAction"
                      className="form-select"
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value)}
                    >
                      <option value="REVIEWED">Mark as Reviewed</option>
                      <option value="REQUESTED_MORE_INFO">Request More Information</option>
                      <option value="ESCALATED">Escalate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reviewOutcome" className="form-label">Review Outcome</label>
                    <select
                      id="reviewOutcome"
                      className="form-select"
                      value={reviewOutcome}
                      onChange={(e) => setReviewOutcome(e.target.value)}
                    >
                      <option value="">— No outcome yet —</option>
                      <option value="APPROVED_FOR_SUBMISSION">Approved for Submission</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="PENDING_MORE_INFO">Pending More Information</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reviewerNotes" className="form-label">
                      Reviewer Notes
                      {reviewAction === 'REQUESTED_MORE_INFO' && (
                        <span className="required" aria-hidden="true"> *</span>
                      )}
                    </label>
                    <textarea
                      id="reviewerNotes"
                      className="form-textarea"
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Add notes about this review..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn btn-primary" disabled={reviewing}>
                      {reviewing ? <><span className="spinner spinner-sm" aria-hidden="true" /> Saving...</> : 'Submit Review'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/claims/new" className="btn btn-primary">New Claim Assessment</Link>
          <Link to="/claims" className="btn btn-secondary">View All Claims</Link>
        </div>
      </div>
    </>
  );
}
