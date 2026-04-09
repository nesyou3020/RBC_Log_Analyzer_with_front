import { FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { submitPasswordResetRequestApi } from '../services/api/auth.api';
import { ApiError } from '../services/api/client';
import appLogo from '../../logo/logo.png';

export function LoginPage() {
  const { login, asMessage } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [resetUsername, setResetUsername] = useState('');
  const [resetRole, setResetRole] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: submitPasswordResetRequestApi,
    onSuccess: () => {
      setForgotError(null);
      setForgotSuccess(true);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setForgotError('This user and role combination was not found in the database.');
        } else if (error.status === 409) {
          setForgotError('A password reset request is already pending for this user.');
        } else {
          setForgotError(error.message);
        }
      } else {
        setForgotError('An unexpected error occurred. Please try again.');
      }
    }
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setValidationError('Username and password are required');
      return;
    }

    setValidationError(null);
    login.mutate({ username, password, rememberMe });
  };

  const openForgotPasswordModal = () => {
    setForgotOpen(true);
    setForgotSuccess(false);
    setForgotError(null);
    setResetUsername('');
    setResetRole('');
    setResetPassword('');
    setResetPasswordConfirm('');
  };

  const closeForgotPasswordModal = () => {
    setForgotOpen(false);
  };

  const handlePasswordReset = (event: FormEvent) => {
    event.preventDefault();

    if (!resetUsername.trim() || !resetRole.trim() || !resetPassword.trim() || !resetPasswordConfirm.trim()) {
      setForgotError('Please fill all fields.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setForgotError('Passwords do not match. Please try again.');
      return;
    }

    if (resetPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }

    // Submit to backend
    setForgotError(null);
    passwordResetMutation.mutate({
      username: resetUsername,
      role: resetRole,
      new_password: resetPassword
    });
  };

  const pageStyles = `
    .remember-me {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .remember-me input {
      cursor: pointer;
    }

    .login-links {
      background: none;
      border: none;
      color: var(--color-primary);
      text-decoration: none;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      padding: 0;
    }

    .login-links:hover {
      text-decoration: underline;
    }

    .success-icon {
      font-size: 48px;
      color: var(--color-success);
      margin-bottom: var(--spacing-md);
      text-align: center;
    }

    .success-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-success);
      margin-bottom: var(--spacing-sm);
      text-align: center;
    }

    .success-message {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
      line-height: 1.5;
      text-align: center;
    }

    .notification-box {
      background: rgba(16, 185, 129, 0.12);
      border-left: 4px solid var(--color-success);
      padding: var(--spacing-md);
      border-radius: 4px;
      margin-bottom: var(--spacing-lg);
      font-size: 13px;
      color: var(--color-text-primary);
    }

    .form-note {
      background: var(--color-bg-tertiary);
      border-left: 4px solid var(--color-warning);
      padding: var(--spacing-md);
      border-radius: 4px;
      margin-bottom: var(--spacing-lg);
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .auth-error {
      margin-top: var(--spacing-sm);
      color: var(--color-error);
      font-size: 13px;
      line-height: 1.4;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div className="layout login">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <img
                  src={appLogo}
                  alt="ERTMS ETCS logo"
                  style={{ width: 128, height: 128, objectFit: 'contain' }}
                />
              </div>
              <h1 className="login-title">ERTMS/ETCS</h1>
              <p className="login-subtitle">RBC Log Analyzer</p>
            </div>

            <form className="login-form" onSubmit={onSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>

              <button type="submit" className="btn btn-primary" disabled={login.isPending}>
                <i className="fas fa-sign-in-alt"></i>
                <span>{login.isPending ? 'Signing in...' : 'Login'}</span>
              </button>
            </form>

            {validationError ? <div className="auth-error">{validationError}</div> : null}
            {login.error ? <div className="auth-error">{asMessage(login.error)}</div> : null}

            <div className="login-footer" style={{ display: 'flex', justifyContent: 'flex-start', fontSize: 13, marginTop: 'var(--spacing-md)' }}>
              <button type="button" className="login-links" onClick={openForgotPasswordModal}>
                Forgot password?
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              © 2026 to check later ( All rights reserved.) ?????????
            </div>
          </div>
        </div>
      </div>

      <div className={`modal ${forgotOpen ? 'active' : ''}`} onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeForgotPasswordModal();
        }
      }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Request Password Reset</h2>
            <button type="button" className="modal-close" onClick={closeForgotPasswordModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {forgotSuccess ? (
            <div>
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="success-title">Request Submitted!</div>
              <div className="success-message">
                Your password reset request has been sent to the administrator for review and approval.
              </div>
              <div className="notification-box">
                <i className="fas fa-hourglass-half" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                <strong>Pending Approval:</strong> Once the admin approves your request, you can login with your new password.
              </div>
              <button type="button" className="btn btn-primary" onClick={closeForgotPasswordModal}>
                Back to Login
              </button>
            </div>
          ) : (
            <form className="modal-form" onSubmit={handlePasswordReset}>
              <div className="modal-body">
                <div className="form-note">
                  <i className="fas fa-info-circle" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Provide your username, role, and your desired new password. <strong>System will verify your username exists in database.</strong> Admin will review and approve your request.
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-user" style={{ marginRight: 6 }}></i>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-shield-alt" style={{ marginRight: 6 }}></i>
                    Your Role
                  </label>
                  <select
                    value={resetRole}
                    onChange={(e) => setResetRole(e.target.value)}
                    required
                    style={{ width: '100%', padding: 10, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
                  >
                    <option value="">Select your role...</option>
                    <option value="validator">VALIDATOR (Admin)</option>
                    <option value="engineer">ENGINEER (Standard User)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-lock" style={{ marginRight: 6 }}></i>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your desired new password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <small style={{ color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                    Minimum 8 characters
                  </small>
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-lock" style={{ marginRight: 6 }}></i>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={resetPasswordConfirm}
                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {forgotError ? <div className="auth-error">{forgotError}</div> : null}
              </div>

              <div className="modal-footer" style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={passwordResetMutation.isPending}>
                  <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>
                  {passwordResetMutation.isPending ? 'Sending...' : 'Send Request to Admin'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeForgotPasswordModal} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
