// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp, orderBy, query, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import toast from 'react-hot-toast';

/* ── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { key: 'requests',  label: '📋 Service Requests' },
  { key: 'topics',    label: '📚 Research Topics' },
  { key: 'messages',  label: '💬 Messages' },
];

const STATUS_OPTIONS = ['pending', 'reviewing', 'accepted', 'in_progress', 'completed', 'rejected'];
const STATUS_COLORS  = {
  pending:     { bg: '#FEF9C3', color: '#92400E' },
  reviewing:   { bg: '#DBEAFE', color: '#1E3A8A' },
  accepted:    { bg: '#CCFBF1', color: '#0F766E' },
  in_progress: { bg: '#EDE9FE', color: '#6D28D9' },
  completed:   { bg: '#DCFCE7', color: '#15803D' },
  rejected:    { bg: '#FEE2E2', color: '#DC2626' },
};

const CATEGORIES = [
  'Nursing Science', 'Public Health', 'Technology', 'Business',
  'Economics', 'Psychology', 'Sociology', 'Environmental Science', 'Other'
];

/* ════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [tab, setTab] = useState('requests');

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Times New Roman', Georgia, serif" }}>

      {/* Header */}
      <div style={{ background: '#172554', borderBottom: '3px solid #0D9488', padding: '20px 24px' }}>
        <h1 style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 700, margin: 0 }}>⚙️ Admin Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 13, margin: '4px 0 0' }}>Elite Mobile Cafe — Full Control Panel</p>
      </div>

      {/* Tabs */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', gap: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '16px 20px', fontSize: 14, fontWeight: 700,
            fontFamily: "'Times New Roman', serif",
            color: tab === t.key ? '#0D9488' : '#6B7280',
            borderBottom: tab === t.key ? '3px solid #0D9488' : '3px solid transparent',
            transition: 'color 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'requests' && <RequestsTab />}
        {tab === 'topics'   && <TopicsTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 1 — SERVICE REQUESTS
════════════════════════════════════════════════════════════ */
function RequestsTab() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [adminNote, setAdminNote]   = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [saving, setSaving]         = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openRequest = (r) => {
    setSelected(r);
    setAdminNote(r.adminNote || '');
    setAgreedPrice(r.agreedPrice || '');
  };

  const saveChanges = async (newStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'serviceRequests', selected.id), {
        status: newStatus || selected.status,
        adminNote,
        agreedPrice,
        updatedAt: serverTimestamp(),
      });
      toast.success('Request updated!');
      setSelected(s => ({ ...s, status: newStatus || s.status, adminNote, agreedPrice }));
    } catch (e) {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>

      {/* List */}
      <div>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: '1px solid', cursor: 'pointer', fontFamily: "'Times New Roman', serif",
              background: filterStatus === s ? '#0D9488' : '#FFFFFF',
              color: filterStatus === s ? '#FFFFFF' : '#6B7280',
              borderColor: filterStatus === s ? '#0D9488' : '#E2E8F0',
            }}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <Empty text="No requests found." />}
          {filtered.map(r => {
            const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
            return (
              <div key={r.id} onClick={() => openRequest(r)} style={{
                background: selected?.id === r.id ? '#F0FDFA' : '#FFFFFF',
                border: `1px solid ${selected?.id === r.id ? '#0D9488' : '#E2E8F0'}`,
                borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E3A8A' }}>{r.serviceTitle}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{r.fullName} · {r.phone}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Just now'}
                    </div>
                  </div>
                  <span style={{
                    background: sc.bg, color: sc.color,
                    fontSize: 10, fontWeight: 700, padding: '3px 10px',
                    borderRadius: 20, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{r.status?.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, position: 'sticky', top: 20, alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1E3A8A', margin: 0 }}>{selected.serviceTitle}</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>✕</button>
          </div>

          {/* Client info */}
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <Row label="Name"     value={selected.fullName} />
            <Row label="Email"    value={selected.email} />
            <Row label="Phone"    value={selected.phone} />
            {selected.deadline && <Row label="Deadline" value={selected.deadline} />}
          </div>

          {/* Extra fields */}
          {Object.entries(selected)
            .filter(([k]) => !['id','serviceKey','serviceTitle','fullName','email','phone','details','deadline','status','userId','createdAt','updatedAt','adminNote','agreedPrice','paymentStatus'].includes(k))
            .map(([k, v]) => v && <Row key={k} label={k} value={String(v)} />)
          }

          {/* Details */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', marginBottom: 6 }}>Project Details</div>
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{selected.details}</div>
          </div>

          {/* Status changer */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Update Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(s => {
                const sc = STATUS_COLORS[s];
                return (
                  <button key={s} onClick={() => saveChanges(s)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', border: '1px solid',
                    background: selected.status === s ? sc.color : sc.bg,
                    color: selected.status === s ? '#FFFFFF' : sc.color,
                    borderColor: sc.color,
                    fontFamily: "'Times New Roman', serif",
                  }}>{s.replace('_', ' ')}</button>
                );
              })}
            </div>
          </div>

          {/* Agreed price */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Agreed Price (₦)</label>
            <input value={agreedPrice} onChange={e => setAgreedPrice(e.target.value)}
              placeholder="e.g. 15000"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* Admin note */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Admin Note to Client</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              placeholder="Write a note that the client will see..."
              rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <button onClick={() => saveChanges()} disabled={saving} style={{
            width: '100%', background: '#0D9488', color: '#FFFFFF',
            border: 'none', borderRadius: 8, padding: '12px',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Times New Roman', serif", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 2 — RESEARCH TOPICS
════════════════════════════════════════════════════════════ */
function TopicsTab() {
  const [topics, setTopics]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const blank = { title: '', category: '', pages: '', price: '', badge: '', description: '' };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openNew = () => { setEditing(null); setForm(blank); setShowForm(true); };
  const openEdit = (t) => { setEditing(t); setForm({ title: t.title, category: t.category, pages: t.pages, price: t.price, badge: t.badge || '', description: t.description || '' }); setShowForm(true); };

  const save = async () => {
    if (!form.title || !form.category || !form.price) { toast.error('Title, category and price are required.'); return; }
    setSaving(true);
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, 'topics', editing.id), data);
        toast.success('Topic updated!');
      } else {
        await addDoc(collection(db, 'topics'), { ...data, createdAt: serverTimestamp() });
        toast.success('Topic added!');
      }
      setShowForm(false);
    } catch (e) { toast.error('Failed to save topic.'); }
    finally { setSaving(false); }
  };

  const deleteTopic = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try { await deleteDoc(doc(db, 'topics', id)); toast.success('Topic deleted.'); }
    catch (e) { toast.error('Failed to delete.'); }
  };

  const setBadge = async (id, badge) => {
    await updateDoc(doc(db, 'topics', id), { badge, updatedAt: serverTimestamp() });
    toast.success('Badge updated!');
  };

  const BADGE_OPTIONS = ['', 'Popular', 'New', 'Hidden'];

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E3A8A', margin: 0 }}>Research Topics ({topics.length})</h2>
        <button onClick={openNew} style={{
          background: '#0D9488', color: '#FFFFFF', border: 'none',
          borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: "'Times New Roman', serif",
        }}>+ Add New Topic</button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E3A8A', margin: 0 }}>{editing ? 'Edit Topic' : 'Add New Topic'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>✕</button>
            </div>

            {[
              { name: 'title',       label: 'Topic Title *',    placeholder: 'e.g. Effect of malaria in Lagos' },
              { name: 'pages',       label: 'Page Range',       placeholder: 'e.g. 15–20' },
              { name: 'price',       label: 'Price *',          placeholder: 'e.g. ₦12,000' },
              { name: 'description', label: 'Short Description',placeholder: 'Brief summary of the topic...' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: 5 }}>{f.label}</label>
                <input value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#0D9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: 5 }}>Category *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none' }}>
                <option value="">-- Select Category --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: 5 }}>Badge</label>
              <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none' }}>
                {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#F1F5F9', color: '#6B7280', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Times New Roman', serif" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex: 2, background: '#0D9488', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Times New Roman', serif", opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editing ? '💾 Update Topic' : '➕ Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topics list */}
      {topics.length === 0 && <Empty text="No topics yet. Add your first topic!" />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {topics.filter(t => t.badge !== 'Hidden').concat(topics.filter(t => t.badge === 'Hidden')).map(t => (
          <div key={t.id} style={{
            background: t.badge === 'Hidden' ? '#F9FAFB' : '#FFFFFF',
            border: '1px solid #E2E8F0', borderTop: '4px solid #0D9488',
            borderRadius: 10, padding: '18px 20px',
            opacity: t.badge === 'Hidden' ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.category}</div>
              {t.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: t.badge === 'Popular' ? '#FEF3C7' : t.badge === 'New' ? '#DCFCE7' : '#F3F4F6',
                  color: t.badge === 'Popular' ? '#92400E' : t.badge === 'New' ? '#15803D' : '#6B7280',
                }}>{t.badge}</span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937', lineHeight: 1.4, marginBottom: 6 }}>{t.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 14 }}>
              <span style={{ color: '#9CA3AF' }}>{t.pages} pages</span>
              <span style={{ color: '#0D9488', fontWeight: 700 }}>{t.price}</span>
            </div>

            {/* Badge quick set */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              {BADGE_OPTIONS.map(b => (
                <button key={b} onClick={() => setBadge(t.id, b)} style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  border: '1px solid', cursor: 'pointer', fontFamily: "'Times New Roman', serif",
                  background: t.badge === b ? '#0D9488' : '#F8FAFC',
                  color: t.badge === b ? '#FFFFFF' : '#6B7280',
                  borderColor: t.badge === b ? '#0D9488' : '#E2E8F0',
                }}>{b || 'None'}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(t)} style={{ flex: 1, background: '#EFF6FF', color: '#1E3A8A', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Times New Roman', serif" }}>✏️ Edit</button>
              <button onClick={() => deleteTopic(t.id)} style={{ flex: 1, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Times New Roman', serif" }}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 3 — MESSAGES
════════════════════════════════════════════════════════════ */
function MessagesTab() {
  const [clients, setClients]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRec, setMediaRec]   = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const bottomRef = useRef(null);

  // Load all users who have submitted requests
  useEffect(() => {
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const seen = new Set();
      const list = [];
      snap.docs.forEach(d => {
        const data = d.data();
        const key = data.userId || data.email;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ userId: data.userId, email: data.email, fullName: data.fullName, phone: data.phone });
        }
      });
      setClients(list);
    });
    return unsub;
  }, []);

  // Load messages for selected client
  useEffect(() => {
    if (!selected) return;
    const threadId = selected.userId || selected.email.replace(/[^a-zA-Z0-9]/g, '_');
    const q = query(collection(db, 'adminMessages', threadId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [selected]);

  const getThreadId = () => selected.userId || selected.email.replace(/[^a-zA-Z0-9]/g, '_');

  const sendText = async () => {
    if (!text.trim() || !selected) return;
    setSending(true);
    try {
      const threadId = getThreadId();
      await addDoc(collection(db, 'adminMessages', threadId, 'messages'), {
        type: 'text', content: text.trim(),
        from: 'admin', createdAt: serverTimestamp(),
      });
      // Also write to client's notification
      await addDoc(collection(db, 'notifications'), {
        userId: selected.userId || null,
        email: selected.email,
        message: text.trim(),
        from: 'admin',
        read: false,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) { toast.error('Failed to send.'); }
    finally { setSending(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await sendAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRec(mr);
      setAudioChunks(chunks);
      setRecording(true);
    } catch (e) {
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRec?.stop();
    setRecording(false);
    setMediaRec(null);
  };

  const sendAudio = async (blob) => {
    if (!selected) return;
    setSending(true);
    try {
      const threadId = getThreadId();
      const storageRef = ref(storage, `adminAudio/${threadId}/${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'adminMessages', threadId, 'messages'), {
        type: 'audio', content: url,
        from: 'admin', createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: selected.userId || null,
        email: selected.email,
        message: '🎙️ Admin sent you a voice message',
        from: 'admin',
        read: false,
        createdAt: serverTimestamp(),
      });
      toast.success('Voice message sent!');
    } catch (e) { toast.error('Failed to send audio.'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: '70vh' }}>

      {/* Client list */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: 13, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Clients ({clients.length})
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {clients.length === 0 && <Empty text="No clients yet." />}
          {clients.map((c, i) => (
            <div key={i} onClick={() => setSelected(c)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
              background: selected?.email === c.email ? '#F0FDFA' : '#FFFFFF',
              borderLeft: selected?.email === c.email ? '3px solid #0D9488' : '3px solid transparent',
              transition: 'background 0.15s',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937' }}>{c.fullName}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{c.email}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{c.phone}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {!selected ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Select a client to start messaging</div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>
              {selected.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937' }}>{selected.fullName}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{selected.email}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#D1D5DB', marginTop: 40, fontSize: 14 }}>No messages yet. Say hello! 👋</div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.from === 'admin' ? 'flex-end' : 'flex-start',
                maxWidth: '72%',
              }}>
                {m.type === 'text' ? (
                  <div style={{
                    background: m.from === 'admin' ? '#0D9488' : '#F1F5F9',
                    color: m.from === 'admin' ? '#FFFFFF' : '#1F2937',
                    padding: '10px 14px', borderRadius: m.from === 'admin' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: 14, lineHeight: 1.6,
                  }}>{m.content}</div>
                ) : (
                  <div style={{ background: m.from === 'admin' ? '#CCFBF1' : '#F1F5F9', padding: '10px 14px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 700, marginBottom: 4 }}>🎙️ Voice Message</div>
                    <audio controls src={m.content} style={{ width: '100%', height: 36 }} />
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: m.from === 'admin' ? 'right' : 'left' }}>
                  {m.from === 'admin' ? 'You (Admin)' : selected.fullName} · {m.createdAt?.toDate?.()?.toLocaleTimeString?.() || ''}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder="Type a message... (Enter to send)"
              rows={2}
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: "'Times New Roman', serif", outline: 'none', resize: 'none' }}
              onFocus={e => e.target.style.borderColor = '#0D9488'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />

            {/* Send text */}
            <button onClick={sendText} disabled={sending || !text.trim()} style={{
              background: '#0D9488', color: '#FFFFFF', border: 'none',
              borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Times New Roman', serif",
              opacity: !text.trim() ? 0.5 : 1,
            }}>Send</button>

            {/* Voice message */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={sending}
              title={recording ? 'Stop recording' : 'Record voice message'}
              style={{
                background: recording ? '#DC2626' : '#172554',
                color: '#FFFFFF', border: 'none',
                borderRadius: 8, padding: '10px 14px', fontSize: 18,
                cursor: 'pointer',
                animation: recording ? 'pulse-rec 1s infinite' : 'none',
              }}
            >{recording ? '⏹' : '🎙️'}</button>
          </div>

          {recording && (
            <div style={{ padding: '6px 16px 10px', background: '#FEF2F2', textAlign: 'center', fontSize: 12, color: '#DC2626', fontWeight: 700 }}>
              🔴 Recording... tap ⏹ to stop and send
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-rec {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ── Small helpers ───────────────────────────────────────── */
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: '#9CA3AF', minWidth: 70, textTransform: 'capitalize' }}>{label}:</span>
      <span style={{ color: '#1F2937', fontWeight: 600, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#0D9488', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      <div style={{ marginTop: 12, fontSize: 14 }}>Loading...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: '40px 0', color: '#D1D5DB', fontSize: 14 }}>{text}</div>;
}
