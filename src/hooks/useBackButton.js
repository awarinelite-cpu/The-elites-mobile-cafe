// src/hooks/useBackButton.js
// Handles Android back button:
// - Single press → go to previous page
// - Double press within 2 seconds → exit app

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef(null);
  const toastRef = useRef(null);

  useEffect(() => {
    const handleBackButton = (e) => {
      // If not on home page, just go back
      if (location.pathname !== '/') {
        navigate(-1);
        return;
      }

      // On home page — double press to exit
      const now = Date.now();
      if (lastBackPress.current && now - lastBackPress.current < 2000) {
        // Second press — exit app
        if (toastRef.current) {
          toastRef.current.remove();
        }
        window.history.go(-(window.history.length - 1));
        window.close();
        // For Android PWA
        if (window.navigator && window.navigator.app) {
          window.navigator.app.exitApp();
        }
        return;
      }

      // First press — show toast
      lastBackPress.current = now;
      showExitToast();

      // Auto-clear after 2 seconds
      setTimeout(() => {
        lastBackPress.current = null;
        if (toastRef.current) {
          toastRef.current.style.opacity = '0';
          setTimeout(() => toastRef.current?.remove(), 300);
        }
      }, 2000);
    };

    // Listen for popstate (Android back button in PWA)
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [location.pathname, navigate]);

  const showExitToast = () => {
    // Remove existing toast
    if (toastRef.current) toastRef.current.remove();

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15,23,42,0.92);
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      z-index: 9999;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(13,148,136,0.4);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      transition: opacity 0.3s ease;
      white-space: nowrap;
    `;
    toast.textContent = '⬅ Press back again to exit';
    document.body.appendChild(toast);
    toastRef.current = toast;
  };
}
