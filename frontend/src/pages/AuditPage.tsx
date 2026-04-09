import { useMemo, useState } from 'react';
import { useAudit } from '../hooks/useAudit';

type ActionView = 'create' | 'update' | 'delete' | 'view' | 'export';

function getInitials(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) {
    return 'U';
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
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

function mapActionType(action: string): ActionView {
  if (action.includes('remove') || action.includes('delete')) {
    return 'delete';
  }
  if (action.includes('download') || action.includes('export')) {
    return 'export';
  }
  if (action.includes('import') || action.includes('create')) {
    return 'create';
  }
  if (action.includes('save') || action.includes('validate') || action.includes('updated') || action.includes('update')) {
    return 'update';
  }
  return 'view';
}

function resourceFromMeta(action: string, meta: Record<string, unknown>): string {
  if (typeof meta.file_name === 'string' || typeof meta.file_id === 'string') {
    return 'File';
  }
  if (typeof meta.target_user_id === 'string' || typeof meta.username === 'string' || action.includes('user')) {
    return 'User';
  }
  if (action.includes('scenario') || typeof meta.scenario_id === 'string') {
    return 'Scenario';
  }
  if (action.includes('report')) {
    return 'Report';
  }
  return 'System';
}

function toDetails(action: string, meta: Record<string, unknown>): string {
  const fileName = typeof meta.file_name === 'string' ? meta.file_name : null;
  const reason = typeof meta.reason === 'string' ? meta.reason : null;
  const username = typeof meta.username === 'string' ? meta.username : null;

  if (fileName && action.includes('import')) {
    return `Imported ${fileName}`;
  }
  if (fileName && action.includes('download')) {
    return `Downloaded ${fileName}`;
  }
  if (fileName && action.includes('remove')) {
    return `Deleted ${fileName}`;
  }
  if (username && reason) {
    return `${reason.split('_').join(' ')} (${username})`;
  }
  if (reason) {
    return reason.split('_').join(' ');
  }

  const parts = action.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return parts.join(' ');
}

function toActionLabel(action: string): string {
  return mapActionType(action).toUpperCase();
}

function actionIcon(action: string): string {
  const type = mapActionType(action);
  if (type === 'create') return 'fas fa-plus';
  if (type === 'update') return 'fas fa-pen';
  if (type === 'delete') return 'fas fa-trash';
  if (type === 'export') return 'fas fa-download';
  return 'fas fa-eye';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const then = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((today - then) / 86400000);

  const base = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 0) {
    return `${base} (Today)`;
  }
  if (diffDays === 1) {
    return `${base} (Yesterday)`;
  }
  return `${base} (${diffDays} days ago)`;
}

export function AuditPage() {
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const audit = useAudit({ page: 1, pageSize: 200 });
  const logs = audit.list.data?.data ?? [];

  const userOptions = useMemo(() => {
    const names = new Set(logs.map((item) => item.username || 'Unknown'));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const actionType = mapActionType(item.action);
      const resource = resourceFromMeta(item.action, item.meta);
      const byUser = !userFilter || item.username === userFilter;
      const byAction = !actionFilter || actionType === actionFilter;
      const byResource = !resourceFilter || resource.toLowerCase() === resourceFilter.toLowerCase();
      const byDate = !dateFilter || new Date(item.timestamp).toISOString().slice(0, 10) === dateFilter;

      return byUser && byAction && byResource && byDate;
    });
  }, [logs, userFilter, actionFilter, resourceFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageLogs = filteredLogs.slice(pageStart, pageStart + pageSize);

  const latestSync = logs.length > 0 ? new Date(logs[0].timestamp).toLocaleString() : '-';

  const pageStyles = `
    .admin-header {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: 6px;
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
    }

    .admin-text {
      color: var(--color-error);
      font-size: 14px;
      font-weight: 500;
    }

    .audit-filters {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .filter-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .filter-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .action-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .action-create {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
    }

    .action-update {
      background-color: rgba(66, 165, 245, 0.1);
      color: #42a5f5;
    }

    .action-delete {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }

    .action-view {
      background-color: rgba(249, 115, 22, 0.1);
      color: var(--color-warning);
    }

    .action-export {
      background-color: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11px;
    }

    .user-name {
      font-weight: 500;
      color: var(--color-text-primary);
      font-size: 13px;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Audit Logs</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Track all system activities and user actions</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.alert('Exporting audit logs...')}>
          <i className="fas fa-download"></i>
          <span>Export</span>
        </button>
      </div>

      <div className="admin-header">
        <span className="admin-badge">
          <i className="fas fa-shield-alt"></i> Admin
        </span>
        <span className="admin-text">This section is restricted to administrators only. All activities are logged and auditable.</span>
      </div>

      <div className="audit-filters">
        <div className="filter-group">
          <label className="filter-label">User</label>
          <select className="filter-input" value={userFilter} onChange={(event) => { setUserFilter(event.target.value); setPage(1); }}>
            <option value="">All Users</option>
            {userOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Action</label>
          <select className="filter-input" value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="export">Export</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Resource</label>
          <select className="filter-input" value={resourceFilter} onChange={(event) => { setResourceFilter(event.target.value); setPage(1); }}>
            <option value="">All Resources</option>
            <option value="File">File</option>
            <option value="Scenario">Scenario</option>
            <option value="Report">Report</option>
            <option value="User">User</option>
            <option value="System">System</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <input type="date" className="filter-input" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Activity Log ({filteredLogs.length} records)</h3>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Last updated: {latestSync}</span>
        </div>

        {audit.list.isLoading ? <div style={{ padding: 'var(--spacing-md)' }}>Loading audit logs...</div> : null}
        {audit.list.error ? (
          <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-error)' }}>
            {(audit.list.error as Error).message}
          </div>
        ) : null}

        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {!audit.list.isLoading && pageLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: 'var(--color-text-muted)' }}>No audit logs found.</td>
              </tr>
            ) : null}

            {pageLogs.map((item) => (
              <tr key={item.audit_id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar" style={getAvatarStyle(item.username)}>{getInitials(item.username)}</div>
                    <span className="user-name">{item.username}</span>
                  </div>
                </td>
                <td>
                  <span className={`action-badge action-${mapActionType(item.action)}`}>
                    <i className={actionIcon(item.action)}></i> {toActionLabel(item.action)}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{resourceFromMeta(item.action, item.meta)}</td>
                <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{toDetails(item.action, item.meta)}</td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatTimestamp(item.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>
            ← Previous
          </button>

          {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
            const number = index + 1;
            return (
              <button
                key={number}
                className={number === safePage ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{ minWidth: 40 }}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            );
          })}

          <button className="btn btn-secondary btn-sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}>
            Next →
          </button>
        </div>
      </div>

    </>
  );
}
