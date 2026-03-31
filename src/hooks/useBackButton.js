// src/hooks/useBackButton.js
// Intercepts the hardware/browser back button for the PWA.
// - Pushes a sentinel history entry on every route change so
//   the back button fires popstate instead of leaving the app.
// - On back press from a non-home page → navigate(-1) in React Router.
// - On back press from home / login / register → show exit prompt;
//   a second press within 3 s exits the app.

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// "Dead-end" routes: back here should prompt exit, not navigate backwards.
// /dashboard, /admin, /writer are included because going back from them
// leads to /login — not a useful navigation target.
const HOME_ROUTES = ['/', '/login', '/register', '/forgot-password', '/dashboard', '/admin', '/writer'];

export default function useBackButton({ onExitPrompt } = {}) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const exitReady = useRef(false);
  const timerRef  = useRef(null);

  const isHome = HOME_ROUTES.includes(location.pathname);

  // Push a sentinel state only on home/exit routes so the next popstate is ours to intercept.
  // Non-home routes (e.g. /dashboard) must NOT get an extra sentinel — that would
  // require two back presses to actually navigate back.
  useEffect(() => {
    if (isHome) {
      window.history.pushState({ _sentinel: true }, '');
    }
  }, [location.pathname, isHome]);

  const handlePop = useCallback(() => {
    if (isHome) {
      if (exitReady.current) {
        // Second press — exit
        window.history.go(-1);
        window.close();
        return;
      }
      // First press — warn user
      exitReady.current = true;
      onExitPrompt?.();
      // Re-push so the next popstate fires again
      window.history.pushState({ _sentinel: true }, '');
      // Auto-reset after 3 s
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        exitReady.current = false;
      }, 3000);
    } else {
      navigate(-1);
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
