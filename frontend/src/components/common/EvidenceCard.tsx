import React from 'react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { EvidenceItem } from '../../types';
import { CLAUSE_TYPE_LABELS } from '../../types';

interface Props {
  evidence: EvidenceItem;
}

export function EvidenceCard({ evidence }: Props) {
  const clauseLabel =
    CLAUSE_TYPE_LABELS[evidence.clauseType as keyof typeof CLAUSE_TYPE_LABELS] ?? evidence.clauseType;

  return (
    <div className="evidence-card">
      <div className="evidence-card-header">
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{clauseLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {evidence.pageNumber && (
            <span className="text-xs text-muted">Page {evidence.pageNumber}</span>
          )}
          {evidence.confirmedByReviewer ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-success)' }}
              title="Confirmed by reviewer"
            >
              <CheckCircle size={12} aria-hidden="true" />
              Confirmed
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-warning)' }}
              title="Awaiting reviewer confirmation"
            >
              <Clock size={12} aria-hidden="true" />
              Unconfirmed
            </span>
          )}
        </div>
      </div>
      <div className="evidence-card-body">{evidence.clauseText}</div>
    </div>
  );
}
