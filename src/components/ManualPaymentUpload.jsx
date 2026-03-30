// src/components/ManualPaymentUpload.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Receipt is sent directly to admin via a Firestore notification (file
// embedded as base64). Nothing is stored on the order document until the
// admin confirms, which sets paymentStatus on the order doc.
//
// Props:
//   order        — full serviceRequest document { id, agreedPrice,
//                  paymentStatus, serviceTitle, name, ... }
//   paymentStage — 'advance' | 'final'
//   onDone       — optional callback after successful send
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const btn = (bg, color = '#fff', extra = {}) => ({
  background: bg, color, border: 'none', borderRadius: 10, padding: '11px 18px',
  cursor: 'pointer', fontSize: 14, fontWeight: 700,
  fontFamily: "'Times New Roman', Georgia, serif",
  transition: 'all 0.2s', ...extra,
});

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/* ── component ───────────────────────────────────────────────────────────── */
export default function ManualPaymentUpload({ order, paymentStage = 'advance', onDone }) {
  const { user, profile } = useAuth();

  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null); // data-URL for images only
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const currentStatus  = order?.paymentStatus || '';
  const stageConfirmed = currentStatus === `${paymentStage}_confirmed`;
  const stagePending   = currentStatus === `${paymentStage}_receipt_pending`;

  /* ── pick file ─────────────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_SIZE) {
      setError(`File too large (${formatSize(f.size)}). Maximum size is 5 MB.`);
      return;
    }

    setError('');
    setFile(f);
    setSent(false);

    // Show preview for images only
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  /* ── send receipt directly to admin via notification ───────────────────── */
  const handleSend = async () => {
    if (!file) { setError('Please select your receipt file first.'); return; }
    setSending(true);
    setError('');

    try {
      // Read file as base64 to embed in the notification document
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror   = reject;
        reader.readAsDataURL(file);
      });

      const clientName = profile?.name || user?.displayName || 'Client';
      const orderTitle = order.serviceTitle || order.topicTitle || order.serviceKey || 'Order';
      const stageLabel = paymentStage === 'advance' ? '50% Advance' : '50% Final Balance';
      const amount     = order.agreedPrice || order.totalAmount;

      // Send receipt embedded inside a notification — does NOT touch the order doc yet
      await addDoc(collection(db, 'notifications'), {
        userId:       'admin',
        type:         'payment_receipt',
        paymentStage,
        orderId:      order.id,
        clientId:     user?.uid || null,
        clientName,
        orderTitle,
        title:        `🧾 Payment Receipt — ${stageLabel}`,
        body:         `${clientName} sent a receipt for "${orderTitle}" (${stageLabel}${amount ? ` · ₦${Number(amount).toLocaleString()}` : ''}).`,
        receiptData:  fileData,
        receiptName:  file.name,
        receiptSize:  file.size,
        receiptType:  file.type,
        read:         false,
        confirmed:    false,
        createdAt:    serverTimestamp(),
      });

      // Mark order as receipt pending so client sees the waiting state
      await updateDoc(doc(db, 'serviceRequests', order.id), {
        paymentStatus: `${paymentStage}_receipt_pending`,
        updatedAt:     serverTimestamp(),
      });

      setSent(true);
      setFile(null);
      setPreview(null);
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      setError('Failed to send receipt: ' + (err?.message || 'Please try again.'));
    } finally {
      setSending(false);
    }
  };

  /* ── already confirmed by admin ────────────────────────────────────────── */
  if (stageConfirmed) {
    return (
      <div style={{
        background: 'rgba(22,163,74,0.10)', border: '1.5px solid rgba(22,163,74,0.35)',
        borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, color: '#16A34A', fontSize: 15 }}>
            {paymentStage === 'advance' ? 'Advance Payment Confirmed!' : 'Final Payment Confirmed!'}
          </div>
          <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>
            {paymentStage === 'advance'
              ? 'Your advance has been verified. Work will begin shortly.'
              : 'Your order is fully paid. You can now download the completed work.'}
          </div>
        </div>
      </div>
    );
  }

  /* ── receipt sent — waiting for admin to confirm ───────────────────────── */
  if (stagePending || sent) {
    return (
      <div style={{ borderRadius: 12, border: '1.5px solid rgba(245,158,11,0.40)', overflow: 'hidden' }}>
        <div style={{
          background: 'rgba(245,158,11,0.12)', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#D97706', fontSize: 14 }}>
              Receipt sent — awaiting admin confirmation
            </div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 3 }}>
              Admin has received your receipt and will confirm your payment shortly.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── upload form ───────────────────────────────────────────────────────── */
  return (
    <div style={{ borderRadius: 12, border: '1.5px solid var(--border, #e2e8f0)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#172554,#0D9488)', padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
          💳 Pay Manually — {paymentStage === 'advance' ? '50% Advance' : '50% Final Balance'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
          Transfer to our account, then send your receipt below.
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: 'var(--bg-card, #fff)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Bank details */}
        <div style={{
          background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
            Bank Account Details
          </div>
          {[
            ['Bank',         'Opay / GTBank'],
            ['Account No.',  '8012345678'],
            ['Account Name', 'Elite Mobile Cafe'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
              <span style={{ color: '#1e293b', fontWeight: 700 }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, color: '#D97706', fontWeight: 600 }}>
            ⚠️ Use your name as payment description so we can identify your transfer.
          </div>
        </div>

        {/* File picker */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Upload Receipt
          </div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${file ? 'rgba(13,148,136,0.55)' : 'var(--border, #cbd5e1)'}`,
            borderRadius: 10, padding: '22px 12px',
            cursor: 'pointer',
            background: file ? 'rgba(13,148,136,0.04)' : 'var(--bg-tertiary, #f8fafc)',
            gap: 7, transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 32 }}>
              {file ? (file.type.startsWith('image/') ? '🖼️' : '📄') : '🧾'}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, textAlign: 'center',
              color: file ? '#0D9488' : 'var(--text-secondary, #475569)',
              wordBreak: 'break-word', maxWidth: '90%',
            }}>
              {file ? file.name : 'Tap to select receipt'}
            </span>
            {file
              ? <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>{formatSize(file.size)}</span>
              : <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>JPG · PNG · PDF and more · max 5 MB</span>
            }
            <input
              type="file"
              accept="image/*,application/pdf,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Image preview */}
        {preview && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: 6, textTransform: 'uppercase' }}>
              Preview
            </div>
            <img
              src={preview}
              alt="Receipt preview"
              style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border, #e2e8f0)' }}
            />
          </div>
        )}

        {/* Non-image file info */}
        {file && !preview && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <span style={{ fontSize: 28 }}>📎</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #0f172a)', wordBreak: 'break-word' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                {formatSize(file.size)} · Ready to send
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {file && (
            <button
              style={{ ...btn('#0D9488'), flex: 1, opacity: sending ? 0.7 : 1 }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff',
                    borderRadius: '50%', animation: 'mpuSpin 0.8s linear infinite',
                    verticalAlign: 'middle', marginRight: 6,
                  }} />
                  Sending…
                </>
              ) : '📤 Send Receipt to Admin'}
            </button>
          )}
          {file && (
            <button
              style={{ ...btn('#64748b', '#fff', { padding: '11px 14px' }) }}
              onClick={() => { setFile(null); setPreview(null); setError(''); }}
              disabled={sending}
            >
              ✕
            </button>
          )}
        </div>

        {!file && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
            After sending, admin will review your receipt and confirm your payment.
          </p>
        )}
      </div>

      <style>{`@keyframes mpuSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
