// App.jsx
import { useEffect, useState } from 'react';
import { getAuthToken, getUser } from './utils/storage';
import { useAuth } from './hooks/useAuth';
import { NavigationProvider } from './context/NavigationProvider.jsx';
import { useNavigate, useCurrentPage } from './hooks/useNavigation.js';

import Home from './components/auth/Home';          
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';

const AppContent = () => {
  // const [authPage, setAuthPage] = useState('login');
  const [resetToken, setResetToken] = useState(null);

  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const currentPage = useCurrentPage();

  // Initial routing - UPDATED
  useEffect(() => {
    const token = getAuthToken();
    const user = getUser();

    if (token && user) {
      navigate('dashboard');
    } else {
      navigate('home');
    }
  }, [navigate]);

  // Protect dashboard
  useEffect(() => {
    if (currentPage === 'dashboard' && !isAuthenticated) {
      navigate('home');
    }
  }, [currentPage, isAuthenticated, navigate]);

 const handleSwitchToLogin = () => {
  setResetToken(null);
  navigate('login');
};

  const handleSwitchToRegister = () => navigate('register');
  const handleSwitchToForgotPassword = () => navigate('forgot');

  const handleLogout = () => {
    logout();
    navigate('home');
  };

  return (
    <div className="app">
      {currentPage === 'home' && <Home />}
      
     {currentPage === 'login' && (
  <Login
    onSwitchToRegister={handleSwitchToRegister}
    onSwitchToForgotPassword={handleSwitchToForgotPassword}
  />
)}

{currentPage === 'register' && (
  <Register onSwitchToLogin={handleSwitchToLogin} />
)}

{currentPage === 'forgot' && (
  <ForgotPassword onSwitchToLogin={handleSwitchToLogin} />
)}

{currentPage === 'reset' && resetToken && (
  <ResetPassword
    token={resetToken}
    onResetComplete={handleSwitchToLogin}
  />
)}

      {currentPage === 'dashboard' && <Dashboard onLogout={handleLogout} />}
    </div>
  );
};

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;