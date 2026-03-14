// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_OPTIONS = ['pending','reviewing','accepted','priced','in_progress','completed','rejected'];
const STATUS_COLORS  = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  priced: { bg: 'rgba(201,168,76,0.12)', color: '#C9A84C' },
};
const CATEGORIES = ['Nursing','Medicine','Public Health','Midwifery','Pharmacology','Community Health','Mental Health','Other'];
const TABS = [
  { key: 'requests', label: '📋 Service Requests' },
  { key: 'topics',   label: '📚 Research Topics'  },
  { key: 'messages', label: '💬 Messages'          },
  { key: 'users',    label: '👥 Users'             },
  { key: 'payments', label: '💰 Payments'          },
];

export default function AdminPage() {
  const [tab, setTab]                         = useState('requests');
  const [requests, setRequests]               = useState([]);
  const [topics, setTopics]                   = useState([]);
  const [users, setUsers]                     = useState([]);
  const [paymentSplits, setPaymentSplits]     = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState('');
  const [recording, setRecording]             = useState(false);
  const [audioBlob, setAudioBlob]             = useState(null);
  const [topicForm, setTopicForm]             = useState(null);
  const [bulkMode, setBulkMode]               = useState(false);
  const [bulkParsed, setBulkParsed]           = useState([]);
  const [bulkUploading, setBulkUploading]     = useState(false);
  const [filterStatus, setFilterStatus]       = useState('all');
  const [msgFilter, setMsgFilter]             = useState('all'); // 'all' | 'writers' | 'clients'
  const [broadcastMode, setBroadcastMode]     = useState(false);
  const [broadcastText, setBroadcastText]     = useState('');
  const [broadcasting, setBroadcasting]       = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [toast, setToast]                     = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);
  const messagesEnd   = useRef(null);
  const msgUnsub      = useRef(null);

  // Load SheetJS for Excel parsing
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      document.head.appendChild(script);
    }
  }, []);

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
    const unsub = onSnapshot(query(collection(db, 'paymentSplits'), orderBy('createdAt', 'desc')),
      snap => setPaymentSplits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  // Load all users on mount — realtime so new signups appear instantly
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      snap => {
        console.log('✅ Users loaded:', snap.docs.length);
        setUsers(snap.docs.map(d => {
          const data = d.data();
          return { ...data, id: data.uid || d.id };
        }));
      },
      err => console.error('❌ Users fetch error:', err.code, err.message)
    );
    return unsub;
  }, []);

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

      // ── Auto-add to research topics when completed ──────
      if (data.status === 'completed' && req?.serviceTitle) {
        const exists = topics.some(t => t.title?.toLowerCase() === req.serviceTitle?.toLowerCase());
        if (!exists) {
          await addDoc(collection(db, 'researchTopics'), {
            title:       req.serviceTitle,
            category:    req.category || 'Other',
            pages:       req.pages    || '',
            price:       req.agreedPrice ? `₦${Number(req.agreedPrice).toLocaleString()}` : '',
            description: req.description || '',
            badge:       'New',
            autoAdded:   true,
            sourceOrderId: id,
            createdAt:   serverTimestamp(),
          });
        }
      }

      // ── Payment split on completion (referral-aware) ────────
      if (data.status === 'completed' && (data.agreedPrice || req?.agreedPrice)) {
        const total       = Number(data.agreedPrice || req.agreedPrice || 0);
        const referredBy  = req?.referredBy  || null;  // writer uid, 'admin', or null
        const writerId    = data.assignedWriterId || req?.assignedWriterId || null;
        const pushedBy    = req?.pushedBy || null;      // writer who pushed it out

        // Determine who referred this client
        const referrerIsAdmin  = !referredBy || referredBy === 'admin';
        const referrerIsWriter = referredBy && referredBy !== 'admin';

        // Was it pushed to a different writer?
        const writerIsSameAsReferrer = referrerIsWriter && writerId === referredBy;
        const wasPushed = pushedBy && writerId !== pushedBy;

        let splits = [];

        if (referrerIsAdmin && !wasPushed) {
          // Admin referred + admin "wrote" (no writer assigned) → admin 85%, maint 5%, admin share = 95%
          splits = [{ role: 'admin', amount: Math.round(total * 0.95), splitType: 'admin_referrer_writer' }];
        } else if (referrerIsAdmin && wasPushed && writerId) {
          // Admin referred + pushed to writer → writer 75%, admin 20%, maint 5%
          splits = [
            { writerId, writerAmount: Math.round(total * 0.75), adminAmount: Math.round(total * 0.20), maintenanceAmount: Math.round(total * 0.05), splitType: 'pushed_writer', referrerId: 'admin' },
          ];
        } else if (referrerIsWriter && writerIsSameAsReferrer) {
          // Writer referred + wrote it themselves → writer 85%, admin 10%, maint 5%
          splits = [
            { writerId, writerAmount: Math.round(total * 0.85), adminAmount: Math.round(total * 0.10), maintenanceAmount: Math.round(total * 0.05), splitType: 'writer_and_referrer', referrerId: referredBy },
          ];
        } else if (referrerIsWriter && wasPushed && writerId) {
          // Writer referred + pushed to another writer → referrer 10%, writer 75%, admin 10%, maint 5%
          splits = [
            // Referrer's cut
            { writerId: referredBy, writerAmount: Math.round(total * 0.10), adminAmount: 0, maintenanceAmount: 0, splitType: 'referrer_only', referrerId: referredBy },
            // Writer's cut
            { writerId, writerAmount: Math.round(total * 0.75), adminAmount: Math.round(total * 0.10), maintenanceAmount: Math.round(total * 0.05), splitType: 'pushed_writer', referrerId: referredBy },
          ];
        } else {
          // Fallback: no referral info, treat as direct admin assignment
          splits = [
            { writerId: writerId || null, writerAmount: writerId ? Math.round(total * 0.85) : 0, adminAmount: Math.round(total * (writerId ? 0.10 : 0.95)), maintenanceAmount: Math.round(total * 0.05), splitType: 'direct', referrerId: null },
          ];
        }

        for (const split of splits) {
          await addDoc(collection(db, 'paymentSplits'), {
            orderId:           id,
            clientId:          req?.userId || null,
            writerId:          split.writerId || null,
            referrerId:        split.referrerId || null,
            totalAmount:       total,
            writerAmount:      split.writerAmount || 0,
            adminAmount:       split.adminAmount  || 0,
            maintenanceAmount: split.maintenanceAmount || 0,
            splitType:         split.splitType,
            status:            'pending_payout',
            createdAt:         serverTimestamp(),
          });
        }
      }

      if (req?.userId && data.status) {
  const price = data.agreedPrice || req?.agreedPrice;
  const note  = data.adminNote  || req?.adminNote;
  const title_ = req.serviceTitle || req.serviceKey || req.topicTitle || 'your request';
  let notifTitle, notifBody;

  if (data.status === 'priced' && price) {
    notifTitle = '💰 Your Request Has Been Priced';
    notifBody  = `"${title_}" has been priced at ₦${Number(price).toLocaleString()}.${note ? ` Note: ${note}` : ''} Please log in to pay and activate your order.`;
  } else if (data.status === 'accepted') {
    notifTitle = '✅ Request Accepted';
    notifBody  = `"${title_}" has been accepted and is under review.${note ? ` Note: ${note}` : ''}`;
  } else if (data.status === 'in_progress') {
    notifTitle = '⚙️ Work In Progress';
    notifBody  = `Work has started on "${title_}".${note ? ` Note: ${note}` : ''}`;
  } else if (data.status === 'completed') {
    notifTitle = '🎉 Order Completed!';
    notifBody  = `"${title_}" is complete and ready.${note ? ` ${note}` : ''}`;
  } else if (data.status === 'rejected') {
    notifTitle = '❌ Request Not Accepted';
    notifBody  = `"${title_}" was not accepted.${note ? ` Reason: ${note}` : ''}`;
  } else {
    notifTitle = `📋 Request ${data.status.replace(/_/g, ' ')}`;
    notifBody  = `"${title_}" is now ${data.status.replace(/_/g, ' ')}.${note ? ` Note: ${note}` : ''}`;
  }

  await addDoc(collection(db, 'notifications'), {
    userId:    req.userId,
    title:     notifTitle,
    body:      notifBody,
    orderId:   id,
    type:      data.status === 'priced' ? 'payment' : 'alert',
    read:      false,
    createdAt: serverTimestamp(),
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
        setSaving(true);
        try {
          // Check size — Firestore docs max ~900KB base64 safe
          if (audioBlob.size > 650000) {
            showToast('❌ Voice note too long. Please keep it under 55 seconds.');
            setSaving(false);
            return;
          }
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
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
            } catch (e) { showToast('❌ ' + e.message); }
            setSaving(false);
          };
        } catch (e) { showToast('❌ ' + e.message); setSaving(false); }
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

  // ── Broadcast to all writers ─────────────────────────────
  const broadcastToWriters = async () => {
    if (!broadcastText.trim()) return;
    const writers = users.filter(u => u.isWriter || u.role === 'writer');
    if (writers.length === 0) { showToast('⚠️ No writers found'); return; }
    setBroadcasting(true);
    try {
      const txt = broadcastText.trim();
      await Promise.all(writers.map(w =>
        Promise.all([
          addDoc(collection(db, 'adminMessages', w.id, 'messages'), {
            sender: 'admin', senderName: 'Admin',
            type: 'text', text: txt,
            broadcast: true,
            createdAt: serverTimestamp(),
          }),
          addDoc(collection(db, 'notifications'), {
            userId: w.id,
            title: '📢 Broadcast from Admin',
            body: txt.slice(0, 80),
            type: 'message', read: false, createdAt: serverTimestamp(),
          }),
        ])
      ));
      showToast(`✅ Sent to ${writers.length} writer${writers.length > 1 ? 's' : ''}`);
      setBroadcastText('');
      setBroadcastMode(false);
    } catch (e) { showToast('❌ ' + e.message); }
    setBroadcasting(false);
  };

  // ── Voice recording ─────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 }
        : { audioBitsPerSecond: 16000 };
      mediaRecorder.current = new MediaRecorder(stream, options);
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        setAudioBlob(new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType || 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      // Auto-stop after 55 seconds to stay under Firestore 1MB limit
      setTimeout(() => { if (mediaRecorder.current?.state === 'recording') stopRecording(); }, 55000);
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

  // ── Bulk topic upload ───────────────────────────────────
  const parseBulkFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    let rows = [];

    if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      // Detect if first line is a header
      const firstLower = lines[0].toLowerCase();
      const hasHeader = firstLower.includes('title') || firstLower.includes('topic') || firstLower.includes('price');
      const dataLines = hasHeader ? lines.slice(1) : lines;
      rows = dataLines.map(line => {
        // Support comma, tab, or pipe delimited
        const parts = line.includes('\t') ? line.split('\t') : line.includes('|') ? line.split('|') : line.split(',');
        const clean = parts.map(p => p.trim().replace(/^"|"$/g, ''));
        return {
          title:       clean[0] || '',
          category:    clean[1] || 'Nursing',
          pages:       clean[2] || '',
          price:       clean[3] || '',
          description: clean[4] || '',
          badge:       clean[5] || '',
        };
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      // Use SheetJS loaded via CDN
      const XLSX = window.XLSX;
      if (!XLSX) { showToast('❌ Excel parsing not available. Use CSV instead.'); return; }
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      rows = data.map(row => {
        const k = (key) => {
          const found = Object.keys(row).find(k => k.toLowerCase().includes(key));
          return found ? String(row[found]).trim() : '';
        };
        return {
          title:       k('title') || k('topic') || k('name'),
          category:    k('category') || k('cat') || 'Nursing',
          pages:       k('page'),
          price:       k('price') || k('amount') || k('cost'),
          description: k('desc') || k('description') || k('about'),
          badge:       k('badge') || k('tag') || '',
        };
      });
    } else if (ext === 'doc' || ext === 'docx') {
      showToast('⚠️ Word docs not supported. Please save as .txt or .csv and re-upload.');
      return;
    } else {
      // Plain text paste — treat each non-empty line as a topic title
      const text = await file.text();
      rows = text.split('\n').map(l => l.trim()).filter(Boolean).map(line => ({
        title: line, category: 'Nursing', pages: '', price: '', description: '', badge: '',
      }));
    }

    // Filter out empty titles
    const valid = rows.filter(r => r.title);
    setBulkParsed(valid);
    if (valid.length === 0) showToast('⚠️ No topics found in file. Check format.');
    else showToast(`✅ Parsed ${valid.length} topics. Review and upload.`);
  };

  const uploadBulkTopics = async () => {
    if (bulkParsed.length === 0) return;
    setBulkUploading(true);
    let count = 0;
    try {
      for (const topic of bulkParsed) {
        await addDoc(collection(db, 'researchTopics'), { ...topic, createdAt: serverTimestamp() });
        count++;
      }
      showToast(`✅ ${count} topics uploaded successfully!`);
      setBulkParsed([]);
      setBulkMode(false);
    } catch (e) { showToast('❌ ' + e.message); }
    setBulkUploading(false);
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
          <div style={{ position: 'relative' }}>
          <style>{`
            @media (max-width: 768px) {
              .req-grid { display: block !important; }
              .req-detail-panel {
                position: fixed !important;
                inset: 64px 0 0 0 !important;
                z-index: 200 !important;
                border-radius: 0 !important;
                overflow-y: auto !important;
              }
              .req-detail-backdrop { display: block !important; }
            }
            .req-detail-backdrop { display: none; }
          `}</style>
          {selectedRequest && <div className="req-detail-backdrop" onClick={() => setSelectedRequest(null)} style={{ position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} />}
          <div className="req-grid" style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 1fr' : '1fr', gap: 20 }}>
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
              <div className="req-detail-panel" style={{ ...s.card, position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
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

                {/* NMCN special display */}
                {selectedRequest.nmcnType ? (
                  <NMCNAdminView request={selectedRequest} />
                ) : (
                  /* Generic extraData display */
                  selectedRequest.extraData && Object.entries(selectedRequest.extraData)
                    .filter(([k, v]) => v && typeof v === 'string' && k !== 'passport')
                    .map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={s.lbl}>{k.replace(/([A-Z])/g, ' $1').replace(/_/g,' ')}</div>
                        <button onClick={() => { navigator.clipboard.writeText(v); showToast('📋 Copied!'); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 11, fontWeight: 600 }}>Copy</button>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '7px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{v}</div>
                    </div>
                  ))
                )}

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

                <div style={{ marginBottom: 12 }}>
                  <label style={s.lbl}>Assign Writer</label>
                  <select
                    value={selectedRequest.assignedWriterId || ''}
                    onChange={e => setSelectedRequest(r => ({ ...r, assignedWriterId: e.target.value }))}
                    style={s.input}>
                    <option value="">— Unassigned —</option>
                    {users.filter(u => u.role === 'writer' || u.isWriter).map(w => (
                      <option key={w.id} value={w.id}>{w.name || w.email}</option>
                    ))}
                  </select>
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
                      assignedWriterId: selectedRequest.assignedWriterId,
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
          </div>
        )}

        {/* ══════════════ RESEARCH TOPICS ══════════════ */}
        {tab === 'topics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Research Topics ({topics.length})</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.btn('var(--blue-deep)')} onClick={() => { setBulkMode(true); setTopicForm(null); }}>
                  📂 Bulk Upload
                </button>
                <button style={s.btn('var(--teal)')}
                  onClick={() => { setTopicForm({ title: '', category: 'Nursing', pages: '', price: '', description: '', badge: '' }); setBulkMode(false); }}>
                  ＋ Add New Topic
                </button>
              </div>
            </div>

            {/* ── Bulk Upload Panel ── */}
            {bulkMode && (
              <div style={{ ...s.card, border: '2px solid var(--blue-deep)', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--blue-deep)', margin: 0 }}>📂 Bulk Upload Topics</h3>
                  <button style={s.btn('#94A3B8')} onClick={() => { setBulkMode(false); setBulkParsed([]); }}>✕ Close</button>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Supported formats:</strong><br />
                  • <strong>.csv / .txt</strong> — columns: <code>Title, Category, Pages, Price, Description, Badge</code><br />
                  • <strong>.xlsx / .xls</strong> — same columns as headers (order doesn't matter)<br />
                  • <strong>Plain .txt</strong> — one topic title per line (you can fill details after)<br />
                  • Word docs (.docx) — save as .txt or .csv first
                </div>

                {/* Drop zone */}
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px',
                  cursor: 'pointer', marginBottom: 16, background: 'var(--bg-secondary)', gap: 8,
                }}>
                  <span style={{ fontSize: '2.5rem' }}>📁</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>Click to choose file or drag & drop</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>.csv, .txt, .xlsx, .xls</span>
                  <input type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files[0]) parseBulkFile(e.target.files[0]); e.target.value = ''; }} />
                </label>

                {/* Parsed preview */}
                {bulkParsed.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                        {bulkParsed.length} topics ready to upload
                      </span>
                      <button style={{ ...s.btn('#EF4444'), padding: '5px 12px', fontSize: 12 }} onClick={() => setBulkParsed([])}>
                        Clear
                      </button>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                          <tr>
                            {['#','Title','Category','Pages','Price','Badge'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkParsed.map((t, i) => (
                            <tr key={i}>
                              <td style={{ padding: '7px 12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 11 }}>{i + 1}</td>
                              <td style={{ padding: '7px 12px', color: 'var(--text-primary)', fontWeight: 600, borderBottom: '1px solid var(--border)', maxWidth: 200 }}>
                                <input value={t.title} onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, title: e.target.value} : r))}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, width: '100%', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                                <select value={t.category} onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, category: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', fontSize: 12, borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-body)' }}>
                                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                                <input value={t.pages} onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, pages: e.target.value} : r))}
                                  placeholder="e.g. 65" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: 60, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                                <input value={t.price} onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, price: e.target.value} : r))}
                                  placeholder="₦5,000" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontWeight: 700, width: 80, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                                <select value={t.badge} onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, badge: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', fontSize: 12, borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-body)' }}>
                                  <option value="">None</option>
                                  <option value="Popular">🔥 Popular</option>
                                  <option value="New">✨ New</option>
                                  <option value="Hidden">🚫 Hidden</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={uploadBulkTopics} disabled={bulkUploading}
                      style={{ ...s.btn('var(--teal)'), width: '100%', marginTop: 14, padding: '12px', fontSize: 14, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {bulkUploading ? `Uploading... (${bulkParsed.length} topics)` : `🚀 Upload All ${bulkParsed.length} Topics`}
                    </button>
                  </div>
                )}
              </div>
            )}

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
          <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 260px)', overflow: 'hidden', position: 'relative' }}>
            <style>{`
              @media (max-width: 768px) {
                .msg-sidebar {
                  position: absolute !important;
                  left: 0; top: 0; bottom: 0;
                  width: 100% !important;
                  z-index: 2;
                  transition: transform 0.3s ease;
                }
                .msg-sidebar.hidden { transform: translateX(-110%); }
                .msg-chat {
                  position: absolute !important;
                  left: 0; top: 0; right: 0; bottom: 0;
                  width: 100% !important;
                  z-index: 1;
                }
              }
              @media (min-width: 769px) {
                .msg-sidebar { width: 280px; flex-shrink: 0; }
                .msg-sidebar.hidden { display: flex !important; transform: none !important; }
                .msg-chat { flex: 1; min-width: 0; }
              }
            `}</style>
            {/* Sidebar */}
            <div className={`msg-sidebar${selectedUser ? ' hidden' : ''}`} style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Filter tabs */}
              <div style={{ padding: '10px 10px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[['all','👥 All'],['writers','✍️ Writers'],['clients','🎓 Clients']].map(([val, label]) => (
                    <button key={val} onClick={() => setMsgFilter(val)}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                        background: msgFilter === val ? 'var(--teal)' : 'var(--bg-tertiary)',
                        color: msgFilter === val ? '#fff' : 'var(--text-muted)' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Broadcast button — only shown on writers filter */}
                {(msgFilter === 'writers' || msgFilter === 'all') && (
                  <button onClick={() => setBroadcastMode(m => !m)}
                    style={{ ...s.btn(broadcastMode ? '#7C3AED' : 'var(--bg-tertiary)', broadcastMode ? '#fff' : 'var(--text-secondary)'),
                      width: '100%', marginBottom: 10, fontSize: 12, border: '1px solid var(--border)' }}>
                    📢 Broadcast to all writers
                  </button>
                )}
              </div>

              {/* Broadcast compose panel */}
              {broadcastMode && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.07)', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, marginBottom: 6 }}>
                    📢 Message all {users.filter(u => u.isWriter || u.role === 'writer').length} writers
                  </div>
                  <textarea
                    rows={3}
                    value={broadcastText}
                    onChange={e => setBroadcastText(e.target.value)}
                    placeholder="Type your broadcast message..."
                    style={{ ...s.input, marginBottom: 8, fontSize: 12, resize: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={broadcastToWriters} disabled={broadcasting || !broadcastText.trim()}
                      style={{ ...s.btn('#7C3AED'), flex: 1, fontSize: 12, opacity: broadcastText.trim() ? 1 : 0.5 }}>
                      {broadcasting ? 'Sending...' : '📤 Send to All'}
                    </button>
                    <button onClick={() => { setBroadcastMode(false); setBroadcastText(''); }}
                      style={{ ...s.btn('#94A3B8'), fontSize: 12 }}>✕</button>
                  </div>
                </div>
              )}

              {/* User list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {users.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users yet</div>}
                {users
                  .filter(u => !u.isAdmin)
                  .filter(u => {
                    if (msgFilter === 'writers') return u.isWriter || u.role === 'writer';
                    if (msgFilter === 'clients') return !u.isWriter && u.role !== 'writer';
                    return true;
                  })
                  .map(u => (
                    <div key={u.id} onClick={() => setSelectedUser(u)}
                      style={{ padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedUser?.id === u.id ? 'var(--teal-glow)' : 'transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: (u.isWriter || u.role === 'writer') ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'linear-gradient(135deg,var(--teal),var(--blue-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {(u.name || u.displayName || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.displayName || 'User'}</div>
                        <div style={{ fontSize: 10, color: (u.isWriter || u.role === 'writer') ? '#7C3AED' : 'var(--text-muted)', fontWeight: 600 }}>
                          {(u.isWriter || u.role === 'writer') ? '✍️ Writer' : '🎓 Client'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Chat window */}
            <div className="msg-chat" style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selectedUser ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                  <span style={{ fontSize: '3.5rem' }}>💬</span>
                  <p style={{ fontSize: 14 }}>Select a user to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 22, padding: '0 4px', flexShrink: 0, display: 'none' }} className="msg-back-btn">‹</button>
                    <style>{`@media (max-width: 768px) { .msg-back-btn { display: block !important; } }`}</style>
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
            {/* Admin referral link */}
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 6 }}>🔗 Your Admin Referral Link</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Share this link. Clients who register through it will be assigned to you. You earn <strong style={{ color: 'var(--gold)' }}>85%</strong> if you write it, or <strong style={{ color: 'var(--gold)' }}>20%</strong> if you push to a writer (writer gets 75%).
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {window.location.origin}/register?ref=admin
                </div>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=admin`); showToast('📋 Copied!'); }}
                  style={{ ...s.btn('var(--gold)', '#000'), flexShrink: 0 }}>
                  Copy
                </button>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 20 }}>Registered Users ({users.length})</h2>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>{['Name','Email','Joined','Role','Referred By','Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const referrerName = u.referredBy === 'admin' ? 'Admin' : u.referredBy ? users.find(w => (w.uid || w.id) === u.referredBy)?.name || 'Writer' : '—';
                    return (
                      <tr key={u.id}>
                        <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{u.name || u.displayName || '—'}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{u.email}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>{u.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                          {u.isAdmin ? <span style={s.badge('accepted')}>✅ Admin</span> : u.isWriter ? <span style={s.badge('in_progress')}>✍️ Writer</span> : <span style={s.badge('pending')}>Client</span>}
                        </td>
                        <td style={{ padding: '13px 16px', color: 'var(--gold)', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{referrerName}</td>
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
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users yet</div>}
            </div>
          </div>
        )}

        {/* ══════════════ PAYMENTS ══════════════ */}
        {tab === 'payments' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 6 }}>Payment Splits</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>All completed project payouts — pending and paid.</p>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
              {[
                ['Total Pending', `₦${paymentSplits.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.writerAmount || 0), 0).toLocaleString()}`, '#D97706'],
                ['Total Paid Out', `₦${paymentSplits.filter(p => p.status === 'paid').reduce((s, p) => s + (p.writerAmount || 0), 0).toLocaleString()}`, '#16A34A'],
                ['Total Splits', paymentSplits.length, 'var(--teal)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>

            {paymentSplits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No payment splits yet.</div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: 'var(--bg-secondary)' }}>
                    <tr>{['Date','Type','Recipient','Total','Their Cut','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {paymentSplits.map(sp => {
                      const recipientUser = users.find(u => (u.uid || u.id) === sp.writerId);
                      const typeColors = {
                        writer_and_referrer: '#16A34A',
                        referrer_only:       'var(--gold)',
                        pushed_writer:       '#7C3AED',
                        direct:              'var(--teal)',
                        admin_referrer_writer: 'var(--teal)',
                      };
                      return (
                        <tr key={sp.id}>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            {sp.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[sp.splitType] || 'var(--text-muted)' }}>
                              {sp.splitType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                            {recipientUser?.name || sp.writerId || 'Admin'}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                            ₦{sp.totalAmount?.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#16A34A', borderBottom: '1px solid var(--border)' }}>
                            ₦{sp.writerAmount?.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                              background: sp.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                              color: sp.status === 'paid' ? '#16A34A' : '#D97706',
                            }}>{sp.status === 'paid' ? 'Paid' : 'Pending'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            {sp.status !== 'paid' && (
                              <button
                                onClick={async () => {
                                  await updateDoc(doc(db, 'paymentSplits', sp.id), { status: 'paid', paidAt: serverTimestamp() });
                                  showToast('✅ Marked as paid');
                                }}
                                style={{ ...s.btn('#16A34A'), padding: '5px 12px', fontSize: 12 }}>
                                ✅ Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
// ── NMCN Admin View ───────────────────────────────────────────
function NMCNAdminView({ request }) {
  const d = request.extraData || {};
  const showToastLocal = msg => { /* use parent showToast via alert fallback */
    try { navigator.clipboard.writeText(msg); } catch(e) {}
  };

  const copyField = (val) => {
    navigator.clipboard.writeText(val || '').then(() => {}).catch(() => {});
    const el = document.createElement('div');
    el.textContent = '📋 Copied!';
    el.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#0D9488;color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:9999;pointer-events:none;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  };

  const downloadPassport = () => {
    if (!d.passport) return alert('No passport photo uploaded.');
    const a = document.createElement('a');
    a.href = d.passport;
    a.download = `passport_${request.name || 'client'}_${request.id?.slice(0,6)}.jpg`;
    a.click();
  };

  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  const Section = ({ title, fields }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(([label, key]) => {
          const val = d[key] || request[key] || '';
          if (!val) return null;
          const isPassport = key === 'passport';
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
                {!isPassport && (
                  <button onClick={() => copyField(val)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 11, fontWeight: 700, padding: '2px 6px' }}>
                    📋 Copy
                  </button>
                )}
              </div>
              {isPassport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={val} alt="Passport"
                    style={{ width: 70, height: 85, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--teal)' }} />
                  <button onClick={downloadPassport}
                    style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⬇️ Download Passport
                  </button>
                </div>
              ) : (
                <input readOnly value={val} style={inp}
                  onFocus={e => e.target.select()}
                  title="Click to select all, then copy" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Documents checklist
  const docs = [
    ['WAEC / NECO Certificate', 'hasWaecNeco'],
    ['Admission Letter',         'hasAdmissionLetter'],
    ['Testimonial',              'hasTestimonial'],
    ['Birth Certificate',        'hasBirthCert'],
  ];

  // Client-uploaded document files
  const uploadedDocs = Object.entries(d).filter(([k]) => k.startsWith('docFile_'));

  return (
    <div>
      {/* Header badge */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>NMCN</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{request.nmcnType} — {request.nmcnSubType}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{request.name} · {request.email}</div>
      </div>

      {/* Copy All button */}
      <button onClick={() => {
        const lines = [];
        lines.push(`=== NMCN ${request.nmcnType} (${request.nmcnSubType}) ===`);
        lines.push(`Client: ${request.name} | ${request.email} | ${request.phone}`);
        lines.push('');
        lines.push('--- SECTION A ---');
        [['Institution',d.institutionName],['Exam No',d.examNumber],['Surname',d.surname],['Email',d.emailA||request.email],['Phone',d.phoneA||request.phone],['App No',d.applicationNumber],['Indexing No',d.indexingNumber],['Admission Date',d.admissionDate],['DOB',d.dobA],['Gender',d.genderA],['Marital Status',d.maritalStatusA]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION B ---');
        [['First Name',d.firstName],['Middle Name',d.middleName],['Last Name',d.lastName],['DOB',d.dob],['Gender',d.gender],['Phone',d.phone],['Email',d.email],['Nationality',d.nationality],['State of Origin',d.stateOfOrigin],['LGA',d.lga],['Permanent Address',d.permanentAddress],['Marital Status',d.maritalStatus],['Country',d.country],['Residential Address',d.residentialAddress],['Res LGA',d.residentialLGA],['Res State',d.residentialState],['Res Town',d.residentialTown]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION C ---');
        [['NOK Name',d.nokName],['NOK Phone',d.nokPhone],['NOK Address',d.nokAddress],['Relationship',d.nokRelationship]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION E ---');
        [['NIN',d.nin],['Sponsor Name',d.sponsorName],['Sponsor Address',d.sponsorAddress],['Sponsor Phone',d.sponsorPhone],['Sponsor Email',d.sponsorEmail]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION F ---');
        [['Exam Body',d.examBody],['Exam Type',d.examType],['Exam No',d.examinationNumber],['Exam Year',d.examYear],['Scratch Serial',d.scratchSerial],['Scratch PIN',d.scratchPin],['NECO Token',d.necoToken]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        navigator.clipboard.writeText(lines.join('\n'));
        copyField('copied');
      }} style={{ width: '100%', background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        📋 Copy All Data (for NMCN Website)
      </button>

      <Section title="Section A — Institution & Admission" fields={[
        ['Institution Name','institutionName'],['Exam Number','examNumber'],['Surname','surname'],
        ['Email','emailA'],['Phone','phoneA'],['Application Number','applicationNumber'],
        ['Indexing Number','indexingNumber'],['Admission Date','admissionDate'],
        ['Date of Birth','dobA'],['Gender','genderA'],['Marital Status','maritalStatusA'],
      ]} />

      <Section title="Section B — Personal Information" fields={[
        ['First Name','firstName'],['Middle Name','middleName'],['Last Name','lastName'],
        ['Date of Birth','dob'],['Gender','gender'],['Phone','phone'],['Email','email'],
        ['Nationality','nationality'],['State of Origin','stateOfOrigin'],['LGA','lga'],
        ['Permanent Address','permanentAddress'],['Marital Status','maritalStatus'],
        ['Country','country'],['Residential Address','residentialAddress'],
        ['Res. LGA','residentialLGA'],['Res. State','residentialState'],['Res. Town','residentialTown'],
      ]} />

      <Section title="Section C — Next of Kin" fields={[
        ['NOK Name','nokName'],['NOK Phone','nokPhone'],
        ['NOK Address','nokAddress'],['Relationship','nokRelationship'],
      ]} />

      {/* Section D — Documents checklist */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          Section D — Documents Checklist
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.map(([label, key]) => {
            const has = d[key] === 'yes';
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: has ? 'rgba(22,163,74,0.08)' : 'var(--bg-tertiary)', borderRadius: 8, border: `1px solid ${has ? 'rgba(22,163,74,0.3)' : 'var(--border)'}` }}>
                <span style={{ fontSize: 16 }}>{has ? '✅' : '❌'}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: has ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{has ? 'Confirmed' : 'Not uploaded'}</span>
              </div>
            );
          })}
        </div>

        {/* Uploaded document files from client */}
        {uploadedDocs.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>UPLOADED FILES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploadedDocs.map(([key, val]) => {
                const docName = key.replace('docFile_', '').replace(/_/g, ' ');
                const isImage = val.startsWith('data:image');
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(13,148,136,0.06)', borderRadius: 8, border: '1px solid rgba(13,148,136,0.2)' }}>
                    <span style={{ fontSize: 20 }}>{isImage ? '🖼️' : '📄'}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{docName}</span>
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = val;
                      a.download = `${docName}_${request.id?.slice(0,6)}`;
                      a.click();
                    }} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                      ⬇️ Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Section title="Section E — Sponsor Information" fields={[
        ['NIN','nin'],['Sponsor Name','sponsorName'],['Sponsor Address','sponsorAddress'],
        ['Sponsor Phone','sponsorPhone'],['Sponsor Email','sponsorEmail'],
      ]} />

      <Section title="Section F — Examination Body & Passport" fields={[
        ['Exam Body','examBody'],['Exam Type','examType'],['Examination Number','examinationNumber'],
        ['Exam Year','examYear'],['Scratch Card Serial','scratchSerial'],
        ['Scratch Card PIN','scratchPin'],['NECO Token','necoToken'],
        ['Passport Photo','passport'],
      ]} />
    </div>
  );
}
