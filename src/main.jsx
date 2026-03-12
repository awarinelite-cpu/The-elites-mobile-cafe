// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Register service workers on startup
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // PWA cache SW
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.error('SW error:', err));

    // FCM background messaging SW
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      .then(reg => console.log('✅ FCM SW registered:', reg.scope))
      .catch(err => console.error('FCM SW error:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
