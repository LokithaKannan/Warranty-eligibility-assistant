import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { uploadPolicy } from '../../api/policies';
import { getErrorMessage } from '../../api/client';

interface ExtractedClause {
  clauseType: string;
  clauseText: string;
  pageNumber?: number;
  confidence: string;
  suggestedValue?: string;
}

export function UploadPolicyPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [manufacturerLabel, setManufacturerLabel] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    policyId: string;
    status: string;
    totalPages: number;
    message?: string;
    detectedClauses: ExtractedClause[];
    rawSuggestions: Record<string, string>;
  } | null>(null);

  const CLAUSE_TYPE_LABELS: Record<string, string> = {
    WARRANTY_DURATION: 'Warranty Duration',
    EXCLUSION: 'Exclusion',
    PROOF_REQUIREMENT: 'Proof of Purchase',
    CLAIM_PROCEDURE: 'Claim Procedure',
    GENERAL_TERMS: 'General Terms',
    OTHER: 'Other',
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Policy name is required';
    if (!productCategory.trim()) errors.productCategory = 'Product category is required';
    if (!manufacturerLabel.trim()) errors.manufacturerLabel = 'Manufacturer label is required';
    if (!file) errors.file = 'Please select a PDF file to upload';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setFieldErrors((e) => ({ ...e, file: 'Only PDF files are accepted' }));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFieldErrors((e) => ({ ...e, file: 'File exceeds 10 MB limit' }));
      return;
    }
    setFile(selectedFile);
    setFieldErrors((e) => { const n = { ...e }; delete n.file; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    const formData = new FormData();
    formData.append('pdf', file!);
    formData.append('name', name.trim());
    formData.append('productCategory', productCategory.trim());
    formData.append('manufacturerLabel', manufacturerLabel.trim());
    if (reviewerNotes.trim()) formData.append('reviewerNotes', reviewerNotes.trim());

    setUploading(true);
    try {
      const res = await uploadPolicy(formData);
      setResult({
        policyId: res.policy.id,
        status: res.extraction.status,
        totalPages: res.extraction.totalPages,
        message: res.extraction.message,
        detectedClauses: res.extraction.detectedClauses,
        rawSuggestions: res.extraction.rawSuggestions,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Upload Policy</h1>
            <p className="page-subtitle">PDF processed — review extraction results</p>
          </div>
        </div>
        <div className="page-body">
          <div
            className={`alert ${result.status === 'EXTRACTED' ? 'alert-success' : result.status === 'NEEDS_OCR' ? 'alert-warning' : 'alert-error'} mb-6`}
            role="status"
          >
            {result.status === 'EXTRACTED' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <div>
              <strong>
                {result.status === 'EXTRACTED'
                  ? `Extraction successful — ${result.totalPages} page(s) processed`
                  : result.status === 'NEEDS_OCR'
                  ? 'Scanned PDF detected — OCR required'
                  : 'Extraction failed'}
              </strong>
              {result.message && <div style={{ marginTop: 4 }}>{result.message}</div>}
            </div>
          </div>

          {result.detectedClauses.length > 0 && (
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="card-title">Detected Clauses (Suggestions Only)</h2>
                <span className="badge badge-warning">Requires reviewer confirmation</span>
              </div>
              <div className="card-body">
                <div
                  className="alert alert-info mb-4"
                  role="note"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <Info size={14} />
                  <span>
                    These clauses were automatically detected. A reviewer must confirm or correct
                    them before they are used in eligibility checks.
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {result.detectedClauses.map((clause, i) => (
                    <div key={i} className="evidence-card">
                      <div className="evidence-card-header">
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          {CLAUSE_TYPE_LABELS[clause.clauseType] ?? clause.clauseType}
                        </span>
                        <div className="flex gap-2">
                          {clause.pageNumber && (
                            <span className="text-xs text-muted">Page {clause.pageNumber}</span>
                          )}
                          <span
                            className={`badge ${clause.confidence === 'HIGH' ? 'badge-success' : clause.confidence === 'MEDIUM' ? 'badge-warning' : 'badge-neutral'}`}
                          >
                            {clause.confidence} confidence
                          </span>
                        </div>
                      </div>
                      <div className="evidence-card-body">{clause.clauseText}</div>
                      {clause.suggestedValue && (
                        <div
                          style={{
                            padding: 'var(--space-2) var(--space-4)',
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-muted)',
                            borderTop: '1px solid var(--color-border)',
                          }}
                        >
                          Suggested value: <strong>{clause.suggestedValue}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/policies/${result.policyId}`)}
            >
              Review & Confirm Policy
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/policies')}>
              Back to Policies
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Warranty Policy</h1>
          <p className="page-subtitle">Upload a PDF warranty document for text extraction and review</p>
        </div>
      </div>
      <div className="page-body">
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-header">
            <h2 className="card-title">Policy Details</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Policy Name <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., SoundWave X200 Limited Warranty"
                  disabled={uploading}
                />
                {fieldErrors.name && <span className="form-error"><AlertCircle size={12} />{fieldErrors.name}</span>}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="productCategory" className="form-label">
                    Product Category <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="productCategory"
                    type="text"
                    className={`form-input ${fieldErrors.productCategory ? 'error' : ''}`}
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="e.g., Wireless Headphones"
                    disabled={uploading}
                  />
                  {fieldErrors.productCategory && <span className="form-error"><AlertCircle size={12} />{fieldErrors.productCategory}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="manufacturerLabel" className="form-label">
                    Manufacturer Label <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="manufacturerLabel"
                    type="text"
                    className={`form-input ${fieldErrors.manufacturerLabel ? 'error' : ''}`}
                    value={manufacturerLabel}
                    onChange={(e) => setManufacturerLabel(e.target.value)}
                    placeholder="e.g., SoundWave Electronics"
                    disabled={uploading}
                  />
                  {fieldErrors.manufacturerLabel && <span className="form-error"><AlertCircle size={12} />{fieldErrors.manufacturerLabel}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reviewerNotes" className="form-label">Reviewer Notes</label>
                <textarea
                  id="reviewerNotes"
                  className="form-textarea"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Optional notes for the reviewer..."
                  disabled={uploading}
                />
              </div>

              {/* File upload */}
              <div className="form-group">
                <label className="form-label">
                  Warranty PDF <span className="required" aria-hidden="true">*</span>
                </label>
                <div
                  className={`file-upload-area ${dragover ? 'dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragover(false);
                    handleFileSelect(e.dataTransfer.files[0] ?? null);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload PDF file"
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    disabled={uploading}
                    aria-hidden="true"
                  />
                  {file ? (
                    <div className="flex items-center gap-3" style={{ justifyContent: 'center' }}>
                      <FileText size={24} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{file.name}</div>
                        <div className="text-xs text-muted">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ color: 'var(--color-text-light)', marginBottom: 'var(--space-3)' }} aria-hidden="true" />
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        Drop PDF here or click to browse
                      </div>
                      <div className="text-sm text-muted">PDF files only, max 10 MB</div>
                    </>
                  )}
                </div>
                {fieldErrors.file && <span className="form-error"><AlertCircle size={12} />{fieldErrors.file}</span>}
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? (
                    <><span className="spinner spinner-sm" aria-hidden="true" /> Processing...</>
                  ) : (
                    <><Upload size={15} aria-hidden="true" /> Upload & Extract</>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/policies')}
                  disabled={uploading}
                >
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
