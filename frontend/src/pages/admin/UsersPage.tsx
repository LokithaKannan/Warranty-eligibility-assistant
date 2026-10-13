import React, { useEffect, useState, useCallback } from 'react';
import { Users, Plus, AlertCircle } from 'lucide-react';
import { getUsers, createUser, updateUser } from '../../api/admin';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { RoleBadge, ActiveBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('CUSTOMER');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Deactivate confirmation
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getUsers({ page, pageSize })
      .then((data) => { setUsers(data.data); setTotal(data.total); })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await createUser({ username: newUsername.trim(), email: newEmail.trim(), password: newPassword, role: newRole });
      setSuccess('User created successfully');
      setShowCreate(false);
      setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('CUSTOMER');
      load();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    setDeactivating(true);
    try {
      await updateUser(targetUser.id, { isActive: !targetUser.isActive });
      setSuccess(`User ${targetUser.username} ${targetUser.isActive ? 'deactivated' : 'activated'}`);
      setConfirmDeactivate(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage user accounts and roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={15} aria-hidden="true" /> Add User
        </button>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error mb-4" role="alert">{error}</div>}
        {success && <div className="alert alert-success mb-4" role="status">{success}</div>}

        {/* Create user form */}
        {showCreate && (
          <div className="card mb-6" style={{ maxWidth: 600 }}>
            <div className="card-header">
              <h2 className="card-title">Create New User</h2>
            </div>
            <div className="card-body">
              {createError && (
                <div className="alert alert-error mb-4" role="alert">
                  <AlertCircle size={14} /><span>{createError}</span>
                </div>
              )}
              <form onSubmit={handleCreate} noValidate>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Username <span className="required">*</span></label>
                    <input type="text" className="form-input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input type="email" className="form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Password <span className="required">*</span></label>
                    <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                      <option value="CUSTOMER">Customer</option>
                      <option value="REVIEWER">Reviewer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? <><span className="spinner spinner-sm" /> Creating...</> : 'Create User'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" icon={<Users size={48} />} />
        ) : (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td className="text-muted">{u.email}</td>
                      <td><RoleBadge role={u.role} /></td>
                      <td><ActiveBadge active={u.isActive} /></td>
                      <td className="text-muted">{formatDate(u.createdAt)}</td>
                      <td>
                        {u.id !== currentUser?.id && (
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => setConfirmDeactivate(u)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
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

      <ConfirmDialog
        isOpen={!!confirmDeactivate}
        title={confirmDeactivate?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmDeactivate?.isActive ? 'deactivate' : 'activate'} user "${confirmDeactivate?.username}"?`}
        confirmLabel={confirmDeactivate?.isActive ? 'Deactivate' : 'Activate'}
        variant={confirmDeactivate?.isActive ? 'danger' : 'info'}
        onConfirm={() => confirmDeactivate && handleToggleActive(confirmDeactivate)}
        onCancel={() => setConfirmDeactivate(null)}
        isLoading={deactivating}
      />
    </>
  );
}
