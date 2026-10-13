import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={20}
              style={{ color: variant === 'danger' ? 'var(--color-error)' : 'var(--color-warning)' }}
              aria-hidden="true"
            />
            <h2 className="modal-title" id="confirm-title">{title}</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <><span className="spinner spinner-sm" /> Processing...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
