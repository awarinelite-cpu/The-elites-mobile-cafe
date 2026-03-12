// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_OPTIONS = ['pending','reviewing','accepted','in_progress','completed','rejected'];
const STATUS_COLORS  = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
};
const CATEGORIES = ['Nursing','Medicine','Public Health','Midwifery','Pharmacology','Community Health','Mental Health','Other'];
const TABS = [
  { key: 'requests', label: '📋 Service Requests' },
  { key: 'topics',   label: '📚 Research Topics'  },
  { key: 'messages', label: '💬 Messages'          },
  { key: 'users',    label: '👥 Users'             },
];

export default function AdminPage() {
  const [tab, setTab]                         = useState('requests');
  const [requests, setRequests]               = useState([]);
  const [topics, setTopics]                   = useState([]);
  const [users, setUsers]                     = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState('');
  const [recording, setRecording]             = useState(false);
  const [audioBlob, setAudioBlob]             = useState(null);
  const [topicForm, setTopicForm]             = useState(null);
  const [filterStatus, setFilterStatus]       = useState('all');
  const [saving, setSaving]                   = useState(false);
  const [toast, setToast]                     = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);
  const messagesEnd   = useRef(null);
  const msgUnsub      = useRef(null);

  // ── Realtime loads ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc')),
      snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'researchTopics'), orderBy('createdAt', 'desc')),
      snap => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  useEffect(() => {
    if (tab !== 'users' && tab !== 'messages') return;
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [tab]);

  // ── Chat subscription — general per-user thread ─────────
  // Collection: adminMessages/{userId}/messages
  useEffect(() => {
    if (msgUnsub.current) { msgUnsub.current(); msgUnsub.current = null; }
    if (!selectedUser) { setMessages([]); return; }
    const q = query(
      collection(db, 'adminMessages', selectedUser.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    msgUnsub.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => msgUnsub.current?.();
  }, [selectedUser]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Update service request ──────────────────────────────
  const updateRequest = async (id, data) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'serviceRequests', id), { ...data, updatedAt: serverTimestamp() });
      const req = requests.find(r => r.id === id);
      if (req?.userId && data.status) {
        await addDoc(collection(db, 'notifications'), {
          userId: req.userId,
          title: `Request ${data.status.replace('_', ' ')}`,
          body: `Your ${req.serviceTitle} request is now ${data.status.replace('_', ' ')}`,
          type: 'alert', read: false, createdAt: serverTimestamp(),
        });
      }
      showToast('✅ Request updated');
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  // ── Send message ────────────────────────────────────────
  const sendMessage = async () => {
    if (!selectedUser) return;
    if (!newMessage.trim() && !audioBlob) return;

    try {
      if (audioBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          await addDoc(collection(db, 'adminMessages', selectedUser.id, 'messages'), {
            sender: 'admin', senderName: 'Admin',
            type: 'audio', audioData: reader.result,
            createdAt: serverTimestamp(),
          });
          await addDoc(collection(db, 'notifications'), {
            userId: selectedUser.id,
            title: '🎙️ Voice message from Admin',
            body: 'Admin sent you a voice message',
            type: 'message', read: false, createdAt: serverTimestamp(),
          });
          setAudioBlob(null);
        };
      } else {
        const txt = newMessage.trim();
        setNewMessage('');
        await addDoc(collection(db, 'adminMessages', selectedUser.id, 'messages'), {
          sender: 'admin', senderName: 'Admin',
          type: 'text', text: txt,
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'notifications'), {
          userId: selectedUser.id,
          title: '💬 Message from Admin',
          body: txt.slice(0, 80),
          type: 'message', read: false, createdAt: serverTimestamp(),
        });
      }
    } catch (e) { showToast('❌ ' + e.message); }
  };

  // ── Voice recording ─────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        setAudioBlob(new Blob(audioChunks.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch { showToast('❌ Microphone access denied'); }
  };
  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };

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
    showToast('🗑️ Deleted');
  };

  const toggleAdminUser = async (userId, current) => {
    await updateDoc(doc(db, 'users', userId), { isAdmin: !current });
    setUsers(u => u.map(x => x.id === userId ? { ...x, isAdmin: !current } : x));
    showToast(!current ? '✅ Admin granted' : '✅ Admin removed');
  };

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  // ── Shared styles ───────────────────────────────────────
  const s = {
    page:   { minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 60 },
    header: { background: 'linear-gradient(135deg,var(--blue-deep),var(--teal-dark))', padding: '32px 24px' },
    inner:  { maxWidth: 1200, margin: '0 auto', padding: '0 20px' },
    tabs:   { display: 'flex', gap: 4, padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto' },
    tab:    (a) => ({ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s', background: a ? 'var(--teal)' : 'transparent', color: a ? '#fff' : 'var(--text-secondary)' }),
    card:   { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, marginBottom: 12 },
    badge:  (st) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: STATUS_COLORS[st]?.bg || '#eee', color: STATUS_COLORS[st]?.color || '#333' }),
    btn:    (bg, color='#fff') => ({ background: bg, color, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }),
    input:  { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
    lbl:    { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.inner}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff', marginBottom: 4 }}>🛡️ Admin Control Panel</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Manage requests, topics, users and communications</p>
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

        {/* ══════════════ SERVICE REQUESTS ══════════════ */}
        {tab === 'requests' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 1fr' : '1fr', gap: 20 }}>
            <div>
              {/* Filter bar */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['all', ...STATUS_OPTIONS].map(st => (
                  <button key={st} onClick={() => setFilterStatus(st)}
                    style={{ ...s.btn(filterStatus === st ? 'var(--teal)' : 'var(--bg-secondary)', filterStatus === st ? '#fff' : 'var(--text-secondary)'), padding: '6px 12px', fontSize: 12 }}>
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No requests found</div>}

              {filtered.map(req => (
                <div key={req.id} style={{ ...s.card, cursor: 'pointer', border: selectedRequest?.id === req.id ? '2px solid var(--teal)' : '1px solid var(--border-card)' }}
                  onClick={() => setSelectedRequest(req)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{req.serviceTitle || req.serviceKey}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{req.name} · {req.email}</div>
                    </div>
                    <span style={s.badge(req.status)}>{req.status?.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                    {req.description?.slice(0, 100)}{req.description?.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{req.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Just now'}</div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selectedRequest && (
              <div style={{ ...s.card, position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Request Details</h3>
                  <button onClick={() => setSelectedRequest(null)} style={s.btn('#eee', '#333')}>✕ Close</button>
                </div>

                {[['Service', selectedRequest.serviceTitle],['Client', selectedRequest.name],['Email', selectedRequest.email],['Phone', selectedRequest.phone],['Description', selectedRequest.description],['Deadline', selectedRequest.deadline]].map(([label, val]) => val ? (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={s.lbl}>{label}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 8 }}>{val}</div>
                  </div>
                ) : null)}

                {selectedRequest.extraData && Object.entries(selectedRequest.extraData).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <div style={s.lbl}>{k.replace(/([A-Z])/g, ' $1')}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '7px 10px', borderRadius: 6 }}>{v}</div>
                  </div>
                ))}

                <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

                <div style={{ marginBottom: 12 }}>
                  <label style={s.lbl}>Update Status</label>
                  <select defaultValue={selectedRequest.status}
                    onChange={e => setSelectedRequest(r => ({ ...r, status: e.target.value }))} style={s.input}>
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={s.lbl}>Agreed Price (₦)</label>
                  <input type="number" placeholder="e.g. 15000"
                    defaultValue={selectedRequest.agreedPrice || ''}
                    onChange={e => setSelectedRequest(r => ({ ...r, agreedPrice: e.target.value }))}
                    style={s.input} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={s.lbl}>Note to Client</label>
                  <textarea rows={3} placeholder="Note visible to client..."
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
                    onClick={() => {
                      const u = users.find(u => u.id === selectedRequest.userId) || { id: selectedRequest.userId, name: selectedRequest.name, email: selectedRequest.email };
                      setSelectedUser(u);
                      setTab('messages');
                    }}>
                    💬 Message
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ RESEARCH TOPICS ══════════════ */}
        {tab === 'topics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Research Topics ({topics.length})</h2>
              <button style={s.btn('var(--teal)')}
                onClick={() => setTopicForm({ title: '', category: 'Nursing', pages: '', price: '', description: '', badge: '' })}>
                ＋ Add New Topic
              </button>
            </div>

            {topicForm && (
              <div style={{ ...s.card, border: '2px solid var(--teal)', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, color: 'var(--teal)' }}>
                  {topicForm.id ? '✏️ Edit Topic' : '➕ Add New Topic'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[{ key: 'title', label: 'Title', placeholder: 'Topic title' },{ key: 'price', label: 'Price (₦)', placeholder: 'e.g. ₦5,000' },{ key: 'pages', label: 'Pages', placeholder: 'e.g. 65 pages' }].map(f => (
                    <div key={f.key} style={f.key === 'title' ? { gridColumn: '1/-1' } : {}}>
                      <label style={s.lbl}>{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={topicForm[f.key] || ''}
                        onChange={e => setTopicForm(p => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
                    </div>
                  ))}
                  <div>
                    <label style={s.lbl}>Category</label>
                    <select value={topicForm.category || 'Nursing'}
                      onChange={e => setTopicForm(p => ({ ...p, category: e.target.value }))} style={s.input}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.lbl}>Badge</label>
                    <select value={topicForm.badge || ''}
                      onChange={e => setTopicForm(p => ({ ...p, badge: e.target.value }))} style={s.input}>
                      <option value="">None</option>
                      <option value="Popular">🔥 Popular</option>
                      <option value="New">✨ New</option>
                      <option value="Hidden">🚫 Hidden</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={s.lbl}>Description</label>
                    <textarea rows={3} placeholder="Brief description..." value={topicForm.description || ''}
                      onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                      style={{ ...s.input, resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button style={{ ...s.btn('var(--teal)'), flex: 1 }} disabled={saving} onClick={() => saveTopic(topicForm)}>
                    {saving ? 'Saving...' : topicForm.id ? '💾 Update' : '➕ Add Topic'}
                  </button>
                  <button style={s.btn('#94A3B8')} onClick={() => setTopicForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>{['Title','Category','Pages','Price','Badge','Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
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
                          <button style={{ ...s.btn('var(--blue-deep)'), padding: '5px 12px' }} onClick={() => setTopicForm({ ...t })}>✏️ Edit</button>
                          <button style={{ ...s.btn('#EF4444'), padding: '5px 12px' }} onClick={() => deleteTopic(t.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topics.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No topics yet.</div>}
            </div>
          </div>
        )}

        {/* ══════════════ MESSAGES ══════════════ */}
        {tab === 'messages' && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 260px)' }}>
            {/* Client list */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flexShrink: 0 }}>
                👥 Clients
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {users.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No clients yet</div>}
                {users.filter(u => !u.isAdmin).map(u => (
                  <div key={u.id} onClick={() => setSelectedUser(u)}
                    style={{ padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedUser?.id === u.id ? 'var(--teal-glow)' : 'transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {(u.name || u.displayName || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.displayName || 'Client'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat window */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selectedUser ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                  <span style={{ fontSize: '3.5rem' }}>💬</span>
                  <p style={{ fontSize: 14 }}>Select a client to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                      {(selectedUser.name || selectedUser.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{selectedUser.name || selectedUser.displayName || 'Client'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 13 }}>
                        No messages yet. Say hello! 👋
                      </div>
                    )}
                    {messages.map(msg => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.55,
                            background: isAdmin ? 'var(--teal)' : 'var(--bg-tertiary)',
                            color: isAdmin ? '#fff' : 'var(--text-primary)',
                            border: !isAdmin ? '1px solid var(--border)' : 'none',
                            borderBottomRightRadius: isAdmin ? 4 : 16,
                            borderBottomLeftRadius: !isAdmin ? 4 : 16,
                          }}>
                            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 5, fontWeight: 700, letterSpacing: 0.3 }}>
                              {isAdmin ? '🛡️ Admin' : (msg.senderName || '👤 Client')}
                            </div>
                            {msg.type === 'audio'
                              ? <audio controls src={msg.audioData} style={{ maxWidth: 220, height: 36, display: 'block' }} />
                              : <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>
                            }
                            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 5, textAlign: 'right' }}>
                              {msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEnd} />
                  </div>

                  {/* Audio preview */}
                  {audioBlob && (
                    <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 36, flex: 1 }} />
                      <button onClick={() => setAudioBlob(null)} style={{ ...s.btn('#EF4444'), padding: '6px 12px' }}>✕</button>
                      <button onClick={sendMessage} style={{ ...s.btn('var(--teal)'), padding: '6px 14px' }}>Send 🎙️</button>
                    </div>
                  )}

                  {/* Input bar */}
                  {!audioBlob && (
                    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)', flexShrink: 0 }}>
                      <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        style={{ ...s.input, marginBottom: 0, flex: 1 }}
                      />
                      {/* Hold to record */}
                      <button
                        onMouseDown={startRecording} onMouseUp={stopRecording}
                        onTouchStart={e => { e.preventDefault(); startRecording(); }} onTouchEnd={stopRecording}
                        title="Hold to record voice note"
                        style={{ ...s.btn(recording ? '#EF4444' : 'var(--bg-secondary)', recording ? '#fff' : 'var(--text-secondary)'), padding: '10px 14px', fontSize: 18, border: '1px solid var(--border)', flexShrink: 0 }}>
                        {recording ? '⏹' : '🎙️'}
                      </button>
                      <button onClick={sendMessage} disabled={!newMessage.trim()}
                        style={{ ...s.btn('var(--teal)'), padding: '10px 18px', flexShrink: 0, opacity: newMessage.trim() ? 1 : 0.5 }}>
                        ➤
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ USERS ══════════════ */}
        {tab === 'users' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 20 }}>Registered Users ({users.length})</h2>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>{['Name','Email','Joined','Role','Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{u.name || u.displayName || '—'}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{u.email}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>{u.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        {u.isAdmin ? <span style={s.badge('accepted')}>✅ Admin</span> : <span style={s.badge('pending')}>Client</span>}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...s.btn(u.isAdmin ? '#EF4444' : 'var(--blue-deep)'), padding: '5px 12px', fontSize: 12 }}
                            onClick={() => toggleAdminUser(u.id, u.isAdmin)}>
                            {u.isAdmin ? '🚫 Remove Admin' : '🛡️ Make Admin'}
                          </button>
                          <button style={{ ...s.btn('var(--teal)'), padding: '5px 12px', fontSize: 12 }}
                            onClick={() => { setSelectedUser(u); setTab('messages'); }}>
                            💬 Chat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users yet</div>}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.95)', color: '#fff', padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600, zIndex: 9999, backdropFilter: 'blur(10px)', border: '1px solid rgba(13,148,136,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
