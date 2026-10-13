import React from 'react';
import { PreliminaryResult, ReviewStatus, ExtractionStatus, PRELIMINARY_RESULT_LABELS } from '../../types';

// Preliminary result badge
export function ResultBadge({ result }: { result: PreliminaryResult }) {
  const config: Record<PreliminaryResult, { cls: string; label: string; symbol: string }> = {
    MEETS_BASIC_CHECKS: { cls: 'badge-success',  label: PRELIMINARY_RESULT_LABELS.MEETS_BASIC_CHECKS, symbol: '✓' },
    OUTSIDE_PERIOD:     { cls: 'badge-error',    label: PRELIMINARY_RESULT_LABELS.OUTSIDE_PERIOD,     symbol: '✕' },
    POSSIBLE_EXCLUSION: { cls: 'badge-warning',  label: PRELIMINARY_RESULT_LABELS.POSSIBLE_EXCLUSION, symbol: '⚠' },
    MISSING_INFO:       { cls: 'badge-info',     label: PRELIMINARY_RESULT_LABELS.MISSING_INFO,       symbol: 'ℹ' },
    MANUAL_REVIEW:      { cls: 'badge-neutral',  label: PRELIMINARY_RESULT_LABELS.MANUAL_REVIEW,      symbol: '?' },
  };
  const c = config[result];
  return (
    <span className={`badge ${c.cls}`} aria-label={c.label}>
      <span aria-hidden="true">{c.symbol}</span>
      {c.label}
    </span>
  );
}

// Review status badge
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const config: Record<ReviewStatus, { cls: string; label: string }> = {
    PENDING:        { cls: 'badge-neutral', label: 'Pending Review' },
    REVIEWED:       { cls: 'badge-success', label: 'Reviewed' },
    NEEDS_MORE_INFO:{ cls: 'badge-warning', label: 'Needs More Info' },
  };
  const c = config[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

// Extraction status badge
export function ExtractionBadge({ status }: { status: ExtractionStatus }) {
  const config: Record<ExtractionStatus, { cls: string; label: string }> = {
    PENDING:   { cls: 'badge-neutral', label: 'Pending' },
    EXTRACTED: { cls: 'badge-success', label: 'Extracted' },
    FAILED:    { cls: 'badge-error',   label: 'Failed' },
    NEEDS_OCR: { cls: 'badge-warning', label: 'Needs OCR' },
  };
  const c = config[status] ?? { cls: 'badge-neutral', label: status };
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

// Role badge
export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, string> = {
    ADMIN: 'badge-purple',
    REVIEWER: 'badge-info',
    CUSTOMER: 'badge-neutral',
  };
  return <span className={`badge ${config[role] ?? 'badge-neutral'}`}>{role}</span>;
}

// Active/inactive badge
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-neutral'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// Confirmed badge
export function ConfirmedBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span className={`badge ${confirmed ? 'badge-success' : 'badge-warning'}`}>
      {confirmed ? 'Confirmed' : 'Pending Confirmation'}
    </span>
  );
}
