import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '../../api/admin';
import { AuditLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/date';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getAuditLogs({ page, pageSize })
      .then((data) => { setLogs(data.data); setTotal(data.total); })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">System activity records — administrators only</p>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

        {loading ? (
          <LoadingSpinner message="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs" description="No system events recorded yet." icon={<ScrollText size={48} />} />
        ) : (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Outcome</th>
                    <th>Request ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                      <td>{log.user?.username ?? <span className="text-muted">—</span>}</td>
                      <td>
                        <code style={{ fontSize: '0.8125rem' }}>{log.action}</code>
                      </td>
                      <td>
                        {log.entityType ? (
                          <span>
                            <span className="text-muted">{log.entityType}: </span>
                            <code style={{ fontSize: '0.75rem' }}>{log.entityId?.slice(0, 8)}...</code>
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span
                          className={`badge ${log.outcome === 'SUCCESS' ? 'badge-success' : log.outcome === 'FAILURE' ? 'badge-error' : 'badge-warning'}`}
                        >
                          {log.outcome}
                        </span>
                      </td>
                      <td>
                        {log.requestId ? (
                          <code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {log.requestId.slice(0, 8)}
                          </code>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={Math.ceil(total / pageSize)} total={total} pageSize={pageSize} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}
