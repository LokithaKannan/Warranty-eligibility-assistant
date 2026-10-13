import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList, ChevronRight, Filter } from 'lucide-react';
import { getClaims } from '../../api/claims';
import { ClaimCheck, ISSUE_TYPE_LABELS } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { ResultBadge, ReviewStatusBadge } from '../../components/common/StatusBadge';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/date';

const RESULT_OPTIONS = [
  { value: '', label: 'All Results' },
  { value: 'MEETS_BASIC_CHECKS', label: 'Meets Basic Checks' },
  { value: 'OUTSIDE_PERIOD', label: 'Outside Period' },
  { value: 'POSSIBLE_EXCLUSION', label: 'Possible Exclusion' },
  { value: 'MISSING_INFO', label: 'Missing Info' },
  { value: 'MANUAL_REVIEW', label: 'Manual Review' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'NEEDS_MORE_INFO', label: 'Needs More Info' },
];

export function ClaimsHistoryPage() {
  const [claims, setClaims] = useState<ClaimCheck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getClaims({
      page,
      pageSize,
      search: search || undefined,
      preliminaryResult: resultFilter || undefined,
      reviewStatus: statusFilter || undefined,
    })
      .then((data) => {
        setClaims(data.data);
        setTotal(data.total);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, resultFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Claim History</h1>
          <p className="page-subtitle">View and manage warranty claim assessments</p>
        </div>
        <Link to="/claims/new" className="btn btn-primary">
          New Claim Assessment
        </Link>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
            <div className="flex gap-3 flex-wrap">
              <form onSubmit={handleSearch} className="search-bar flex-1" style={{ minWidth: 200 }}>
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="form-input"
                  placeholder="Search by reference or product..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search claims"
                />
              </form>
              <div className="flex gap-2">
                <select
                  className="form-select"
                  value={resultFilter}
                  onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
                  aria-label="Filter by result"
                  style={{ width: 180 }}
                >
                  {RESULT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  aria-label="Filter by status"
                  style={{ width: 160 }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button type="submit" form="" className="btn btn-primary" onClick={handleSearch}>
                  <Filter size={14} aria-hidden="true" /> Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading claims..." />
        ) : claims.length === 0 ? (
          <EmptyState
            title="No claims found"
            description={
              search || resultFilter || statusFilter
                ? 'No claims matched the current filters.'
                : 'No claim assessments have been submitted yet.'
            }
            icon={<ClipboardList size={48} aria-hidden="true" />}
            action={
              <Link to="/claims/new" className="btn btn-primary">
                Submit First Claim
              </Link>
            }
          />
        ) : (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Product</th>
                    <th>Policy</th>
                    <th>Purchase Date</th>
                    <th>Issue Type</th>
                    <th>Result</th>
                    <th>Review Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <code style={{ fontSize: '0.8125rem' }}>{claim.referenceCode}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{claim.productName}</div>
                        <div className="text-xs text-muted">{claim.productCategory}</div>
                      </td>
                      <td className="text-muted">{claim.policy?.name ?? '—'}</td>
                      <td>{formatDate(claim.purchaseDate)}</td>
                      <td>{ISSUE_TYPE_LABELS[claim.issueType] ?? claim.issueType}</td>
                      <td><ResultBadge result={claim.preliminaryResult} /></td>
                      <td><ReviewStatusBadge status={claim.reviewStatus} /></td>
                      <td className="text-muted">{formatDate(claim.createdAt)}</td>
                      <td>
                        <Link
                          to={`/claims/${claim.referenceCode}`}
                          className="btn btn-ghost btn-sm"
                          aria-label={`View claim ${claim.referenceCode}`}
                        >
                          <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={Math.ceil(total / pageSize)}
              total={total}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </>
  );
}
