// src/hooks/usePWA.js
// Handles:
//   1. Lock pull-to-refresh (overscroll)
//   2. Back button → navigate to previous page
//   3. Double-back on home page → "press again to exit" toast, then logout+close
//   4. Registers service worker on mount

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { registerSW } from '../firebase/notificationService';

const HOME_ROUTES = ['/', '/dashboard', '/writer', '/admin'];

export default function usePWA({ onExit } = {}) {
  const navigate       = useNavigate();
  const location       = useLocation();
  const backPressedRef = useRef(false);
  const toastRef       = useRef(null);

  // ── 1. Lock pull-to-refresh ──────────────────────────────
  useEffect(() => {
    // Prevent overscroll/pull-to-refresh on the body
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    // Block touchmove that would trigger PTR (when already at top)
    let startY = 0;
    const onTouchStart = e => { startY = e.touches[0].clientY; };
    const onTouchMove = e => {
      const dy = e.touches[0].clientY - startY;
      if (dy > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // ── 2 & 3. Back button + double-back exit ─────────────────
  useEffect(() => {
    // Push a dummy state so popstate fires on back press
    window.history.pushState({ pwa: true }, '');

    const handlePopState = (e) => {
      const isHomePage = HOME_ROUTES.includes(location.pathname);

      if (!isHomePage) {
        // Normal back — go to previous page
        navigate(-1);
        // Re-push so next back press is also caught
        setTimeout(() => window.history.pushState({ pwa: true }, ''), 50);
        return;
      }

      // On home page — double-back to exit
      if (backPressedRef.current) {
        // Second press — exit
        clearTimeout(toastRef.current);
        if (onExit) onExit();
        return;
      }

      // First press — show toast
      backPressedRef.current = true;
      showExitToast();
      window.history.pushState({ pwa: true }, ''); // block the back

      toastRef.current = setTimeout(() => {
        backPressedRef.current = false;
        hideExitToast();
      }, 2500);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate, onExit]);

  // ── 4. Register service worker ────────────────────────────
  useEffect(() => { registerSW(); }, []);
}

// ── Exit toast DOM helpers ────────────────────────────────
let exitToastEl = null;

function showExitToast() {
  if (exitToastEl) return;
  exitToastEl = document.createElement('div');
  exitToastEl.id = 'pwa-exit-toast';
  exitToastEl.textContent = 'Press back again to exit';
  Object.assign(exitToastEl.style, {
    position:     'fixed',
    bottom:       '32px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   'rgba(15,23,42,0.95)',
    color:        '#fff',
    padding:      '12px 24px',
    borderRadius: '24px',
    fontSize:     '14px',
    fontWeight:   '600',
    zIndex:       '99999',
    backdropFilter: 'blur(10px)',
    border:       '1px solid rgba(201,168,76,0.4)',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
    whiteSpace:   'nowrap',
    fontFamily:   'system-ui, sans-serif',
    animation:    'pwa-toast-in 0.2s ease',
  });

  // Inject animation keyframes once
  if (!document.getElementById('pwa-toast-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-toast-style';
    style.textContent = `
      @keyframes pwa-toast-in {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(exitToastEl);
}

function hideExitToast() {
  if (exitToastEl) {
    exitToastEl.remove();
    exitToastEl = null;
  }
}
