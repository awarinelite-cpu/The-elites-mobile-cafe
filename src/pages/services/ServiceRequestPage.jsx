// src/pages/services/ServiceRequestPage.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ServiceRequestPage({
  serviceKey,
  serviceTitle,
  serviceIcon,
  serviceDesc,
  extraFields = [],
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Guests can view this page but can't edit or submit it ──
  // (fields render disabled, submit button becomes a sign-in prompt)
  const readOnly = !user;

  // ── Read writer UID from URL (?writer=UID) ────────────────
  // This is set when a client arrives via a writer's referral/profile link.
  // If present, the order is assigned directly to that writer.
  // If absent, the order goes to admin (no assignedWriterId).
  const writerUidFromUrl = searchParams.get('writer') || profile?.referredBy || null;

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    email:    user?.email       || '',
    phone:    '',
    details:  '',
    deadline: '',
    ...Object.fromEntries(extraFields.map(f => [f.name, ''])),
  });
  const [submitting, setSubmitting] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (readOnly) {
      navigate('/login');
      return;
    }
    if (!form.fullName || !form.email || !form.phone || !form.details) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        serviceKey,
        serviceTitle,
        ...form,
        status:      'pending',
        userId:      user?.uid  || null,
        clientId:    user?.uid  || null,
        name:        form.fullName || profile?.name || '',
        description: form.details  || '',
        referredBy:  profile?.referredBy || null,

        // ── Direct assignment ──────────────────────────────
        // If the client came via a writer's link, assign immediately.
        // Admin can still reassign later if needed.
        assignedWriterId: writerUidFromUrl || null,

        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
        adminNote:     '',
        agreedPrice:   null,
        paymentStatus: 'not_set',
      });

      if (writerUidFromUrl) {
        // Notify the writer that they have a new direct order
        await addDoc(collection(db, 'notifications'), {
          userId:    writerUidFromUrl,
          title:     '📥 New Direct Order!',
          body:      `${form.fullName} placed a new order: ${serviceTitle}`,
          type:      'new_order',
          read:      false,
          createdAt: serverTimestamp(),
        });
      } else {
        // Notify admin only when no writer is assigned
        await addDoc(collection(db, 'notifications'), {
          userId:    'admin',
          title:     '📋 New Service Request',
          body:      `${form.fullName} submitted a ${serviceTitle} request`,
          type:      'new_order',
          read:      false,
          createdAt: serverTimestamp(),
        });
      }

      toast.success('Request submitted! We will review and get back to you shortly.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-page">
      <div className="request-card">
        <button onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'var(--text-secondary, #64748b)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontFamily: 'inherit' }}>
          ← Back
        </button>

        <div className="service-icon-badge">{serviceIcon}</div>
        <h1>{serviceTitle}</h1>
        <p className="subtitle">{serviceDesc}</p>

        {/* Writer attribution notice */}
        {!readOnly && writerUidFromUrl && (
          <div style={{ background: 'rgba(13,148,136,0.10)', border: '1px solid rgba(13,148,136,0.30)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#0D9488', fontWeight: 600 }}>
            ✍️ This request will be handled directly by your writer.
          </div>
        )}

        {readOnly && (
          <div style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.30)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#B45309', fontWeight: 600 }}>
            👀 Preview only — sign in or create a free account to fill in and submit this request.
          </div>
        )}

        <div className="alert alert-info" style={{ marginBottom: 28 }}>
          📋 After submitting, our team will review your request, discuss details &amp; pricing with you, then begin work once agreed.
        </div>

        <div className="form-group">
          <label>Full Name *</label>
          <input name="fullName" value={form.fullName} onChange={handle} placeholder="Enter your full name" disabled={readOnly} />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input name="email" type="email" value={form.email} onChange={handle} placeholder="your@email.com" disabled={readOnly} />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input name="phone" value={form.phone} onChange={handle} placeholder="e.g. 08012345678" disabled={readOnly} />
        </div>

        {extraFields.map(f => (
          <div className="form-group" key={f.name}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'select' ? (
              <select name={f.name} value={form[f.name]} onChange={handle} disabled={readOnly}>
                <option value="">-- Select --</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name]} onChange={handle} placeholder={f.placeholder} rows={3} disabled={readOnly} />
            ) : (
              <input name={f.name} type={f.type || 'text'} value={form[f.name]} onChange={handle} placeholder={f.placeholder} disabled={readOnly} />
            )}
          </div>
        ))}

        <div className="form-group">
          <label>Project Details / Description *</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handle}
            placeholder="Describe exactly what you need — the more detail, the better we can help you."
            rows={5}
            disabled={readOnly}
          />
        </div>

        <div className="form-group">
          <label>Preferred Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={handle} disabled={readOnly} />
        </div>

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={submit}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {readOnly ? '🔒 Sign In to Submit Request' : (submitting ? 'Submitting...' : '📤 Submit Request')}
        </button>

        {readOnly && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            New here? <a href="/register">Create a free account →</a>
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Already submitted? <a href="/dashboard">View your requests →</a>
        </p>
      </div>
    </div>
  );
}
