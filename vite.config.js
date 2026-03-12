// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'inject-sw-env',
        buildStart() {
          const publicDir = resolve(process.cwd(), 'public');

          // Create public/ folder if it doesn't exist
          mkdirSync(publicDir, { recursive: true });

          const swContent = `importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "${env.VITE_FIREBASE_API_KEY}",
  authDomain:        "${env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId:         "${env.VITE_FIREBASE_PROJECT_ID}",
  storageBucket:     "${env.VITE_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId:             "${env.VITE_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Elite Mobile Cafe', {
    body: body || 'You have a new notification',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'elite-notification',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'open', title: '📖 Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
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
});`;

          writeFileSync(resolve(publicDir, 'firebase-messaging-sw.js'), swContent);
        },
      },
    ],
  };
});
