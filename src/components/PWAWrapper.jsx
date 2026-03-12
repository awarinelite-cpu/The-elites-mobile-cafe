// src/components/PWAWrapper.jsx
// Wrap your <Routes> with this component inside App.jsx
// It activates pull-to-refresh lock, back button handling, and double-back exit

import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/authService';
import usePWA from '../hooks/usePWA';

export default function PWAWrapper({ children }) {
  const { user } = useAuth();

  const handleExit = async () => {
    // Double-back on home: log out then close (PWA) or do nothing (browser)
    if (user) {
      try { await logoutUser(); } catch {}
    }
    // Try to close the PWA window
    if (window.matchMedia('(display-mode: standalone)').matches) {
      window.close();
    }
  };

  usePWA({ onExit: handleExit });

  return children;
}
