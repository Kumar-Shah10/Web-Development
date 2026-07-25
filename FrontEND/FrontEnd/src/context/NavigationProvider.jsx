// NavigationProvider.jsx
import { useState, useCallback, useEffect } from 'react';
import { NavigationContext } from '../hooks/useNavigation.js';

export const NavigationProvider = ({ children }) => {
 const getInitialRoute = () => {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);

  if (path === '/') {
    return { page: 'home', params: {} };
  }

  if (path === '/login') {
    return { page: 'login', params: {} };
  }

  if (path === '/register') {
    return { page: 'register', params: {} };
  }

  if (path === '/forgot') {
    return { page: 'forgot', params: {} };
  }

  if (path === '/reset-password') {
    return {
      page: 'reset',
      params: {
        token: search.get('token'),
      },
    };
  }

  if (path.startsWith('/dashboard')) {
    const tab = path.split('/')[2] || 'home';
    return {
      page: 'dashboard',
      params: { tab },
    };
  }

  return { page: 'home', params: {} };
};

const initialRoute = getInitialRoute();

const [currentPage, setCurrentPage] = useState(initialRoute.page);
const [params, setParams] = useState(initialRoute.params);

  const navigate = useCallback((page, pageParams = {}) => {
    setCurrentPage(page);
    setParams(pageParams);
    
    // Update browser URL
   let url = '/';

if (page !== 'home') {
  url = `/${page}`;
}

if (page === 'dashboard') {
  url = pageParams.tab
    ? `/dashboard/${pageParams.tab}`
    : '/dashboard';
}
    
    window.history.pushState({ page, ...pageParams }, '', url);
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const page = event.state?.page || 'home';
      const tab = event.state?.tab || null;
      
      setCurrentPage(page);
      if (tab) {
        setParams({ tab });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentPage, navigate, params }}>
      {children}
    </NavigationContext.Provider>
  );
};