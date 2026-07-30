importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "undefined",
  authDomain:        "undefined",
  projectId:         "undefined",
  storageBucket:     "undefined",
  messagingSenderId: "undefined",
  appId:             "undefined",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'The Elites Mobile Cafe', {
    body:     body || 'You have a new notification',
    icon:     icon || '/icons/icon-192.png',
    badge:    '/icons/badge-72.png',
    tag:      'elite-notification',
    renotify: true,
    vibrate:  [200, 100, 200, 100, 200],
    data:     payload.data || {},
    actions: [
      { action: 'open',    title: '📖 Open App' },
      { action: 'dismiss', title: 'Dismiss'     },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});