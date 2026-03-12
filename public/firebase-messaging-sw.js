// public/firebase-messaging-sw.js
// This file MUST be in the public/ folder (root of deployed site)
// Handles push notifications when app is in background or closed

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ── Paste your Firebase config here ────────────────────────
// Get it from Firebase Console → Project Settings → Your apps
firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Elite Mobile Cafe', {
    body: body || 'You have a new notification',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'elite-notification',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200], // Vibration pattern
    data: payload.data || {},
    actions: [
      { action: 'open', title: '📖 Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/dashboard');
    })
  );
});
