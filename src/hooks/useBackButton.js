import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HOME_ROUTES = ['/', '/login', '/register', '/forgot-password', '/dashboard', '/admin', '/writer'];

export default function useBackButton({ onExitPrompt } = {}) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const exitReady = useRef(false);
  const timerRef  = useRef(null);

  const isHome = location.pathname === '/'; // ✅ ONLY real home

  useEffect(() => {
    if (isHome) {
      window.history.pushState({ _sentinel: true }, '');
    }
  }, [location.pathname, isHome]);

  const handlePop = useCallback(() => {
    if (isHome) {
      if (exitReady.current) {
        window.close();
        return;
      }

      exitReady.current = true;
      onExitPrompt?.();

      window.history.pushState({ _sentinel: true }, '');

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        exitReady.current = false;
      }, 2000);
    } else {
      // ✅ ALWAYS go to main page
      navigate('/', { replace: true });
    }
  }, [isHome, navigate, onExitPrompt]);

  useEffect(() => {
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      clearTimeout(timerRef.current);
    };
  }, [handlePop]);
}
