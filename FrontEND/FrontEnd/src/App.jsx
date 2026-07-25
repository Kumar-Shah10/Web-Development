// App.jsx
import { useEffect } from 'react';
import { getAuthToken, getUser } from './utils/storage';
import { useAuth } from './hooks/useAuth';
import { NavigationProvider } from './context/NavigationProvider.jsx';
import { useNavigate, useCurrentPage, useParams } from './hooks/useNavigation.js';
import Home from './components/auth/Home';          
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';

const AppContent = () => {
  // const [authPage, setAuthPage] = useState('login');
  

  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const currentPage = useCurrentPage();
  const params = useParams();

  // Initial routing
useEffect(() => {
  const path = window.location.pathname;

  // If user opened a special page directly, don't redirect
  if (
    path === '/reset-password' ||
    path === '/login' ||
    path === '/register' ||
    path === '/forgot'
  ) {
    return;
  }

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

{currentPage === 'reset' && (
  <ResetPassword
    token={params.token}
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