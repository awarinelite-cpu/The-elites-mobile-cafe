// src/components/ManualPaymentUpload.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop this component into your order detail card in DashboardPage.
//
// Props:
//   order        — the full serviceRequest document object  { id, agreedPrice,
//                  paymentStatus, advancePayment, finalPayment, ... }
//   paymentStage — 'advance' | 'final'
//   onDone       — optional callback after successful upload
//
// Firestore fields written on the order doc:
//   manualReceipt_advance      : { receiptData, detectedAmount, status, uploadedAt }
//   manualReceipt_final        : { receiptData, detectedAmount, status, uploadedAt }
//   paymentStatus              : 'advance_receipt_pending' | 'advance_confirmed'
//                                'final_receipt_pending'   | 'final_confirmed' | ...
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

/* ── tiny inline styles ─────────────────────────────────────────────────── */
const btn = (bg, color = '#fff', extra = {}) => ({
  background: bg, color, border: 'none', borderRadius: 10, padding: '11px 18px',
  cursor: 'pointer', fontSize: 14, fontWeight: 700,
  fontFamily: "'Times New Roman', Georgia, serif",
  transition: 'all 0.2s', ...extra,
});

const STATUS_UI = {
  not_set:                  null,
  advance_receipt_pending:  { color: '#D97706', bg: 'rgba(245,158,11,0.10)', icon: '⏳', text: 'Payment amount confirmed — awaiting admin confirmation' },
  advance_confirmed:        { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  icon: '✅', text: 'Advance payment confirmed!' },
  final_receipt_pending:    { color: '#D97706', bg: 'rgba(245,158,11,0.10)', icon: '⏳', text: 'Final payment amount confirmed — awaiting admin confirmation' },
  final_confirmed:          { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  icon: '✅', text: 'Final payment confirmed! Your order is fully paid.' },
};

export default function ManualPaymentUpload({ order, paymentStage = 'advance', onDone }) {
  const { user } = useAuth();
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected]   = useState(null);   // { amount, confidence, raw }
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  const receiptKey   = `manualReceipt_${paymentStage}`;
  const storedReceipt = order?.[receiptKey];
  const currentStatus = order?.paymentStatus || 'not_set';

  // Determine if this stage is already handled
  const stageConfirmed  = currentStatus === `${paymentStage}_confirmed`;
  const stagePending    = currentStatus === `${paymentStage}_receipt_pending`;
  const statusInfo      = STATUS_UI[currentStatus];

  // ── Pick file & preview ────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please upload an image (JPG, PNG, etc.)'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setError('');
    setFile(f);
    setDetected(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  // ── AI amount detection via Anthropic API ────────────────────────────
  const detectAmount = async (base64Data) => {
    setDetecting(true);
    setError('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.type,
                  data: base64Data.split(',')[1],
                },
              },
              {
                type: 'text',
                text: `This is a bank payment receipt or transfer screenshot. 
Extract the AMOUNT PAID (the money sent/transferred).
Respond ONLY with a valid JSON object — no markdown, no explanation:
{"amount": 20000, "currency": "NGN", "confidence": "high", "raw": "₦20,000"}

Rules:
- amount must be a plain number (no commas, no symbols)
- confidence: "high" | "medium" | "low"
- raw: exactly as shown on the receipt
- If you cannot find an amount, return: {"amount": null, "currency": null, "confidence": "low", "raw": "not found"}`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setDetected(parsed);
      return parsed;
    } catch (err) {
      console.error('AI detection error:', err);
      setError('Could not auto-detect amount. You can still submit — admin will verify.');
      setDetected({ amount: null, confidence: 'low', raw: 'not detected' });
      return null;
    } finally {
      setDetecting(false);
    }
  };

  // ── Analyse button ─────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!preview) return;
    await detectAmount(preview);
  };

  // ── Submit receipt to Firestore ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!preview) { setError('Please select a receipt image first.'); return; }
    if (!detected)  { setError('Please click "Detect Amount" before submitting.'); return; }

    setUploading(true);
    setError('');
    try {
      const newStatus = `${paymentStage}_receipt_pending`;
      const receiptPayload = {
        receiptData:     preview,
        detectedAmount:  detected?.amount  || null,
        detectedRaw:     detected?.raw     || '',
        confidence:      detected?.confidence || 'low',
        uploadedAt:      new Date().toISOString(),
        clientId:        user?.uid || null,
        stage:           paymentStage,
        status:          'pending_admin_confirmation',
      };

      await updateDoc(doc(db, 'serviceRequests', order.id), {
        [receiptKey]:  receiptPayload,
        paymentStatus: newStatus,
        updatedAt:     serverTimestamp(),
      });

      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        userId:    'admin',
        title:     '🧾 Manual Payment Receipt Uploaded',
        body:      `${order.name || 'Client'} uploaded a ${paymentStage} payment receipt for "${order.serviceTitle || 'order'}". Detected: ${detected?.raw || 'unknown'}`,
        type:      'payment_receipt',
        orderId:   order.id,
        read:      false,
        createdAt: serverTimestamp(),
      });

      setFile(null);
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      setError('Failed to submit receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  // Already confirmed — show success banner only
  if (stageConfirmed) {
    return (
      <div style={{ background: 'rgba(22,163,74,0.10)', border: '1.5px solid rgba(22,163,74,0.35)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>✅</span>
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

  // Receipt uploaded — waiting for admin
  if (stagePending && storedReceipt) {
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(245,158,11,0.35)' }}>
        {/* Status banner */}
        <div style={{ background: 'rgba(245,158,11,0.12)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#D97706', fontSize: 14 }}>
              Payment amount confirmed — awaiting admin confirmation
            </div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
              Detected: <strong>{storedReceipt.detectedRaw || 'amount on receipt'}</strong> · Admin will verify and confirm shortly.
            </div>
          </div>
        </div>

        {/* Receipt thumbnail */}
        {storedReceipt.receiptData && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-card, #fff)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: 6 }}>UPLOADED RECEIPT</div>
            <img src={storedReceipt.receiptData} alt="Payment receipt"
              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
        )}
      </div>
    );
  }

  // Default — upload form
  return (
    <div style={{ borderRadius: 12, border: '1.5px solid var(--border, #e2e8f0)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#172554,#0D9488)', padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
          💳 Pay Manually — {paymentStage === 'advance' ? '50% Advance' : '50% Final'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
          Transfer to our account, then upload your receipt below.
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: 'var(--bg-card, #fff)', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Bank details */}
        <div style={{ background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Bank Account Details</div>
          {[
            ['Bank',        'Opay / GTBank'],
            ['Account No.', '8012345678'],
            ['Account Name','Elite Mobile Cafe'],
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

        {/* File upload */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: 6, textTransform: 'uppercase' }}>Upload Receipt</div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed var(--border, #cbd5e1)', borderRadius: 10, padding: '18px 12px',
            cursor: 'pointer', background: 'var(--bg-tertiary, #f8fafc)', gap: 6,
          }}>
            <span style={{ fontSize: 28 }}>🧾</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
              {file ? file.name : 'Tap to select receipt image'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>JPG, PNG · max 5MB</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <img src={preview} alt="Receipt preview"
              style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border, #e2e8f0)' }} />
          </div>
        )}

        {/* Detected amount */}
        {detected && (
          <div style={{
            background: detected.amount ? 'rgba(13,148,136,0.09)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${detected.amount ? 'rgba(13,148,136,0.3)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: detected.amount ? '#0D9488' : '#DC2626' }}>
              {detected.amount
                ? `✅ Detected: ₦${Number(detected.amount).toLocaleString()} (${detected.raw})`
                : '⚠️ Amount not detected — admin will verify manually'}
            </div>
            {detected.confidence && (
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 3 }}>
                Confidence: {detected.confidence}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {preview && !detected && (
            <button style={{ ...btn('#1E3A8A'), flex: 1 }} onClick={handleAnalyse} disabled={detecting}>
              {detecting ? '🔍 Detecting...' : '🔍 Detect Amount'}
            </button>
          )}
          {detected && (
            <button style={{ ...btn('#0D9488'), flex: 1 }} onClick={handleSubmit} disabled={uploading}>
              {uploading ? '⏳ Submitting...' : '📤 Submit Receipt'}
            </button>
          )}
          {preview && (
            <button style={{ ...btn('#64748b', '#fff', { padding: '11px 14px' }) }}
              onClick={() => { setFile(null); setPreview(null); setDetected(null); setError(''); }}>
              ✕
            </button>
          )}
        </div>

        {!preview && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
            After uploading, our AI will read the amount and notify admin for confirmation.
          </p>
        )}
      </div>
    </div>
  );
}
