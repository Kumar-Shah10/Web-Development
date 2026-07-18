// NavigationProvider.jsx
import { useState, useCallback, useEffect } from 'react';
import { NavigationContext } from '../hooks/useNavigation.js';

export const NavigationProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [params, setParams] = useState({});

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