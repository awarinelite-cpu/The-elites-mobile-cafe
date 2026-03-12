// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { showInAppNotification } from '../hooks/useNotifications';

// ── Icons (inline SVG to avoid lucide dependency issues) ────
const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TABS = [
  { key: 'requests',  label: '📋 Service Requests' },
  { key: 'topics',    label: '📚 Research Topics' },
  { key: 'messages',  label: '💬 Messages' },
  { key: 'users',     label: '👥 Users' },
];

const STATUS_OPTIONS = ['pending','reviewing','accepted','in_progress','completed','rejected'];
const STATUS_COLORS  = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
};

const CATEGORIES = [
  'Nursing', 'Medicine', 'Public Health', 'Midwifery',
  'Pharmacology', 'Community Health', 'Mental Health', 'Other'
];

export default function AdminPage() {
  const [tab, setTab]                   = useState('requests');
  const [requests, setRequests]         = useState([]);
  const [topics, setTopics]             = useState([]);
  const [users, setUsers]               = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [newMessage, setNewMessage]     = useState('');
  const [recording, setRecording]       = useState(false);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [topicForm, setTopicForm]       = useState(null); // null = closed, {} = new, {id,...} = edit
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState('');
  const mediaRecorder                   = useRef(null);
  const audioChunks                     = useRef([]);
  const messagesEnd                     = useRef(null);
  const chatUnsub                       = useRef(null);

  // ── Load requests realtime ──────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── Load topics ─────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'researchTopics'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── Load users ──────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'users') return;
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [tab]);

  // ── Load chat messages for selected user ────────────────
  useEffect(() => {
    if (chatUnsub.current) chatUnsub.current();
    if (!selectedUser) return;

    const threadId = selectedUser.id;
    const q = query(
      collection(db, 'adminMessages', threadId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    chatUnsub.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => chatUnsub.current?.();
  }, [selectedUser]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Update request status / note / price ───────────────
  const updateRequest = async (id, data) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'serviceRequests', id), { ...data, updatedAt: serverTimestamp() });
      // Notify client
      const req = requests.find(r => r.id === id);
      if (req?.userId && data.status) {
        await addDoc(collection(db, 'notifications'), {
          userId: req.userId,
          title: `Request ${data.status.replace('_', ' ')}`,
          body: `Your ${req.serviceTitle} request is now ${data.status.replace('_', ' ')}`,
          type: 'alert',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      showToast('✅ Request updated');
    } catch (e) { showToast('❌ Error: ' + e.message); }
    setSaving(false);
  };

  // ── Send text message ───────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() && !audioBlob) return;
    if (!selectedUser) return;

    const threadId = selectedUser.id;
    const msgData = {
      sender: 'admin',
      createdAt: serverTimestamp(),
    };

    if (audioBlob) {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        await addDoc(collection(db, 'adminMessages', threadId, 'messages'), {
          ...msgData, type: 'audio', audioData: reader.result,
        });
        // Notify client
        await addDoc(collection(db, 'notifications'), {
          userId: selectedUser.id,
          title: '🎙️ Voice message from Admin',
          body: 'Admin sent you a voice message',
          type: 'message', read: false, createdAt: serverTimestamp(),
        });
        setAudioBlob(null);
      };
    } else {
      await addDoc(collection(db, 'adminMessages', threadId, 'messages'), {
        ...msgData, type: 'text', text: newMessage.trim(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.id,
        title: '💬 Message from Admin',
        body: newMessage.trim().slice(0, 80),
        type: 'message', read: false, createdAt: serverTimestamp(),
      });
      setNewMessage('');
    }
  };

  // ── Voice recording ─────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch { showToast('❌ Microphone access denied'); }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  // ── Topic CRUD ──────────────────────────────────────────
  const saveTopic = async (formData) => {
    setSaving(true);
    try {
      if (formData.id) {
        const { id, ...rest } = formData;
        await updateDoc(doc(db, 'researchTopics', id), { ...rest, updatedAt: serverTimestamp() });
        showToast('✅ Topic updated');
      } else {
        await addDoc(collection(db, 'researchTopics'), { ...formData, createdAt: serverTimestamp() });
        showToast('✅ Topic added');
      }
      setTopicForm(null);
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  const deleteTopic = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    await deleteDoc(doc(db, 'researchTopics', id));
    showToast('🗑️ Topic deleted');
  };

  const toggleAdminUser = async (userId, current) => {
    await updateDoc(doc(db, 'users', userId), { isAdmin: !current });
    setUsers(u => u.map(x => x.id === userId ? { ...x, isAdmin: !current } : x));
    showToast(!current ? '✅ Admin granted' : '✅ Admin removed');
  };

  // ── Filtered requests ───────────────────────────────────
  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  // ── Styles ──────────────────────────────────────────────
  const s = {
    page:       { minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 60 },
    header:     { background: 'linear-gradient(135deg,var(--blue-deep),var(--teal-dark))', padding: '32px 24px', color: '#fff' },
    inner:      { maxWidth: 1200, margin: '0 auto', padding: '0 20px' },
    tabs:       { display: 'flex', gap: 4, padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto' },
    tab:        (active) => ({ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s', background: active ? 'var(--teal)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }),
    card:       { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, marginBottom: 12 },
    badge:      (status) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: STATUS_COLORS[status]?.bg || '#eee', color: STATUS_COLORS[status]?.color || '#333' }),
    btn:        (bg, color='#fff') => ({ background: bg, color, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }),
    input:      { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12 },
    label:      { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    grid2:      { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 260px)' },
    userList:   { background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' },
    chatArea:   { background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.inner}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff', marginBottom: 4 }}>
            🛡️ Admin Control Panel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
            Manage requests, topics, users and communications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'requests' && requests.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ ...s.inner, paddingTop: 24 }}>

        {/* ── SERVICE REQUESTS ── */}
        {tab === 'requests' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 1fr' : '1fr', gap: 20 }}>
            {/* List */}
            <div>
              {/* Filter */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['all', ...STATUS_OPTIONS].map(st => (
                  <button key={st} onClick={() => setFilterStatus(st)}
                    style={{ ...s.btn(filterStatus === st ? 'var(--teal)' : 'var(--bg-secondary)', filterStatus === st ? '#fff' : 'var(--text-secondary)'), padding: '6px 12px', fontSize: 12 }}>
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No requests found</div>
              )}

              {filtered.map(req => (
                <div key={req.id} style={{ ...s.card, cursor: 'pointer', border: selectedRequest?.id === req.id ? '2px solid var(--teal)' : '1px solid var(--border-card)' }}
                  onClick={() => setSelectedRequest(req)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {req.serviceTitle || req.serviceKey}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {req.name} · {req.email}
                      </div>
                    </div>
                    <span style={s.badge(req.status)}>{req.status?.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                    {req.description?.slice(0, 100)}{req.description?.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                    {req.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Just now'}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            {selectedRequest && (
              <div style={{ ...s.card, position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Request Details</h3>
                  <button onClick={() => setSelectedRequest(null)} style={s.btn('#eee', '#333')}>✕ Close</button>
                </div>

                {/* Info */}
                {[
                  ['Service', selectedRequest.serviceTitle],
                  ['Client', selectedRequest.name],
                  ['Email', selectedRequest.email],
                  ['Phone', selectedRequest.phone],
                  ['Description', selectedRequest.description],
                  ['Deadline', selectedRequest.deadline],
                ].map(([label, val]) => val ? (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={s.label}>{label}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 8 }}>{val}</div>
                  </div>
                ) : null)}

                {/* Extra fields */}
                {selectedRequest.extraData && Object.entries(selectedRequest.extraData).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <div style={s.label}>{k.replace(/([A-Z])/g, ' $1')}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '7px 10px', borderRadius: 6 }}>{v}</div>
                  </div>
                ))}

                <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

                {/* Status */}
                <div style={{ marginBottom: 12 }}>
                  <label style={s.label}>Update Status</label>
                  <select
                    defaultValue={selectedRequest.status}
                    onChange={e => setSelectedRequest(r => ({ ...r, status: e.target.value }))}
                    style={s.input}>
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                  </select>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 12 }}>
                  <label style={s.label}>Agreed Price (₦)</label>
                  <input type="number" placeholder="e.g. 15000"
                    defaultValue={selectedRequest.agreedPrice || ''}
                    onChange={e => setSelectedRequest(r => ({ ...r, agreedPrice: e.target.value }))}
                    style={s.input} />
                </div>

                {/* Admin note */}
                <div style={{ marginBottom: 16 }}>
                  <label style={s.label}>Note to Client</label>
                  <textarea rows={3} placeholder="Write a note visible to the client..."
                    defaultValue={selectedRequest.adminNote || ''}
                    onChange={e => setSelectedRequest(r => ({ ...r, adminNote: e.target.value }))}
                    style={{ ...s.input, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...s.btn('var(--teal)'), flex: 1 }} disabled={saving}
                    onClick={() => updateRequest(selectedRequest.id, {
                      status: selectedRequest.status,
                      agreedPrice: selectedRequest.agreedPrice,
                      adminNote: selectedRequest.adminNote,
                    })}>
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button style={s.btn('var(--blue-deep)')}
                    onClick={() => { setSelectedUser({ id: selectedRequest.userId, name: selectedRequest.name }); setTab('messages'); }}>
                    💬 Message
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESEARCH TOPICS ── */}
        {tab === 'topics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Research Topics ({topics.length})
              </h2>
              <button style={s.btn('var(--teal)')}
                onClick={() => setTopicForm({ title: '', category: 'Nursing', pages: '', price: '', description: '', badge: '' })}>
                ＋ Add New Topic
              </button>
            </div>

            {/* Topic Form */}
            {topicForm && (
              <div style={{ ...s.card, border: '2px solid var(--teal)', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, color: 'var(--teal)' }}>
                  {topicForm.id ? '✏️ Edit Topic' : '➕ Add New Topic'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'title', label: 'Title', placeholder: 'e.g. Effect of hypertension in elderly patients' },
                    { key: 'price', label: 'Price (₦)', placeholder: 'e.g. ₦5,000', type: 'text' },
                    { key: 'pages', label: 'Pages', placeholder: 'e.g. 65 pages' },
                  ].map(f => (
                    <div key={f.key} style={f.key === 'title' ? { gridColumn: '1/-1' } : {}}>
                      <label style={s.label}>{f.label}</label>
                      <input type={f.type || 'text'} placeholder={f.placeholder}
                        value={topicForm[f.key] || ''}
                        onChange={e => setTopicForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={s.input} />
                    </div>
                  ))}

                  <div>
                    <label style={s.label}>Category</label>
                    <select value={topicForm.category || 'Nursing'}
                      onChange={e => setTopicForm(p => ({ ...p, category: e.target.value }))}
                      style={s.input}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={s.label}>Badge</label>
                    <select value={topicForm.badge || ''}
                      onChange={e => setTopicForm(p => ({ ...p, badge: e.target.value }))}
                      style={s.input}>
                      <option value="">None</option>
                      <option value="Popular">🔥 Popular</option>
                      <option value="New">✨ New</option>
                      <option value="Hidden">🚫 Hidden</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={s.label}>Description</label>
                    <textarea rows={3} placeholder="Brief description of the topic..."
                      value={topicForm.description || ''}
                      onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                      style={{ ...s.input, resize: 'vertical' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button style={{ ...s.btn('var(--teal)'), flex: 1 }} disabled={saving}
                    onClick={() => saveTopic(topicForm)}>
                    {saving ? 'Saving...' : topicForm.id ? '💾 Update Topic' : '➕ Add Topic'}
                  </button>
                  <button style={s.btn('#94A3B8')} onClick={() => setTopicForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Topics Table */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    {['Title', 'Category', 'Pages', 'Price', 'Badge', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topics.map(t => (
                    <tr key={t.id} style={{ opacity: t.badge === 'Hidden' ? 0.5 : 1 }}>
                      <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border)', maxWidth: 300 }}>{t.title}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{t.category}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{t.pages}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--gold)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>{t.price}</td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        {t.badge && <span style={{ ...s.badge(t.badge === 'Popular' ? 'accepted' : t.badge === 'New' ? 'reviewing' : 'rejected'), textTransform: 'none' }}>{t.badge}</span>}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...s.btn('var(--blue-deep)'), padding: '5px 12px' }}
                            onClick={() => setTopicForm({ ...t })}>✏️ Edit</button>
                          <button style={{ ...s.btn('#EF4444'), padding: '5px 12px' }}
                            onClick={() => deleteTopic(t.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topics.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No topics yet. Add your first one!</div>
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {tab === 'messages' && (
          <div style={s.grid2}>
            {/* Client List */}
            <div style={s.userList}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                💬 Client Threads
              </div>
              <div style={{ overflowY: 'auto', height: 'calc(100% - 53px)' }}>
                {requests
                  .filter((r, i, arr) => arr.findIndex(x => x.userId === r.userId) === i)
                  .map(req => (
                    <div key={req.userId}
                      onClick={() => setSelectedUser({ id: req.userId, name: req.name, email: req.email })}
                      style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedUser?.id === req.userId ? 'var(--teal-glow)' : 'transparent', transition: 'all 0.15s' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{req.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{req.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 3 }}>{req.serviceTitle}</div>
                    </div>
                  ))}
                {requests.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No clients yet</div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div style={s.chatArea}>
              {!selectedUser ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: '3rem' }}>💬</span>
                  <p>Select a client to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '12px 12px 0 0' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px', borderRadius: 14,
                          background: msg.sender === 'admin' ? 'var(--teal)' : 'var(--bg-tertiary)',
                          color: msg.sender === 'admin' ? '#fff' : 'var(--text-primary)',
                          border: msg.sender !== 'admin' ? '1px solid var(--border)' : 'none',
                          borderBottomRightRadius: msg.sender === 'admin' ? 4 : 14,
                          borderBottomLeftRadius: msg.sender !== 'admin' ? 4 : 14,
                          fontSize: 14, lineHeight: 1.5,
                        }}>
                          {msg.type === 'audio' ? (
                            <audio controls src={msg.audioData} style={{ maxWidth: 200, height: 36 }} />
                          ) : (
                            msg.text
                          )}
                          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                            {msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 13 }}>
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    <div ref={messagesEnd} />
                  </div>

                  {/* Audio preview */}
                  {audioBlob && (
                    <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 36, flex: 1 }} />
                      <button onClick={() => setAudioBlob(null)} style={s.btn('#EF4444', '#fff')}>✕</button>
                      <button onClick={sendMessage} style={s.btn('var(--teal)')}>Send 🎙️</button>
                    </div>
                  )}

                  {/* Input Row */}
                  {!audioBlob && (
                    <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)', borderRadius: '0 0 12px 12px' }}>
                      <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        style={{ ...s.input, marginBottom: 0, flex: 1 }}
                      />
                      <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        style={{ ...s.btn(recording ? '#EF4444' : 'var(--bg-secondary)', recording ? '#fff' : 'var(--text-secondary)'), padding: '10px 14px', fontSize: 18, border: '1px solid var(--border)' }}
                        title="Hold to record voice">
                        {recording ? '⏹' : '🎙️'}
                      </button>
                      <button onClick={sendMessage} style={{ ...s.btn('var(--teal)'), padding: '10px 16px' }}>
                        ➤
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 20 }}>
              Registered Users ({users.length})
            </h2>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    {['Name', 'Email', 'Joined', 'Admin', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{u.name || u.displayName || '—'}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{u.email}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        {u.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        {u.isAdmin
                          ? <span style={s.badge('accepted')}>✅ Admin</span>
                          : <span style={s.badge('pending')}>User</span>}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{ ...s.btn(u.isAdmin ? '#EF4444' : 'var(--blue-deep)'), padding: '5px 12px', fontSize: 12 }}
                            onClick={() => toggleAdminUser(u.id, u.isAdmin)}>
                            {u.isAdmin ? '🚫 Remove Admin' : '🛡️ Make Admin'}
                          </button>
                          <button style={{ ...s.btn('var(--teal)'), padding: '5px 12px', fontSize: 12 }}
                            onClick={() => { setSelectedUser(u); setTab('messages'); }}>
                            💬 Message
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.95)', color: '#fff', padding: '12px 24px',
          borderRadius: 24, fontSize: 14, fontWeight: 600, zIndex: 9999,
          backdropFilter: 'blur(10px)', border: '1px solid rgba(13,148,136,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-body)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
