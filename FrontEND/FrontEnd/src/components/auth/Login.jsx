import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from '../../hooks/useNavigation.js';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import '../styles/login.css';

const Login = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-logo">✦</span>
          <span className="login-brand-name">NoteSphere</span>
        </div>
        <div className="login-tagline">
          <h1>Your thoughts,<br /><em>beautifully kept.</em></h1>
          <p>A quiet place for ideas, drafts, and everything in between.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your notes</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field password-field">
              <div className="login-field-row">
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={onSwitchToForgotPassword} 
                  className="login-forgot"
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="login-switch">
            Don't have an account?{' '}
            <button type="button" onClick={onSwitchToRegister}>
              Create one
            </button>
          </p>

          {/* Back to Home - Placed below "Don't have an account?" */}
          <button 
            onClick={() => navigate('home')} 
            className="back-to-home-btn"
          >
            <FaArrowLeft /> Back to Home
          </button>

        </div>
      </div>
    </div>
  );
};

export default Login;