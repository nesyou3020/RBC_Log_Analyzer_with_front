import { FormEvent, useMemo, useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { usePasswordResetRequests } from '../hooks/usePasswordResetRequests';
import { ApiError } from '../services/api/client';
import { UserPublic, UserRole } from '../types';

function getInitials(username: string): string {
  const value = username.trim();
  if (!value) {
    return 'U';
  }

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getAvatarStyle(username: string): React.CSSProperties {
  const palettes = [
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #ec4899, #f97316)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
    'linear-gradient(135deg, #8b5cf6, #a855f7)',
    'linear-gradient(135deg, #f59e0b, #ef4444)'
  ];

  return { background: palettes[hashString(username) % palettes.length] };
}

function getRoleLabel(role: UserRole): string {
  return role === 'validator' ? 'Validator' : 'Engineer';
}

function getRoleIcon(role: UserRole): string {
  return role === 'validator' ? 'fas fa-shield-alt' : 'fas fa-hard-hat';
}

function formatLastLogin(value: string | null): string {
  if (!value) {
    return 'Never';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);
  const timeText = parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) {
    return `Today at ${timeText}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${timeText}`;
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return parsed.toLocaleString();
}

function formatCreatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleDateString();
}

function getUserRoleClass(role: UserRole): string {
  return role === 'validator' ? 'role-validator' : 'role-engineer';
}

function getStatusClass(isActive: boolean): string {
  return isActive ? 'status-active' : 'status-inactive';
}

function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}

export function UsersPage() {
  const users = useUsers();
  const passwordReset = usePasswordResetRequests();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [searchText, setSearchText] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [passwordResetActionMessage, setPasswordResetActionMessage] = useState<string | null>(null);
  const [passwordResetActionError, setPasswordResetActionError] = useState<string | null>(null);

  const userItems = users.list.data ?? [];

  const filteredUsers = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) {
      return userItems;
    }

    return userItems.filter((item) => {
      const searchable = [item.username, item.role, item.is_active ? 'active' : 'inactive', item.created_at, item.last_login ?? '']
        .join(' ')
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [userItems, searchText]);

  const latestSync = userItems.length > 0 ? formatCreatedAt(userItems[0].created_at) : '-';

  const pageStyles = `
    .users-header-card {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
      box-shadow: 0 18px 44px rgba(2, 6, 23, 0.22);
    }

    .admin-header {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: 10px;
      margin-bottom: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .admin-badge {
      background-color: var(--color-error);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .admin-text {
      color: var(--color-error);
      font-size: 14px;
      font-weight: 500;
    }

    .user-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-active {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
    }

    .status-inactive {
      background-color: rgba(107, 114, 128, 0.1);
      color: var(--color-text-muted);
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .role-engineer {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .role-validator {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .user-email {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .action-btn {
      padding: 6px 12px;
      background-color: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 8px;
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: 12px;
      transition: var(--transition);
    }

    .action-btn:hover:not(:disabled) {
      background-color: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.55);
      color: var(--color-primary);
    }

    .action-btn.danger:hover:not(:disabled) {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: var(--color-error);
      color: var(--color-error);
    }

    .users-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .users-search {
      width: min(420px, 100%);
      padding: 10px 12px;
      background-color: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 10px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .users-card {
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 14px;
      padding: var(--spacing-lg);
      box-shadow: 0 10px 28px rgba(2, 6, 23, 0.16);
    }

    .users-card + .users-card {
      margin-top: var(--spacing-lg);
    }

    .users-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }

    .users-card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .users-card-subtitle {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .users-empty {
      padding: var(--spacing-xl);
      text-align: center;
      color: var(--color-text-muted);
    }

    .users-modal {
      width: min(520px, 96vw);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
    }

    .users-modal-body {
      display: grid;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }

    .users-modal-footer {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding: 0 var(--spacing-lg) var(--spacing-lg);
      flex-wrap: wrap;
    }

    .users-inline-note {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .users-select,
    .users-input {
      width: 100%;
      padding: 10px 12px;
      background-color: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 10px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    @media (max-width: 960px) {
      .users-card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .users-search {
        width: 100%;
      }

      .users-modal-footer {
        flex-direction: column-reverse;
      }
    }
  `;

  function openCreateUserModal() {
    setEditingUser(null);
    setFullName('');
    setPassword('');
    setRole('engineer');
    setStatus('active');
    setIsModalOpen(true);
  }

  function openEditUserModal(user: UserPublic) {
    setEditingUser(user);
    setFullName(user.username);
    setPassword('');
    setRole(user.role);
    setStatus(user.is_active ? 'active' : 'inactive');
    setIsModalOpen(true);
  }

  function closeUserModal() {
    setIsModalOpen(false);
  }

  function saveUser(event: FormEvent) {
    event.preventDefault();

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return;
    }

    if (!editingUser && !password.trim()) {
      return;
    }

    if (editingUser) {
      const desiredRole = role;
      const desiredActive = status === 'active';

      if (editingUser.role !== desiredRole) {
        users.setRole.mutate(
          { userId: editingUser.user_id, role: desiredRole },
          {
            onSuccess: () => {
              if (editingUser.is_active !== desiredActive) {
                users.setActive.mutate({ userId: editingUser.user_id, isActive: desiredActive });
              }
            }
          }
        );
      } else if (editingUser.is_active !== desiredActive) {
        users.setActive.mutate({ userId: editingUser.user_id, isActive: desiredActive });
      }

      closeUserModal();
      return;
    }

    users.create.mutate(
      { username: trimmedName, password, role },
      {
        onSuccess: (response) => {
          if (status === 'inactive') {
            users.setActive.mutate({ userId: response.data.user_id, isActive: false });
          }
          closeUserModal();
        }
      }
    );
  }

  const pageTitle = editingUser ? `Edit: ${editingUser.username}` : 'Add New User';

  return (
    <>
      <style>{pageStyles}</style>

      <div className="users-header-card users-toolbar">
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>User Management</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage system users and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateUserModal}>
          <i className="fas fa-user-plus"></i>
          <span>Add User</span>
        </button>
      </div>

      <div className="admin-header">
        <span className="admin-badge">
          <i className="fas fa-shield-alt"></i> Admin
        </span>
        <span className="admin-text">This section is restricted to administrators only. Changes made here affect all users.</span>
      </div>

      <div className="users-toolbar" style={{ marginTop: 0 }}>
        <input
          type="text"
          className="users-search"
          placeholder="Search users..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Last updated: {latestSync}</span>
      </div>

      <div className="users-card">
        <div className="users-card-header">
          <div>
            <div className="users-card-title">System Users ({filteredUsers.length})</div>
            <div className="users-card-subtitle">Active user accounts returned by the backend</div>
          </div>
          <div className="users-card-subtitle">Role changes and active status are saved immediately</div>
        </div>

        {users.list.isLoading ? (
          <div className="users-empty">Loading users...</div>
        ) : null}

        {users.list.error ? (
          <div className="users-empty" style={{ color: 'var(--color-error)' }}>
            {(users.list.error as Error).message}
          </div>
        ) : null}

        {!users.list.isLoading && !users.list.error && filteredUsers.length === 0 ? (
          <div className="users-empty">No users found.</div>
        ) : null}

        {!users.list.isLoading && !users.list.error && filteredUsers.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Creation Date</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => (
                <tr key={item.user_id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar" style={getAvatarStyle(item.username)}>
                        {getInitials(item.username)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{item.username}</div>
                        <div className="user-email">{item.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getUserRoleClass(item.role)}`}>
                      <i className={getRoleIcon(item.role)}></i> {getRoleLabel(item.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`user-status ${getStatusClass(item.is_active)}`}>
                      <i className="fas fa-circle" style={{ fontSize: 8 }}></i> {getStatusLabel(item.is_active)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatCreatedAt(item.created_at)}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatLastLogin(item.last_login)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="action-btn" title="Edit user" onClick={() => openEditUserModal(item)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="action-btn"
                        title={item.is_active ? 'Disable user' : 'Enable user'}
                        onClick={() => users.setActive.mutate({ userId: item.user_id, isActive: !item.is_active })}
                        disabled={users.setActive.isPending}
                      >
                        <i className={item.is_active ? 'fas fa-user-slash' : 'fas fa-user-check'}></i>
                      </button>
                      <button
                        className="action-btn"
                        title="Toggle role"
                        onClick={() => users.setRole.mutate({ userId: item.user_id, role: item.role === 'validator' ? 'engineer' : 'validator' })}
                        disabled={users.setRole.isPending}
                      >
                        <i className="fas fa-random"></i>
                      </button>
                      <button
                        className="action-btn danger"
                        title="Delete user"
                        onClick={() => users.remove.mutate(item.user_id)}
                        disabled={users.remove.isPending}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="users-card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="users-card-header">
          <div>
            <div className="users-card-title">Password Reset Requests ({(passwordReset.list.data ?? []).filter(r => r.status === 'pending').length})</div>
            <div className="users-card-subtitle">Users requesting password resets - awaiting admin approval</div>
          </div>
        </div>

        {passwordResetActionMessage ? (
          <div style={{ color: 'var(--color-success)', fontSize: 13, marginBottom: 'var(--spacing-md)' }}>
            {passwordResetActionMessage}
          </div>
        ) : null}

        {passwordResetActionError ? (
          <div style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 'var(--spacing-md)' }}>
            {passwordResetActionError}
          </div>
        ) : null}

        {passwordReset.list.isLoading ? (
          <div className="users-empty">Loading password reset requests...</div>
        ) : null}

        {passwordReset.list.error ? (
          <div className="users-empty" style={{ color: 'var(--color-error)' }}>
            {(passwordReset.list.error as Error).message}
          </div>
        ) : null}

        {!passwordReset.list.isLoading && !passwordReset.list.error && (passwordReset.list.data ?? []).length === 0 ? (
          <div className="users-empty">No password reset requests.</div>
        ) : null}

        {!passwordReset.list.isLoading && !passwordReset.list.error && (passwordReset.list.data ?? []).length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(passwordReset.list.data ?? []).map((request) => (
                <tr key={request.request_id}>
                  <td style={{ fontWeight: 500 }}>{request.username}</td>
                  <td>
                    <span className={`role-badge ${request.role === 'validator' ? 'role-validator' : 'role-engineer'}`}>
                      <i className={request.role === 'validator' ? 'fas fa-shield-alt' : 'fas fa-hard-hat'}></i>
                      {request.role === 'validator' ? 'Validator' : 'Engineer'}
                    </span>
                  </td>
                  <td>
                    <span className={`role-badge ${
                      request.status === 'pending'
                        ? 'role-engineer'
                        : request.status === 'approved'
                        ? 'role-validator'
                        : 'role-engineer'
                    }`} style={{
                      backgroundColor: request.status === 'pending' ? 'rgba(251, 146, 60, 0.1)' : request.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: request.status === 'pending' ? '#fb923c' : request.status === 'approved' ? '#22c55e' : '#6b7280'
                    }}>
                      <i className={'fas ' + (request.status === 'pending' ? 'fa-hourglass-half' : request.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle')}></i>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {request.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="action-btn"
                          title="Approve password reset"
                          onClick={() => {
                            setPasswordResetActionMessage(null);
                            setPasswordResetActionError(null);
                            passwordReset.approve.mutate(request.request_id, {
                              onSuccess: () => {
                                setPasswordResetActionMessage(`Password reset approved for ${request.username}.`);
                              },
                              onError: (error) => {
                                if (error instanceof ApiError) {
                                  setPasswordResetActionError(error.message);
                                } else {
                                  setPasswordResetActionError('Failed to approve password reset request.');
                                }
                              }
                            });
                          }}
                          disabled={passwordReset.approve.isPending}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          className="action-btn danger"
                          title="Reject password reset"
                          onClick={() => {
                            setRejectingRequestId(request.request_id);
                            setRejectionReason('');
                            setRejectModalOpen(true);
                          }}
                          disabled={passwordReset.reject.isPending}
                        >
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {request.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        {request.rejection_reason ? ` - ${request.rejection_reason}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isModalOpen ? (
        <>
          <div className="modal active" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="users-modal">
              <div className="modal-header" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ margin: 0 }}>{pageTitle}</h2>
                <button className="modal-close" onClick={closeUserModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={saveUser}>
                <div className="users-modal-body">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="users-input"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="e.g., John Doe"
                    />
                  </div>

                  {!editingUser ? (
                    <div className="form-group">
                      <label className="form-label">Temporary Password</label>
                      <input
                        type="password"
                        className="users-input"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Generate temporary password"
                      />
                      <div className="users-inline-note">
                        <i className="fas fa-info-circle"></i> User will be prompted to change password on first login
                      </div>
                    </div>
                  ) : null}

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="users-select" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                      <option value="engineer">Engineer</option>
                      <option value="validator">Validator (Admin)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="users-select" value={status} onChange={(event) => setStatus(event.target.value as 'active' | 'inactive')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="users-modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeUserModal}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={users.create.isPending}>
                    Save User
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="modal-backdrop" style={{ display: 'block' }} onClick={closeUserModal}></div>
        </>
      ) : null}

      {rejectModalOpen && rejectingRequestId ? (
        <>
          <div className="modal active" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="users-modal">
              <div className="modal-header" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ margin: 0 }}>Reject Password Reset Request</h2>
                <button
                  className="modal-close"
                  onClick={() => setRejectModalOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rejectingRequestId) {
                    passwordReset.reject.mutate(
                      { requestId: rejectingRequestId, reason: rejectionReason },
                      {
                        onSuccess: () => {
                          setPasswordResetActionError(null);
                          setPasswordResetActionMessage('Password reset request rejected.');
                          setRejectModalOpen(false);
                          setRejectingRequestId(null);
                          setRejectionReason('');
                        },
                        onError: (error) => {
                          if (error instanceof ApiError) {
                            setPasswordResetActionError(error.message);
                          } else {
                            setPasswordResetActionError('Failed to reject password reset request.');
                          }
                        }
                      }
                    );
                  }
                }}
              >
                <div className="users-modal-body">
                  <div className="form-group">
                    <label className="form-label">Reason for Rejection (Optional)</label>
                    <textarea
                      className="users-input"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="e.g., Please contact the IT department"
                      rows={4}
                      style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className="users-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRejectModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={passwordReset.reject.isPending}
                  >
                    {passwordReset.reject.isPending ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="modal-backdrop" style={{ display: 'block' }} onClick={() => setRejectModalOpen(false)}></div>
        </>
      ) : null}
    </>
  );
}
