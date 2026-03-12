// src/hooks/useNotifications.js
// Sets up Firebase Cloud Messaging for push notifications
// Plays a beep alarm when notification arrives

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// ── Beep Sound Generator ────────────────────────────────────
export function playBeep(type = 'notification') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (type === 'notification') {
      // Pleasant double-beep
      [0, 0.2].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + delay + 0.08);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      });
    }

    if (type === 'message') {
      // Soft ping for chat messages
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }

    if (type === 'alert') {
      // Urgent triple beep for status updates
      [0, 0.18, 0.36].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1400;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
      });
    }
  } catch (err) {
    console.log('Audio not available:', err);
  }
}

// ── In-App Toast Notification ───────────────────────────────
export function showInAppNotification({ title, body, type = 'notification' }) {
  playBeep(type);

  const existing = document.getElementById('elite-notification');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'elite-notification';

  const icons = {
    notification: '🔔',
    message: '💬',
    alert: '⚡',
  };

  el.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:1.4rem;flex-shrink:0">${icons[type] || '🔔'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px;color:#fff;margin-bottom:3px;
          font-family:'DM Sans',sans-serif;line-height:1.3">${title}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.78);
          font-family:'DM Sans',sans-serif;line-height:1.4;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${body}</div>
      </div>
      <button onclick="this.closest('#elite-notification').remove()"
        style="background:none;border:none;color:rgba(255,255,255,0.5);
        cursor:pointer;font-size:18px;line-height:1;padding:0;flex-shrink:0">×</button>
    </div>
    <div id="elite-notif-bar" style="position:absolute;bottom:0;left:0;height:3px;
      background:linear-gradient(90deg,#0D9488,#F59E0B);border-radius:0 0 12px 12px;
      width:100%;animation:shrink 4s linear forwards"></div>
  `;

  el.style.cssText = `
    position: fixed;
    top: 76px;
    right: 16px;
    left: 16px;
    max-width: 380px;
    margin: 0 auto;
    background: rgba(15,23,42,0.95);
    border: 1px solid rgba(13,148,136,0.5);
    border-radius: 14px;
    padding: 16px;
    z-index: 9999;
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(13,148,136,0.2);
    animation: slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
    overflow: hidden;
    cursor: pointer;
  `;

  // Add CSS animations
  if (!document.getElementById('notif-style')) {
    const style = document.createElement('style');
    style.id = 'notif-style';
    style.textContent = `
      @keyframes slideIn {
        from { opacity:0; transform:translateY(-20px) scale(0.95); }
        to   { opacity:1; transform:translateY(0) scale(1); }
      }
      @keyframes shrink {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(el);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (el.parentNode) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }
  }, 4000);
}

// ── Main Hook ───────────────────────────────────────────────
export default function useNotifications(userId) {
  useEffect(() => {
    if (!userId) return;

    let messaging;
    try {
      messaging = getMessaging();
    } catch {
      console.log('FCM not supported in this environment');
      return;
    }

    // Request permission & get FCM token
    const setupFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token && userId) {
          // Save token to user's Firestore doc
          await updateDoc(doc(db, 'users', userId), {
            fcmToken: token,
            notificationsEnabled: true,
          });
        }
      } catch (err) {
        console.log('FCM setup error:', err);
      }
    };

    setupFCM();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      const type = payload.data?.type || 'notification';
      showInAppNotification({ title: title || 'Elite Mobile Cafe', body: body || '', type });
    });

    return () => unsubscribe();
  }, [userId]);
}
