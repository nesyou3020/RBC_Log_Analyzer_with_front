import { useEffect, useState, type MouseEvent } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../config/routes';
import { useAuth } from '../hooks/useAuth';
import { applyTheme, persistTheme, resolveTheme } from '../utils/theme';
import appLogo from '../../logo/logo.png';

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveTheme());

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  const hideNavbarSearch = location.pathname.startsWith(routes.events);

  const doLogout = (event: MouseEvent) => {
    event.preventDefault();
    logout.mutate();
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img
            src={appLogo}
            alt="ERTMS ETCS logo"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
          />
          <span>ERTMS/ETCS Analyzer</span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink to={routes.dashboard} className={navClass}>
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.imports} className={navClass}>
              <i className="fas fa-folder"></i>
              <span>Import Files</span>
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.events} className={navClass}>
              <i className="fas fa-search"></i>
              <span>Events</span>
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.scenarios} className={navClass}>
              <i className="fas fa-list"></i>
              <span>Scenarios</span>
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.reports} className={navClass}>
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </NavLink>
          </li>

          <li style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div className="sidebar-section-title">Admin</div>
          </li>
          <li>
            <NavLink to={routes.users} className={navClass}>
              <i className="fas fa-users"></i>
              <span>Users</span>
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.audit} className={navClass}>
              <i className="fas fa-history"></i>
              <span>Audit Logs</span>
            </NavLink>
          </li>

          <li style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
            <NavLink to={routes.settings} className={navClass}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </NavLink>
          </li>
          <li>
            <a href="#" onClick={doLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      <div className="main-container">
        <header className="navbar app-navbar">
          <div className="navbar-left app-navbar-left">
            <div className="navbar-breadcrumb app-breadcrumb">
              <NavLink to={routes.dashboard}>Dashboard</NavLink>
              <span>/</span>
              <span>Workspace</span>
            </div>
          </div>

          <div className="navbar-right app-navbar-right">
            {!hideNavbarSearch ? (
              <div className="navbar-search app-search">
                <input type="text" placeholder="Search..." />
              </div>
            ) : null}

            <div className="navbar-icons app-actions">
              <button
                type="button"
                className="theme-switch"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <span className={`theme-switch-thumb ${theme === 'light' ? 'is-light' : 'is-dark'}`}></span>
                <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
              <i className="fas fa-bell navbar-icon"></i>
              <i className="fas fa-question-circle navbar-icon"></i>
            </div>

            <div className="navbar-user app-user">
              <div className="navbar-user-avatar">{(user?.username ?? 'U').slice(0, 2).toUpperCase()}</div>
              <span className="app-user-name">{user?.username ?? 'User'}</span>
            </div>
          </div>
        </header>

        <main className="content app-content">
          <Outlet />
        </main>

        <footer className="footer app-footer">
          <span>v1.0.0</span>
          <span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Help &amp; Support
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
