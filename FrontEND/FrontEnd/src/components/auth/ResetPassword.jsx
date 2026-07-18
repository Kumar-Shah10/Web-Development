import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../styles/resetPassword.css';

const ResetPassword = ({ token, onResetComplete }) => {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword, loading } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await resetPassword(token, formData.newPassword);
      setMessage('Password reset successfully! Redirecting to sign in…');
      setTimeout(() => onResetComplete(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="reset-root">
      <div className="reset-left">
        <div className="reset-brand">
          <span className="reset-logo">✦</span>
          <span className="reset-brand-name">NoteSphere</span>
        </div>
        <div className="reset-tagline">
          <h1>Fresh start,<br /><em>same you.</em></h1>
          <p>Choose a new password and get back to your notes.</p>
        </div>
      </div>

      <div className="reset-right">
        <div className="reset-form-wrap">
          <div className="reset-form-header">
            <h2>Set new password</h2>
            <p>Must be at least 6 characters</p>
          </div>

          {error && <div className="reset-error"><span>⚠</span> {error}</div>}
          {message && <div className="reset-success"><span>✓</span> {message}</div>}

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="reset-field">
              <label htmlFor="newPassword">New password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="reset-field">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="reset-submit" disabled={loading || !!message}>
              {loading ? <span className="reset-spinner" /> : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;