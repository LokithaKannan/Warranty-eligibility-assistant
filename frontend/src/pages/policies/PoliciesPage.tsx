import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Shield, ChevronRight } from 'lucide-react';
import { getPolicies } from '../../api/policies';
import { Policy } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { ActiveBadge, ConfirmedBadge, ExtractionBadge } from '../../components/common/StatusBadge';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

export function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canUpload = user?.role === 'ADMIN' || user?.role === 'REVIEWER';

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getPolicies({ page, pageSize, search: search || undefined })
      .then((data) => {
        setPolicies(data.data);
        setTotal(data.total);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

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
          <h1 className="page-title">Warranty Policies</h1>
          <p className="page-subtitle">Manage and review warranty policy documents</p>
        </div>
        {canUpload && (
          <Link to="/policies/upload" className="btn btn-primary">
            <Plus size={15} aria-hidden="true" /> Upload Policy
          </Link>
        )}
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Search bar */}
        <div className="card mb-6">
          <div className="card-body" style={{ paddingBottom: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="search-bar flex-1">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="form-input"
                  placeholder="Search by name, category, or manufacturer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search policies"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {search && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading policies..." />
        ) : policies.length === 0 ? (
          <EmptyState
            title="No policies found"
            description={
              search
                ? `No policies matched "${search}". Try a different search term.`
                : "No warranty policies have been uploaded yet."
            }
            icon={<Shield size={48} aria-hidden="true" />}
            action={
              canUpload ? (
                <Link to="/policies/upload" className="btn btn-primary">
                  <Plus size={15} aria-hidden="true" /> Upload First Policy
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Policy Name</th>
                    <th>Category</th>
                    <th>Manufacturer</th>
                    <th>Duration</th>
                    <th>Extraction</th>
                    <th>Status</th>
                    <th>Confirmed</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{policy.name}</div>
                        <div className="text-xs text-muted">{policy.originalFilename}</div>
                      </td>
                      <td>{policy.productCategory}</td>
                      <td className="text-muted">{policy.manufacturerLabel}</td>
                      <td>
                        {policy.durationMonths
                          ? `${policy.durationMonths} months`
                          : <span className="text-muted">—</span>}
                      </td>
                      <td><ExtractionBadge status={policy.extractionStatus} /></td>
                      <td><ActiveBadge active={policy.isActive} /></td>
                      <td><ConfirmedBadge confirmed={policy.isConfirmed} /></td>
                      <td className="text-muted">{formatDate(policy.createdAt)}</td>
                      <td>
                        <Link
                          to={`/policies/${policy.id}`}
                          className="btn btn-ghost btn-sm"
                          aria-label={`View policy ${policy.name}`}
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
