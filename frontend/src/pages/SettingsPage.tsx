import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { routes } from '../config/routes';
import { changePasswordApi } from '../services/api/auth.api';
import { ApiError } from '../services/api/client';
import { useAuthContext } from '../store/authContext';
import { applyTheme, persistTheme, resolveTheme, getStoredTheme } from '../utils/theme';

function toRoleLabel(role: string | undefined): string {
  if (role === 'validator') {
    return 'VALIDATOR';
  }
  return 'ENGINEER';
}

export function SettingsPage() {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  const updatePassword = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: (response) => {
      setSecurityError(null);
      setSecuritySuccess(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      auth.clearSession();
      navigate(routes.login);
    },
    onError: (error) => {
      setSecuritySuccess(null);
      if (error instanceof ApiError) {
        setSecurityError(error.message);
      } else {
        setSecurityError('Unable to update password. Please try again.');
      }
    }
  });

  useEffect(() => {
    const initial = resolveTheme();
    setDarkModeEnabled(initial === 'dark');
    applyTheme(initial);

    if (!getStoredTheme() && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const onSystemThemeChange = (event: MediaQueryListEvent) => {
        const nextTheme = event.matches ? 'dark' : 'light';
        setDarkModeEnabled(event.matches);
        applyTheme(nextTheme);
      };

      media.addEventListener('change', onSystemThemeChange);
      return () => media.removeEventListener('change', onSystemThemeChange);
    }
  }, []);

  const toggleDarkMode = () => {
    const nextValue = !darkModeEnabled;
    setDarkModeEnabled(nextValue);
    const nextTheme = nextValue ? 'dark' : 'light';
    persistTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const onSubmitPassword = (event: FormEvent) => {
    event.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setSecurityError('Please fill all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }

    updatePassword.mutate({
      current_password: currentPassword,
      new_password: newPassword
    });
  };

  const initials = (auth.user?.username ?? 'U').slice(0, 2).toUpperCase();

  const pageStyles = `
    .settings-container {
      max-width: 800px;
    }

    .settings-section {
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      margin-bottom: var(--spacing-lg);
      overflow: hidden;
    }

    .settings-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
      background-color: rgba(59, 130, 246, 0.05);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .settings-icon {
      font-size: 20px;
      color: var(--color-primary);
      width: 24px;
    }

    .settings-title {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 15px;
    }

    .settings-description {
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .settings-content {
      padding: var(--spacing-lg);
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .setting-row:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }

    .setting-description {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .toggle-switch {
      position: relative;
      width: 50px;
      height: 26px;
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: 13px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .toggle-switch.active {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background-color: white;
      top: 2px;
      left: 2px;
      transition: left 0.3s;
    }

    .toggle-switch.active::after {
      left: 26px;
    }

    .profile-avatar-section {
      text-align: center;
      padding: var(--spacing-lg) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 32px;
      margin: 0 auto var(--spacing-md);
    }

    .profile-name {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 16px;
      margin-bottom: 4px;
    }

    .profile-role {
      display: inline-block;
      padding: 4px 8px;
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .input-field {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-text-primary);
      font-size: 14px;
      margin-top: 6px;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .input-group {
      margin-bottom: var(--spacing-lg);
    }

    .input-label {
      display: block;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 6px;
      font-size: 13px;
    }

    .button-group {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Settings</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage your account and application preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <div className="settings-header">
            <span className="settings-icon">
              <i className="fas fa-user"></i>
            </span>
            <div>
              <div className="settings-title">Profile Information</div>
              <div className="settings-description">Update your personal and contact information</div>
            </div>
          </div>

          <div className="settings-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-name">{auth.user?.username ?? 'User'}</div>
              <div className="profile-role">
                <i className="fas fa-shield-alt"></i> {toRoleLabel(auth.user?.role)}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-header">
            <span className="settings-icon">
              <i className="fas fa-sliders-h"></i>
            </span>
            <div>
              <div className="settings-title">Preferences</div>
              <div className="settings-description">Customize your application experience</div>
            </div>
          </div>

          <div className="settings-content">
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Dark Mode</div>
                <div className="setting-description">Use dark theme throughout the application</div>
              </div>
              <button
                type="button"
                aria-label="Toggle dark mode"
                className={`toggle-switch ${darkModeEnabled ? 'active' : ''}`}
                onClick={toggleDarkMode}
              ></button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-header">
            <span className="settings-icon">
              <i className="fas fa-lock"></i>
            </span>
            <div>
              <div className="settings-title">Security Settings</div>
              <div className="settings-description">Manage your password and authentication</div>
            </div>
          </div>

          <form className="settings-content" onSubmit={onSubmitPassword}>
            <div className="input-group">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {securityError ? (
              <div style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-md)', fontSize: 13 }}>{securityError}</div>
            ) : null}
            {securitySuccess ? (
              <div style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)', fontSize: 13 }}>{securitySuccess}</div>
            ) : null}

            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', padding: 'var(--spacing-md)', borderRadius: 4, borderLeft: '3px solid var(--color-success)', marginBottom: 'var(--spacing-lg)' }}>
              <p style={{ color: 'var(--color-success)', margin: 0, fontSize: 12 }}>
                <i className="fas fa-check-circle"></i> Password changes are applied immediately.
              </p>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setSecurityError(null);
                  setSecuritySuccess(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
