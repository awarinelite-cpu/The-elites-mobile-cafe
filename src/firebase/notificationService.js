// src/firebase/notificationService.js
// Handles: SW registration, push permission, FCM token, in-app beep

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from './config';
import app from './config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ── Beep sound (base64 short tone — no file needed) ───────
const BEEP_SRC = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA' +
  'EAAQAAwF0AAIA6AAACABAAZGFOYQoGAACBhYqFbF1fdJivrJBhUFBu' +
  'mMPDuZZmV2Wbvs/KtqFkWlFRZpS0zsO4n3NiWVFRapO1zsS6oHZl' +
  'WVIRY5q9z8vDoYtzZFlRU3Ccwc7HsZhzZllSVnGaveHRx7GWbllZVQ==';

let beepAudio = null;
const getBeep = () => {
  if (!beepAudio) {
    beepAudio = new Audio(BEEP_SRC);
    beepAudio.volume = 0.7;
  }
  return beepAudio;
};

export const playBeep = () => {
  try { getBeep().cloneNode().play(); } catch {}
};

// ── Register service worker ────────────────────────────────
export const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('✅ SW registered:', reg.scope);
    return reg;
  } catch (e) {
    console.error('SW registration failed:', e);
    return null;
  }
};

// ── Request push permission + get FCM token ────────────────
export const requestPushPermission = async (userId) => {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    }
    return token;
  } catch (e) {
    console.error('FCM token error:', e);
  }
};

// ── Foreground message handler (app is open) ──────────────
export const onForegroundMessage = (callback) => {
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, payload => {
      playBeep();
      callback(payload);
    });
  } catch { return () => {}; }
};

// ── Realtime Firestore notification listener ───────────────
// Fires playBeep + callback for every new unread notification
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  let initialized = false;
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Only beep on new docs after initial load
    if (initialized) {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          playBeep();
          // Show browser notification if app is in background
          if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
            const data = change.doc.data();
            new Notification(data.title || 'The Elites Mobile Cafe', {
              body: data.body || '',
              icon: '/icons/icon-192.png',
              badge: '/icons/badge-72.png',
              tag:  change.doc.id,
            });
          }
        }
      });
    }
    initialized = true;
    callback(items);
  });
};
