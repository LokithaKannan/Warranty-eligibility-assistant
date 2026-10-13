import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { getPolicies } from '../../api/policies';
import { checkClaim } from '../../api/claims';
import { Policy, ISSUE_TYPE_LABELS } from '../../types';
import { getErrorMessage } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const ISSUE_TYPES = Object.entries(ISSUE_TYPE_LABELS);

export function NewClaimPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPolicyId = searchParams.get('policyId') ?? '';

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  const [policyId, setPolicyId] = useState(preselectedPolicyId);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [issueType, setIssueType] = useState('MANUFACTURING_DEFECT');
  const [issueDescription, setIssueDescription] = useState('');
  const [proofAvailable, setProofAvailable] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getPolicies({ pageSize: 100, isActive: true, isConfirmed: true })
      .then((data) => {
        setPolicies(data.data);
        if (preselectedPolicyId && data.data.find((p) => p.id === preselectedPolicyId)) {
          const pol = data.data.find((p) => p.id === preselectedPolicyId)!;
          setProductCategory(pol.productCategory);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPolicies(false));
  }, [preselectedPolicyId]);

  const handlePolicyChange = (id: string) => {
    setPolicyId(id);
    const pol = policies.find((p) => p.id === id);
    if (pol) setProductCategory(pol.productCategory);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!policyId) errors.policyId = 'Please select a warranty policy';
    if (!productName.trim()) errors.productName = 'Product name is required';
    if (!purchaseDate) errors.purchaseDate = 'Purchase date is required';
    if (!issueDate) errors.issueDate = 'Issue date is required';
    if (!issueDescription.trim() || issueDescription.trim().length < 10)
      errors.issueDescription = 'Please provide at least 10 characters describing the issue';

    if (purchaseDate && new Date(purchaseDate) > new Date(today)) {
      errors.purchaseDate = 'Purchase date cannot be in the future';
    }
    if (purchaseDate && issueDate && new Date(issueDate) < new Date(purchaseDate)) {
      errors.issueDate = 'Issue date cannot be before the purchase date';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await checkClaim({
        policyId,
        productName: productName.trim(),
        productCategory: productCategory.trim(),
        purchaseDate,
        issueDate,
        issueType,
        issueDescription: issueDescription.trim(),
        proofAvailable,
      });
      navigate(`/claims/${result.claim.referenceCode}`, { state: { assessment: result.assessment } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPolicies) return <LoadingSpinner message="Loading policies..." />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Claim Assessment</h1>
          <p className="page-subtitle">Submit product details for a preliminary warranty eligibility check</p>
        </div>
      </div>

      <div className="page-body">
        <div
          className="disclaimer-banner mb-6"
          role="note"
          aria-label="Disclaimer"
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>
            This application provides a preliminary warranty eligibility check for informational
            purposes only. It does not guarantee claim approval. Final eligibility must be confirmed
            by the manufacturer or authorized service provider.
          </span>
        </div>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-header">
            <h2 className="card-title">Claim Details</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Policy selection */}
              <div className="form-group">
                <label htmlFor="policyId" className="form-label">
                  Warranty Policy <span className="required" aria-hidden="true">*</span>
                </label>
                {policies.length === 0 ? (
                  <div className="alert alert-warning">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>No confirmed policies available. An administrator must confirm a policy before claims can be submitted.</span>
                  </div>
                ) : (
                  <select
                    id="policyId"
                    className={`form-select ${fieldErrors.policyId ? 'error' : ''}`}
                    value={policyId}
                    onChange={(e) => handlePolicyChange(e.target.value)}
                    aria-required="true"
                  >
                    <option value="">Select a warranty policy...</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.productCategory} ({p.durationMonths} months)
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.policyId && <span className="form-error"><AlertCircle size={12} />{fieldErrors.policyId}</span>}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="productName" className="form-label">
                    Product Name <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="productName"
                    type="text"
                    className={`form-input ${fieldErrors.productName ? 'error' : ''}`}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., SoundWave X200 Headphones"
                  />
                  {fieldErrors.productName && <span className="form-error"><AlertCircle size={12} />{fieldErrors.productName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="productCategory" className="form-label">
                    Product Category
                  </label>
                  <input
                    id="productCategory"
                    type="text"
                    className="form-input"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="e.g., Wireless Headphones"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="purchaseDate" className="form-label">
                    Purchase Date <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="purchaseDate"
                    type="date"
                    className={`form-input ${fieldErrors.purchaseDate ? 'error' : ''}`}
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    max={today}
                    aria-required="true"
                  />
                  {fieldErrors.purchaseDate && <span className="form-error"><AlertCircle size={12} />{fieldErrors.purchaseDate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="issueDate" className="form-label">
                    Issue Date <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="issueDate"
                    type="date"
                    className={`form-input ${fieldErrors.issueDate ? 'error' : ''}`}
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    max={today}
                    min={purchaseDate || undefined}
                    aria-required="true"
                  />
                  {fieldErrors.issueDate && <span className="form-error"><AlertCircle size={12} />{fieldErrors.issueDate}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="issueType" className="form-label">
                  Issue Type <span className="required" aria-hidden="true">*</span>
                </label>
                <select
                  id="issueType"
                  className="form-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  {ISSUE_TYPES.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="issueDescription" className="form-label">
                  Issue Description <span className="required" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="issueDescription"
                  className={`form-textarea ${fieldErrors.issueDescription ? 'error' : ''}`}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue in detail (minimum 10 characters)..."
                  rows={4}
                  aria-required="true"
                />
                {fieldErrors.issueDescription && (
                  <span className="form-error"><AlertCircle size={12} />{fieldErrors.issueDescription}</span>
                )}
                <span className="form-hint">{issueDescription.length} characters</span>
              </div>

              <div className="form-group">
                <label className="form-label">Proof of Purchase</label>
                <div className="form-checkbox-group">
                  <input
                    type="checkbox"
                    id="proofAvailable"
                    className="form-checkbox"
                    checked={proofAvailable}
                    onChange={(e) => setProofAvailable(e.target.checked)}
                  />
                  <label htmlFor="proofAvailable" style={{ fontSize: '0.875rem' }}>
                    I have a proof of purchase (receipt, invoice, or original bill)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary" disabled={submitting || policies.length === 0}>
                  {submitting ? (
                    <><span className="spinner spinner-sm" aria-hidden="true" /> Processing...</>
                  ) : (
                    <><FileText size={15} aria-hidden="true" /> Check Eligibility</>
                  )}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/claims')} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
