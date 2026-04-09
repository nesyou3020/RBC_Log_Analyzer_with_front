import { NavLink } from 'react-router-dom';
import { routes } from '../config/routes';
import { useDashboard } from '../hooks/useDashboard';
import { useAuthContext } from '../store/authContext';

function formatRelativeTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	const diffDays = Math.round((today - day) / 86400000);
	const timeText = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

	if (diffDays === 0) return `Today at ${timeText}`;
	if (diffDays === 1) return `Yesterday at ${timeText}`;
	return `${diffDays} days ago`;
}

function mapActionLabel(action: string | null | undefined): string {
	const raw = action ?? '';
	const normalized = raw.toLowerCase();
	if (normalized.includes('import')) return 'IMPORT';
	if (normalized.includes('download')) return 'DOWNLOAD';
	if (normalized.includes('remove') || normalized.includes('delete')) return 'DELETE';
	if (normalized.includes('login')) return 'LOGIN';
	if (normalized.includes('logout')) return 'LOGOUT';
	if (normalized.includes('scenario')) return 'SCENARIO';
	if (normalized.includes('user')) return 'USER';
	return raw.split('_').join(' ').toUpperCase();
}

function mapActionClass(action: string | null | undefined): string {
	const normalized = (action ?? '').toLowerCase();
	if (normalized.includes('delete') || normalized.includes('remove')) return 'action-delete';
	if (normalized.includes('download')) return 'action-export';
	if (normalized.includes('import') || normalized.includes('create')) return 'action-create';
	if (normalized.includes('update') || normalized.includes('validate') || normalized.includes('change')) return 'action-update';
	return 'action-view';
}

function mapActionIcon(action: string | null | undefined): string {
	const normalized = (action ?? '').toLowerCase();
	if (normalized.includes('delete') || normalized.includes('remove')) return 'fas fa-trash';
	if (normalized.includes('download')) return 'fas fa-download';
	if (normalized.includes('import') || normalized.includes('create')) return 'fas fa-plus';
	if (normalized.includes('update') || normalized.includes('validate') || normalized.includes('change')) return 'fas fa-pen';
	return 'fas fa-eye';
}

export function DashboardPage() {
	const auth = useAuthContext();
	const dashboard = useDashboard();
	const summary = dashboard.summary.data;

	const isValidator = summary?.is_validator ?? auth.user?.role === 'validator';
	const pendingResets = Array.isArray(summary?.pending_password_resets) ? summary.pending_password_resets : [];
	const recentFiles = Array.isArray(summary?.recent_files) ? summary.recent_files : [];
	const recentActivity = Array.isArray(summary?.recent_activity) ? summary.recent_activity : [];
	const stats = [
		{ label: 'Files Uploaded', value: summary?.stats.files_uploaded ?? 0, icon: 'fas fa-folder-open' },
		{ label: 'Reports Generated', value: summary?.stats.reports_generated ?? 0, icon: 'fas fa-file-lines' },
		{ label: 'Scenarios Created', value: summary?.stats.scenarios_created ?? 0, icon: 'fas fa-diagram-project' },
		{ label: 'Users Active', value: summary?.stats.users_active ?? 0, icon: 'fas fa-user-check' },
	];

	return (
		<div className="dashboard-page">
			<section className="dashboard-hero">
				<div>
					<h2 className="dashboard-hero-title">Welcome back, {auth.user?.username ?? 'User'}!</h2>
					<p className="dashboard-hero-subtitle">Here&apos;s what&apos;s happening with your log analysis system.</p>
				</div>
				<div className="dashboard-role-chip">
					<i className={`fas ${isValidator ? 'fa-shield-check' : 'fa-user-gear'}`}></i>
					<span>{isValidator ? 'Validator View' : 'Engineer View'}</span>
				</div>
			</section>

			{dashboard.summary.isLoading ? (
				<div className="card dashboard-banner">Loading dashboard summary...</div>
			) : null}

			{dashboard.summary.error ? (
				<div className="card dashboard-banner dashboard-banner-error">
					{(dashboard.summary.error as Error).message}
				</div>
			) : null}

			{isValidator ? (
				<div className="grid grid-cols-4 dashboard-stats-grid">
					{stats.map((item) => (
						<div className="stat-card dashboard-stat-card" key={item.label}>
							<div className="dashboard-stat-icon"><i className={item.icon}></i></div>
							<div className="stat-number">{item.value}</div>
							<div className="stat-label">{item.label}</div>
						</div>
					))}
				</div>
			) : null}

			{isValidator ? (
				<section className="card dashboard-reset-card">
					<div className="card-header">
						<h3 className="card-title"><i className="fas fa-key"></i> Pending Password Reset Requests</h3>
						<NavLink to={routes.users} className="btn btn-secondary">View All</NavLink>
					</div>

					{pendingResets.length === 0 ? (
						<div className="dashboard-empty-state">No pending password reset requests.</div>
					) : null}

					{pendingResets.map((request) => (
						<div key={request.request_id} className="dashboard-reset-item">
							<div className="dashboard-reset-info">
								<div className="dashboard-reset-user">{request.username} ({String(request.role ?? 'unknown').toUpperCase()})</div>
								<div className="dashboard-reset-time">Requested {formatRelativeTime(request.created_at)}</div>
							</div>
							<span className="dashboard-status-pill">PENDING</span>
						</div>
					))}
				</section>
			) : null}

			<section className="dashboard-section">
				<h3 className="dashboard-section-title">Quick Actions</h3>
				<div className="quick-actions">
					<NavLink to={routes.imports} className="quick-action-btn"><div className="quick-action-icon"><i className="fas fa-upload"></i></div><div className="quick-action-text">Upload File</div></NavLink>
					<NavLink to={routes.reports} className="quick-action-btn"><div className="quick-action-icon"><i className="fas fa-file-alt"></i></div><div className="quick-action-text">Generate Report</div></NavLink>
					<NavLink to={routes.scenarios} className="quick-action-btn"><div className="quick-action-icon"><i className="fas fa-plus-circle"></i></div><div className="quick-action-text">Create Scenario</div></NavLink>
					<NavLink to={routes.events} className="quick-action-btn"><div className="quick-action-icon"><i className="fas fa-binoculars"></i></div><div className="quick-action-text">Explore Events</div></NavLink>
				</div>
			</section>

			{isValidator ? (
				<div className="grid grid-cols-2 dashboard-lower-grid">
					<section className="card dashboard-list-card">
						<div className="card-header">
							<h3 className="card-title">Recent Files</h3>
							<NavLink to={routes.imports} className="btn btn-secondary"><i className="fas fa-arrow-right"></i></NavLink>
						</div>
						{recentFiles.length === 0 ? <div className="dashboard-empty-state">No recent files.</div> : null}
						{recentFiles.map((file) => (
							<div key={file.file_id} className="dashboard-list-item">
								<div className="dashboard-list-title">{file.file_name}</div>
								<div className="dashboard-list-subtitle">Uploaded by {file.username} • {formatRelativeTime(file.uploaded_at)}</div>
							</div>
						))}
					</section>

					<section className="card dashboard-list-card">
						<div className="card-header">
							<h3 className="card-title">Recent Activity</h3>
							<NavLink to={routes.audit} className="btn btn-secondary"><i className="fas fa-arrow-right"></i></NavLink>
						</div>
						{recentActivity.length === 0 ? <div className="dashboard-empty-state">No recent activity.</div> : null}
						{recentActivity.map((item) => (
							<div key={item.audit_id} className="dashboard-list-item">
								<span className={`action-badge ${mapActionClass(item.action)}`}>
									<i className={mapActionIcon(item.action)}></i> {mapActionLabel(item.action)}
								</span>
								<span className="dashboard-list-subtitle">{item.username} • {formatRelativeTime(item.timestamp)}</span>
							</div>
						))}
					</section>
				</div>
			) : null}
		</div>
	);
}
