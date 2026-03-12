// src/pages/services/ServiceRequestPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    details: '',
    deadline: '',
    ...Object.fromEntries(extraFields.map(f => [f.name, ''])),
  });
  const [submitting, setSubmitting] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
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
        status: 'pending',
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminNote: '',
        agreedPrice: null,
        paymentStatus: 'not_set',
      });
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
        <div className="service-icon-badge">{serviceIcon}</div>
        <h1>{serviceTitle}</h1>
        <p className="subtitle">{serviceDesc}</p>

        <div className="alert alert-info" style={{ marginBottom: 28 }}>
          📋 After submitting, our team will review your request, discuss details & pricing with you, then begin work once agreed.
        </div>

        <div className="form-group">
          <label>Full Name *</label>
          <input name="fullName" value={form.fullName} onChange={handle} placeholder="Enter your full name" />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input name="email" type="email" value={form.email} onChange={handle} placeholder="your@email.com" />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input name="phone" value={form.phone} onChange={handle} placeholder="e.g. 08012345678" />
        </div>

        {extraFields.map(f => (
          <div className="form-group" key={f.name}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'select' ? (
              <select name={f.name} value={form[f.name]} onChange={handle}>
                <option value="">-- Select --</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name]} onChange={handle} placeholder={f.placeholder} rows={3} />
            ) : (
              <input name={f.name} type={f.type || 'text'} value={form[f.name]} onChange={handle} placeholder={f.placeholder} />
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
          />
        </div>

        <div className="form-group">
          <label>Preferred Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={handle} />
        </div>

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={submit}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {submitting ? 'Submitting...' : '📤 Submit Request'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Already submitted? <a href="/dashboard">View your requests →</a>
        </p>
      </div>
    </div>
  );
}
