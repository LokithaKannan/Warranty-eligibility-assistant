import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 'md', message, fullPage }: Props) {
  const spinnerCls = `spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''}`;

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(13,20,34,.85)',
          zIndex: 9999,
        }}
        role="status"
        aria-label={message ?? 'Loading'}
      >
        <div className="loading-center">
          <div className={spinnerCls} aria-hidden="true" />
          {message && <span>{message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-center" role="status" aria-label={message ?? 'Loading'}>
      <div className={spinnerCls} aria-hidden="true" />
      {message && <span>{message}</span>}
    </div>
  );
}
