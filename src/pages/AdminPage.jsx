// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import AIResearchWriterPage from './AIResearchWriterPage';
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
const CATEGORIES = [
  // Health Sciences
  'Nursing Science','Midwifery','Medicine & Surgery','Public Health','Community Health',
  'Mental Health','Pharmacology','Medical Laboratory Science','Physiotherapy','Radiography',
  'Nutrition & Dietetics','Environmental Health','Health Information Management',
  'Optometry','Dental Surgery','Medical Rehabilitation','Veterinary Medicine',
  // Education
  'Education','Educational Management','Guidance & Counselling','Early Childhood Education',
  'Special Education','Curriculum Studies','Educational Psychology',
  // Business & Social Sciences
  'Business Administration','Accounting','Economics','Marketing','Banking & Finance',
  'Public Administration','Sociology','Psychology','Political Science','Mass Communication','Social Work',
  // Sciences & Technology
  'Computer Science','Information Technology','Electrical Engineering','Civil Engineering',
  'Mechanical Engineering','Agricultural Science','Biochemistry','Microbiology',
  'Chemistry','Physics','Environmental Science',
  // Law & Humanities
  'Law','English Language','History','Philosophy','Religious Studies','Linguistics',
  'Other',
];
const NAV = [
  { key: 'dashboard',  label: '🏠 Dashboard',        group: 'main'    },
  { key: 'requests',   label: '📋 Service Requests',  group: 'main'    },
  { key: 'topics',     label: '📚 Research Topics',   group: 'main'    },
  { key: 'messages',   label: '💬 Messages',           group: 'comms'   },
  { key: 'withdrawals',label: '💸 Withdrawals',        group: 'finance' },
  { key: 'payments',   label: '💰 Payment Splits',     group: 'finance' },
  { key: 'users',      label: '👥 Users',              group: 'manage'  },
  { key: 'ai_writer',  label: '🤖 AI Writer',          group: 'tools'   },
];

export default function AdminPage() {
  const [tab, setTab]                         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [requests, setRequests]               = useState([]);
  const [topics, setTopics]                   = useState([]);
  const [users, setUsers]                     = useState([]);
  const [paymentSplits, setPaymentSplits]     = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUser, setSelectedUser]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState('');
  const [recording, setRecording]             = useState(false);
  const [audioBlob, setAudioBlob]             = useState(null);
  const [topicForm, setTopicForm]             = useState(null);
  const [bulkMode, setBulkMode]               = useState(false);
  const [pasteMode, setPasteMode]             = useState(false);
  const [pasteText, setPasteText]             = useState('');
  const [bulkParsed, setBulkParsed]           = useState([]);
  const [bulkUploading, setBulkUploading]     = useState(false);
  const [filterStatus, setFilterStatus]       = useState('all');
  const [msgFilter, setMsgFilter]             = useState('all');
  const [broadcastMode, setBroadcastMode]     = useState(false);
  const [broadcastText, setBroadcastText]     = useState('');
  const [broadcasting, setBroadcasting]       = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [toast, setToast]                     = useState('');
  const [selectedTopics, setSelectedTopics]   = useState(new Set());
  const [orderChatMessages, setOrderChatMessages] = useState([]);
  const [orderChatText, setOrderChatText]     = useState('');
  const [orderChatSending, setOrderChatSending] = useState(false);
  const [orderChatUnsub, setOrderChatUnsub]   = useState(null);
  const orderChatEndRef                       = useRef(null);
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

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc')),
      snap => setWithdrawalRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
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
          // Admin referred + admin "wrote" (no writer) → admin 95%, maint 5%
          splits = [{ role: 'admin', amount: Math.round(total * 0.95), splitType: 'admin_referrer_writer' }];
        } else if (referrerIsAdmin && wasPushed && writerId) {
          // Admin referred + pushed to writer → writer 95%, maint 5%
          splits = [
            { writerId, writerAmount: Math.round(total * 0.95), adminAmount: 0, maintenanceAmount: Math.round(total * 0.05), splitType: 'pushed_writer', referrerId: 'admin' },
          ];
        } else if (referrerIsWriter && writerIsSameAsReferrer) {
          // Writer referred + wrote it themselves → writer 95%, maint 5%
          splits = [
            { writerId, writerAmount: Math.round(total * 0.95), adminAmount: 0, maintenanceAmount: Math.round(total * 0.05), splitType: 'writer_and_referrer', referrerId: referredBy },
          ];
        } else if (referrerIsWriter && wasPushed && writerId) {
          // Writer referred + pushed to another writer → referrer 10%, writer 85%, maint 5%
          splits = [
            // Referrer's cut
            { writerId: referredBy, writerAmount: Math.round(total * 0.10), adminAmount: 0, maintenanceAmount: 0, splitType: 'referrer_only', referrerId: referredBy },
            // Writer's cut
            { writerId, writerAmount: Math.round(total * 0.85), adminAmount: 0, maintenanceAmount: Math.round(total * 0.05), splitType: 'pushed_writer', referrerId: referredBy },
          ];
        } else {
          // Fallback: direct admin assignment → writer 95%, maint 5%
          splits = [
            { writerId: writerId || null, writerAmount: writerId ? Math.round(total * 0.95) : 0, adminAmount: 0, maintenanceAmount: Math.round(total * 0.05), splitType: 'direct', referrerId: null },
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

  // ── Confirm Manual Payment ──────────────────────────────
  // Called from the receipt bubble inside Order Chat.
  // stage: 'advance' | 'final'
  const confirmManualPayment = async (stage, _unused, targetOrderId, targetUserId, orderTitle) => {
    setConfirmingPayment(true);
    try {
      const newStatus  = `${stage}_confirmed`;
      const isPaidFlag = stage === 'advance' ? 'advancePaid' : 'finalPaid';

      // 1. Update the order doc — this is all that's needed
      await updateDoc(doc(db, 'serviceRequests', targetOrderId), {
        paymentStatus: newStatus,
        [isPaidFlag]:  true,
        updatedAt:     serverTimestamp(),
      });

      // 2. Notify the client so they see the confirmation immediately
      if (targetUserId) {
        await addDoc(collection(db, 'notifications'), {
          userId:    targetUserId,
          title:     stage === 'advance' ? '✅ Advance Payment Confirmed!' : '✅ Final Payment Confirmed!',
          body:      stage === 'advance'
            ? `Your advance payment for "${orderTitle}" has been confirmed. Work will begin shortly.`
            : `Your final payment for "${orderTitle}" has been confirmed. You can now download your completed work.`,
          type:      'payment',
          orderId:   targetOrderId,
          read:      false,
          createdAt: serverTimestamp(),
        });
      }

      // 3. Update the local selectedRequest so the bubble reflects confirmed immediately
      if (selectedRequest?.id === targetOrderId) {
        setSelectedRequest(r => ({ ...r, paymentStatus: newStatus, [isPaidFlag]: true }));
      }

      showToast(`✅ ${stage === 'advance' ? 'Advance' : 'Final'} payment confirmed — client notified`);
    } catch (e) { showToast('❌ ' + e.message); }
    setConfirmingPayment(false);
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

  const deleteSelectedTopics = async () => {
    if (selectedTopics.size === 0) return;
    if (!window.confirm(`Delete ${selectedTopics.size} selected topic(s)? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await Promise.all([...selectedTopics].map(id => deleteDoc(doc(db, 'researchTopics', id))));
      showToast(`🗑️ Deleted ${selectedTopics.size} topics`);
      setSelectedTopics(new Set());
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  const deleteAllTopics = async () => {
    if (!window.confirm(`Delete ALL ${topics.length} topics? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await Promise.all(topics.map(t => deleteDoc(doc(db, 'researchTopics', t.id))));
      showToast(`🗑️ Deleted all topics`);
      setSelectedTopics(new Set());
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  // ── Order Chat (per-request back-and-forth) ─────────────────
  const subscribeOrderChat = (requestId) => {
    setOrderChatMessages([]);
    if (!requestId) { setOrderChatUnsub(null); return; }
    const q = query(
      collection(db, 'orderChats', requestId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setOrderChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      snap.docs.forEach(d => {
        const msg = d.data();
        if ((msg.senderRole === 'client' || msg.senderRole === 'writer') && !msg.readByAdmin) {
          updateDoc(doc(db, 'orderChats', requestId, 'messages', d.id), { readByAdmin: true }).catch(() => {});
        }
      });
      setTimeout(() => orderChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
    setOrderChatUnsub(() => unsub);
  };

  const sendOrderChatMsg = async () => {
    if (!orderChatText.trim() || !selectedRequest || orderChatSending) return;
    const payload = orderChatText.trim();
    setOrderChatText('');
    setOrderChatSending(true);
    try {
      await addDoc(collection(db, 'orderChats', selectedRequest.id, 'messages'), {
        text:         payload,
        senderId:     'admin',
        senderName:   'Admin',
        senderRole:   'admin',
        readByAdmin:  true,
        readByClient: false,
        readByWriter: false,
        createdAt:    serverTimestamp(),
      });
      if (selectedRequest.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId:    selectedRequest.userId,
          title:     '💬 New message from Admin',
          body:      `Admin: ${payload.slice(0, 80)}${payload.length > 80 ? '…' : ''}`,
          type:      'chat',
          projectId: selectedRequest.id,
          read:      false,
          createdAt: serverTimestamp(),
        });
      }
      if (selectedRequest.assignedWriterId) {
        await addDoc(collection(db, 'notifications'), {
          userId:    selectedRequest.assignedWriterId,
          title:     '💬 Admin message on order',
          body:      `Admin: ${payload.slice(0, 80)}${payload.length > 80 ? '…' : ''}`,
          type:      'chat',
          projectId: selectedRequest.id,
          read:      false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) { showToast('❌ ' + e.message); setOrderChatText(payload); }
    setOrderChatSending(false);
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

  // ── Paste-text topic parser ─────────────────────────────
  const parsePastedTopics = (raw) => {
    // ── Known categories (longest-first so "Public Health Nursing" beats "Nursing") ─
    const CAT_LIST = [
      'Public Health Nursing','Nursing Science','Medical Laboratory Science',
      'Health Information Management','Early Childhood Education',
      'Medicine & Surgery','Nutrition & Dietetics','Environmental Health',
      'Medical Rehabilitation','Educational Management','Business Administration',
      'Guidance & Counselling','Educational Psychology','Agricultural Science',
      'Mechanical Engineering','Electrical Engineering','Special Education',
      'Curriculum Studies','Environmental Science','Information Technology',
      'Political Science','Mass Communication','Banking & Finance',
      'Public Administration','Dental Surgery','Veterinary Medicine',
      'Community Health','Mental Health','Pharmacology','Physiotherapy',
      'Radiography','Optometry','Midwifery','Microbiology','Biochemistry',
      'Social Work','Sociology','Psychology','Economics','Accounting','Marketing',
      'Computer Science','Civil Engineering','Religious Studies','English Language',
      'Philosophy','Linguistics','History','Chemistry','Physics','Education','Law','Other',
    ];

    // ── Badge keywords ─────────────────────────────────────
    const BADGE_MAP = {
      popular: 'Popular', trending: 'Popular', hot: 'Popular', top: 'Popular',
      new: 'New', latest: 'New', fresh: 'New', recent: 'New',
      hidden: 'Hidden', hide: 'Hidden', inactive: 'Hidden',
    };

    // ── Format price ──────────────────────────────────────
    const fmtPrice = (raw) => {
      // strip ₦ N # commas spaces then parse
      const n = parseInt(raw.replace(/[₦N#,\s]/g, ''), 10);
      if (isNaN(n) || n < 100 || n > 9999999) return '';
      return `₦${n.toLocaleString()}`;
    };

    // ── Core line parser (works BACK-TO-FRONT) ────────────
    const parseLine = (raw) => {
      // 1. Strip leading list prefix: "1 " "1. " "1) " "• " "- " etc.
      let line = raw.trim()
        .replace(/^\s*\(?\d+[).:\-]\s+/, '')   // 1. 1) 1:
        .replace(/^\s*\d+\s+/, '')              // bare "1 " at start
        .replace(/^[ivxlcdmIVXLCDM]+\.\s+/i,'')// i. ii. iii.
        .replace(/^[•\-\*–—►▶▸>\u25CF\u25AA]\s*/, '')
        .trim();

      if (!line || line.length < 6) return null;

      // Split into words
      const words = line.split(/\s+/);

      let badge = '';
      let price = '';
      let pages = '';
      let catMatch = '';

      let i = words.length - 1;

      // 2. Badge — last word?
      const lastWord = words[i]?.toLowerCase().replace(/[.,;:!?]$/, '');
      if (BADGE_MAP[lastWord]) {
        badge = BADGE_MAP[lastWord];
        i--;
      }

      // 3. Price — next token from right: a number (with optional ₦ N # and commas)
      //    Accept: 50000  50,000  ₦50,000  N50,000  #50,000
      const priceRe = /^[₦N#]?\d[\d,]+$/;
      if (i >= 0 && priceRe.test(words[i].replace(/[.,;]$/, ''))) {
        price = fmtPrice(words[i]);
        i--;
      }

      // 4. Pages — next token from right: a plain integer 10-999
      const pagesRe = /^\d{2,3}$/;
      if (i >= 0 && pagesRe.test(words[i].replace(/[.,;]$/, ''))) {
        const n = parseInt(words[i], 10);
        if (n >= 10 && n <= 999) { pages = String(n); i--; }
      }

      // 5. Category — scan backwards greedily for the longest matching known category
      //    Try up to 5 words from position i going backwards
      const remaining = words.slice(0, i + 1).join(' ');
      let foundCat = '';
      let foundCatLen = 0;

      for (const cat of CAT_LIST) {
        const catLower = cat.toLowerCase();
        const remLower = remaining.toLowerCase();
        // Check if remaining ENDS with this category name
        if (remLower.endsWith(catLower)) {
          if (cat.length > foundCatLen) {
            foundCat = cat;
            foundCatLen = cat.length;
          }
        }
      }

      let titleEnd = i;
      if (foundCat) {
        catMatch = foundCat;
        // Trim category words off the end of remaining
        const catWords = foundCat.split(' ').length;
        titleEnd = i - catWords;
      }

      // 6. Title = everything left
      const title = words.slice(0, titleEnd + 1).join(' ').replace(/[,;|]+$/, '').trim();
      if (!title || title.length < 6) return null;

      // 7. If no category was found explicitly, auto-guess from title keywords
      if (!catMatch) {
        const t = (title + ' ' + remaining).toLowerCase();
        const CAT_KEYWORDS = [
          ['Public Health Nursing',    ['public health nursing']],
          ['Nursing Science',          ['nursing science','nursing']],
          ['Midwifery',                ['midwifery','midwife']],
          ['Medicine & Surgery',       ['medicine','surgery']],
          ['Public Health',            ['public health']],
          ['Community Health',         ['community health']],
          ['Mental Health',            ['mental health','psychiatric']],
          ['Pharmacology',             ['pharmacology','pharmacy']],
          ['Medical Laboratory Science',['medical laboratory','med lab']],
          ['Physiotherapy',            ['physiotherapy','physio']],
          ['Radiography',              ['radiography','radiology']],
          ['Nutrition & Dietetics',    ['nutrition','dietetics']],
          ['Environmental Health',     ['environmental health']],
          ['Health Information Management',['health information']],
          ['Optometry',                ['optometry']],
          ['Dental Surgery',           ['dental','dentistry']],
          ['Medical Rehabilitation',   ['rehabilitation','rehab']],
          ['Veterinary Medicine',      ['veterinary','vet']],
          ['Education',                ['education','teaching']],
          ['Educational Management',   ['educational management']],
          ['Guidance & Counselling',   ['guidance','counselling']],
          ['Early Childhood Education',['early childhood','preschool']],
          ['Special Education',        ['special education']],
          ['Curriculum Studies',       ['curriculum']],
          ['Business Administration',  ['business administration']],
          ['Accounting',               ['accounting','accountancy']],
          ['Economics',                ['economics']],
          ['Marketing',                ['marketing']],
          ['Banking & Finance',        ['banking','finance']],
          ['Public Administration',    ['public administration']],
          ['Sociology',                ['sociology']],
          ['Psychology',               ['psychology']],
          ['Political Science',        ['political science']],
          ['Mass Communication',       ['mass communication','media','journalism']],
          ['Social Work',              ['social work']],
          ['Computer Science',         ['computer science','computing']],
          ['Information Technology',   ['information technology']],
          ['Electrical Engineering',   ['electrical engineering']],
          ['Civil Engineering',        ['civil engineering']],
          ['Mechanical Engineering',   ['mechanical engineering']],
          ['Agricultural Science',     ['agricultural','agriculture']],
          ['Biochemistry',             ['biochemistry']],
          ['Microbiology',             ['microbiology']],
          ['Chemistry',                ['chemistry']],
          ['Physics',                  ['physics']],
          ['Environmental Science',    ['environmental science']],
          ['Law',                      ['law','legal']],
          ['English Language',         ['english language','english literature']],
          ['History',                  ['history']],
          ['Philosophy',               ['philosophy']],
          ['Religious Studies',        ['religion','theology','religious']],
          ['Linguistics',              ['linguistics']],
        ];
        for (const [cat, keys] of CAT_KEYWORDS) {
          if (keys.some(k => t.includes(k))) { catMatch = cat; break; }
        }
        if (!catMatch) catMatch = 'Nursing Science';
      }

      return { title, category: catMatch, pages, price, description: '', badge };
    };

    // ── Detect multi-line vs structured formats ────────────
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { showToast('⚠️ Nothing to parse.'); return; }

    const tabCount   = lines.filter(l => l.includes('\t')).length;
    const pipeCount  = lines.filter(l => l.includes('|')).length;

    let parsed = [];

    if (tabCount > lines.length * 0.4) {
      // ── Tab-separated (Excel paste) ───────────────────────
      for (const line of lines) {
        const parts = line.split('\t').map(p => p.trim().replace(/^["']|["']$/g,''));
        if (!parts[0] || parts[0].length < 4) continue;
        const title = parts[0].replace(/^\s*\d+[).:\-]?\s+/, '').trim();
        if (!title || /^(title|topic|s\/n|sn|#)/i.test(title)) continue;
        const catRaw = parts[1] || '';
        const cat    = CAT_LIST.find(c => c.toLowerCase() === catRaw.toLowerCase()) || 'Nursing Science';
        parsed.push({
          title,
          category:    cat,
          pages:       parts[2] ? parts[2].replace(/\D/g,'') : '',
          price:       fmtPrice(parts[3] || ''),
          description: parts[4] || '',
          badge:       parts[5] ? (BADGE_MAP[parts[5].toLowerCase().trim()] || '') : '',
        });
      }
    } else if (pipeCount > lines.length * 0.4) {
      // ── Pipe-separated ────────────────────────────────────
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        const title = parts[0].replace(/^\s*\d+[).:\-]?\s+/, '').trim();
        if (!title || title.length < 4 || /^(title|topic|s\/n)/i.test(title)) continue;
        const catRaw = parts[1] || '';
        const cat    = CAT_LIST.find(c => c.toLowerCase() === catRaw.toLowerCase()) || 'Nursing Science';
        parsed.push({
          title,
          category:    cat,
          pages:       parts[2] ? parts[2].replace(/\D/g,'') : '',
          price:       fmtPrice(parts[3] || ''),
          description: parts[4] || '',
          badge:       parts[5] ? (BADGE_MAP[parts[5].toLowerCase().trim()] || '') : '',
        });
      }
    } else {
      // ── Freeform: parse each line back-to-front ────────────
      for (const line of lines) {
        const result = parseLine(line);
        if (result) parsed.push(result);
      }
    }

    if (parsed.length === 0) {
      showToast('⚠️ No topics found. Check format — one topic per line.');
      return;
    }
    setBulkParsed(parsed);
    showToast(`✅ ${parsed.length} topics parsed — review and edit before uploading.`);
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
      setPasteMode(false);
      setPasteText('');
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
    card:   { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, marginBottom: 12 },
    badge:  (st) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: STATUS_COLORS[st]?.bg || '#eee', color: STATUS_COLORS[st]?.color || '#333' }),
    btn:    (bg, color='#fff') => ({ background: bg, color, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }),
    input:  { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
    lbl:    { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  };

  const pendingCount     = requests.filter(r => r.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending').length;
  const totalRevenue     = paymentSplits.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalPendingPay  = paymentSplits.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.writerAmount || 0), 0);

  const navGroups = [
    { label: 'Main',    keys: ['dashboard','requests','topics'] },
    { label: 'Comms',   keys: ['messages'] },
    { label: 'Finance', keys: ['withdrawals','payments'] },
    { label: 'Manage',  keys: ['users'] },
    { label: 'Tools',   keys: ['ai_writer'] },
  ];

  const navBadge = (key) => {
    if (key === 'requests')    return pendingCount > 0 ? pendingCount : null;
    if (key === 'withdrawals') return pendingWithdrawals > 0 ? pendingWithdrawals : null;
    return null;
  };

  const handleNav = (key) => { setTab(key); setSidebarOpen(false); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64, position: 'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .admin-sidebar { transition: transform 0.28s cubic-bezier(.4,0,.2,1); }
        @media (max-width: 900px) {
          .admin-sidebar { position: fixed !important; top: 64px !important; left: 0 !important; height: calc(100vh - 64px) !important; z-index: 300 !important; }
          .admin-sidebar.closed { transform: translateX(-110%) !important; }
          .admin-menu-btn { display: flex !important; }
          .admin-main { padding: 16px !important; }
        }
        @media (min-width: 901px) {
          .admin-sidebar { position: sticky !important; top: 64px !important; transform: none !important; height: calc(100vh - 64px) !important; }
          .admin-menu-btn { display: none !important; }
        }
        .admin-menu-btn { display: none; }
        .admin-nav-btn:hover { background: rgba(13,148,136,0.09) !important; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`admin-sidebar${sidebarOpen ? '' : ' closed'}`}
        style={{ width: 236, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>

        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,var(--blue-deep),var(--teal-dark))' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Admin Control</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff' }}>🛡️ Elite Cafe</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Management Portal</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pendingCount > 0 && <span style={{ background: 'rgba(239,68,68,0.85)', color: '#fff', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{pendingCount} pending</span>}
            {pendingWithdrawals > 0 && <span style={{ background: 'rgba(245,158,11,0.85)', color: '#fff', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{pendingWithdrawals} payouts</span>}

          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navGroups.map(grp => {
            const items = NAV.filter(n => grp.keys.includes(n.key));
            if (!items.length) return null;
            return (
              <div key={grp.label} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, padding: '0 8px', marginBottom: 4 }}>{grp.label}</div>
                {items.map(n => {
                  const active = tab === n.key;
                  const badge  = navBadge(n.key);
                  return (
                    <button key={n.key} className="admin-nav-btn" onClick={() => handleNav(n.key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 8, background: active ? 'rgba(13,148,136,0.15)' : 'transparent', border: `1px solid ${active ? 'var(--teal)' : 'transparent'}`, color: active ? 'var(--teal)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all 0.18s', fontWeight: active ? 700 : 400 }}>
                      <span>{n.label}</span>
                      {badge && <span style={{ background: active ? 'var(--teal)' : '#EF4444', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Stats footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', fontSize: 12 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#16A34A' }}>₦{totalRevenue.toLocaleString()}</div>
        </div>
      </aside>

      {/* Sidebar backdrop on mobile */}
      {sidebarOpen && (
        <div className="admin-menu-btn" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,0.45)', zIndex: 299, display: 'block' }} />
      )}

      {/* ── Main content ────────────────────────────────── */}
      <main className="admin-main" style={{ flex: 1, padding: 'clamp(18px,3vw,32px)', overflowY: 'auto', minWidth: 0, animation: 'fadeIn 0.25s ease' }}>

        {/* Mobile top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 13px', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span className="admin-menu-btn" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {NAV.find(n => n.key === tab)?.label || ''}
          </span>
        </div>

        {/* ══════════════ DASHBOARD ══════════════ */}
        {tab === 'dashboard' && (
          <AdminDashboard
            requests={requests} topics={topics} users={users}
            paymentSplits={paymentSplits} withdrawalRequests={withdrawalRequests}
            s={s} onNav={handleNav}
          />
        )}


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
                  onClick={() => { setSelectedRequest(req); subscribeOrderChat(req.id); }}>
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
                  <button onClick={() => { setSelectedRequest(null); setOrderChatMessages([]); if (orderChatUnsub) { orderChatUnsub(); setOrderChatUnsub(null); } }} style={s.btn('#eee', '#333')}>✕ Close</button>
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
                      handleNav('messages');
                    }}>
                    💬 Message
                  </button>
                </div>

                {/* ── Finished Work Upload ── */}
                <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>📤 Finished Work</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Upload the completed file here. The client can download it after paying the final balance.</div>

                {selectedRequest.draftFileData ? (
                  <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>✅ File uploaded</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>📎</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedRequest.draftFileName || 'Completed file'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={selectedRequest.draftFileData} download={selectedRequest.draftFileName || 'completed-work'}
                          style={{ ...s.btn('var(--teal)'), padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>
                          ⬇️ Download
                        </a>
                        <label style={{ ...s.btn('#6B7280'), padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                          🔄 Replace
                          <input type="file" style={{ display: 'none' }}
                            onChange={async e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              if (file.size > 10 * 1024 * 1024) { showToast('❌ File must be under 10MB'); return; }
                              setSaving(true);
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                await updateDoc(doc(db, 'serviceRequests', selectedRequest.id), { draftFileData: reader.result, draftFileName: file.name, draftUploadedAt: serverTimestamp() });
                                setSelectedRequest(r => ({ ...r, draftFileData: reader.result, draftFileName: file.name }));
                                showToast('✅ File replaced');
                                setSaving(false);
                              };
                              reader.readAsDataURL(file);
                            }} />
                        </label>
                      </div>
                    </div>
                    {selectedRequest.finalPaid && <div style={{ marginTop: 8, fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Client has paid in full — file is visible to them</div>}
                    {!selectedRequest.finalPaid && <div style={{ marginTop: 8, fontSize: 12, color: '#D97706' }}>⏳ Hidden from client until final payment is made</div>}
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)', boxSizing: 'border-box', marginBottom: 10 }}>
                    {saving ? '⏳ Uploading...' : '📤 Upload Finished Work'}
                    <input type="file" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { showToast('❌ File must be under 10MB'); return; }
                        setSaving(true);
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          await updateDoc(doc(db, 'serviceRequests', selectedRequest.id), { draftFileData: reader.result, draftFileName: file.name, draftUploadedAt: serverTimestamp(), status: 'completed', updatedAt: serverTimestamp() });
                          setSelectedRequest(r => ({ ...r, draftFileData: reader.result, draftFileName: file.name, status: 'completed' }));
                          if (selectedRequest.userId) {
                            await addDoc(collection(db, 'notifications'), { userId: selectedRequest.userId, title: '🎉 Your work is ready!', body: `Your order "${selectedRequest.serviceTitle || 'order'}" is complete. Pay the final balance to download.`, type: 'alert', read: false, createdAt: serverTimestamp() });
                          }
                          showToast('✅ Work uploaded — status set to completed');
                          setSaving(false);
                        };
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                )}



                {/* ── Order Chat ── */}
                <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  💬 Order Chat
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Back-and-forth with client &amp; writer. Send files and messages.
                </div>

                {/* Messages area */}
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 320, overflow: 'hidden' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderChatMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
                        No messages yet — start the conversation! 👋
                      </div>
                    ) : (
                      orderChatMessages.map(m => {
                        const isAdmin  = m.senderRole === 'admin' || m.sender === 'admin';
                        const isWriter = m.senderRole === 'writer';
                        const align    = isAdmin ? 'flex-end' : 'flex-start';

                        // ── Payment receipt bubble ──────────────────────────
                        if (m.type === 'payment_receipt') {
                          const isImage     = m.fileType?.startsWith('image/');
                          const payStatus   = selectedRequest?.paymentStatus || '';
                          const isConfirmed = payStatus === `${m.paymentStage}_confirmed`;
                          return (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                              <div style={{ width: '100%', maxWidth: 360, borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${isConfirmed ? 'rgba(22,163,74,0.45)' : 'rgba(245,158,11,0.55)'}`, background: 'var(--bg-card)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
                                {/* Receipt header */}
                                <div style={{ padding: '10px 14px', background: isConfirmed ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 18 }}>🧾</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: isConfirmed ? '#16A34A' : '#D97706' }}>
                                      Payment Receipt — {m.stageLabel}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                      {m.senderName} · {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                                    </div>
                                  </div>
                                  {isConfirmed && <span style={{ fontSize: 18 }}>✅</span>}
                                </div>
                                {/* Image preview */}
                                {isImage && m.fileData && (
                                  <img src={m.fileData} alt="Receipt"
                                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', borderBottom: '1px solid var(--border)' }} />
                                )}
                                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {/* File name + download */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 18 }}>{isImage ? '🖼️' : '📄'}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>{m.fileName}</span>
                                    <a href={m.fileData} download={m.fileName}
                                      style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                      ⬇️ Download
                                    </a>
                                  </div>
                                  {/* Confirm button or confirmed state */}
                                  {!isConfirmed ? (
                                    <button
                                      onClick={() => confirmManualPayment(
                                        m.paymentStage,
                                        null,
                                        selectedRequest.id,
                                        selectedRequest.userId,
                                        selectedRequest.serviceTitle || selectedRequest.serviceKey || 'your order'
                                      )}
                                      disabled={confirmingPayment}
                                      style={{ width: '100%', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: confirmingPayment ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)', opacity: confirmingPayment ? 0.6 : 1 }}>
                                      {confirmingPayment ? '⏳ Confirming...' : `✅ Confirm ${m.paymentStage === 'advance' ? 'Advance' : 'Final'} Payment`}
                                    </button>
                                  ) : (
                                    <div style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A', fontSize: 13, padding: '8px 0', background: 'rgba(22,163,74,0.07)', borderRadius: 8 }}>
                                      ✅ Payment Confirmed — Client notified
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // ── Regular message bubble ──────────────────────────
                        const bubbleColor = isAdmin ? 'var(--teal)' : isWriter ? '#7C3AED' : 'var(--bg-card)';
                        const textColor   = isAdmin || isWriter ? '#fff' : 'var(--text-primary)';
                        const radius      = isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
                        return (
                          <div key={m.id} style={{ display: 'flex', justifyContent: align }}>
                            <div style={{ maxWidth: '78%', background: bubbleColor, color: textColor, borderRadius: radius, padding: '9px 13px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: isAdmin || isWriter ? 'none' : '1px solid var(--border)' }}>
                              {!isAdmin && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: isWriter ? '#C4B5FD' : 'var(--teal)', marginBottom: 3 }}>
                                  {m.senderName || (isWriter ? 'Writer' : 'Client')}
                                </div>
                              )}
                              {m.type === 'file' ? (
                                <a href={m.fileData} download={m.fileName}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: isAdmin || isWriter ? '#fff' : 'var(--teal)', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                                  <span style={{ fontSize: 18 }}>📎</span>
                                  <div>
                                    <div style={{ wordBreak: 'break-word' }}>{m.fileName}</div>
                                    <div style={{ fontSize: 10, opacity: 0.7 }}>{m.fileSize ? `${(m.fileSize / 1024).toFixed(1)} KB` : ''} · Download</div>
                                  </div>
                                </a>
                              ) : (
                                <div style={{ fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word' }}>{m.text}</div>
                              )}
                              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                                {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                                {isAdmin && <span style={{ marginLeft: 4 }}>{m.readByClient && m.readByWriter ? ' ✓✓' : ' ✓'}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={orderChatEndRef} />
                  </div>

                  {/* Input with file attach */}
                  <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                    <label title="Attach file" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0, fontSize: 15 }}>
                      📎
                      <input type="file" style={{ display: 'none' }}
                        onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { showToast('❌ File must be under 10MB'); return; }
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              await addDoc(collection(db, 'orderChats', selectedRequest.id, 'messages'), {
                                sender: 'admin', senderName: 'Admin', senderRole: 'admin',
                                type: 'file', fileName: file.name, fileData: reader.result, fileSize: file.size,
                                readByAdmin: true, readByClient: false, readByWriter: false,
                                createdAt: serverTimestamp(),
                              });
                              if (selectedRequest.userId) {
                                await addDoc(collection(db, 'notifications'), { userId: selectedRequest.userId, title: '📎 Admin sent a file', body: `File: ${file.name}`, type: 'message', projectId: selectedRequest.id, read: false, createdAt: serverTimestamp() });
                              }
                              showToast('✅ File sent');
                            } catch (err) { showToast('❌ ' + err.message); }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }} />
                    </label>
                    <input
                      value={orderChatText}
                      onChange={e => setOrderChatText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendOrderChatMsg(); } }}
                      placeholder="Type a message or attach a file…"
                      style={{ flex: 1, padding: '9px 13px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 24, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
                    />
                    <button
                      onClick={sendOrderChatMsg}
                      disabled={!orderChatText.trim() || orderChatSending}
                      style={{ width: 38, height: 38, borderRadius: '50%', background: orderChatText.trim() ? 'var(--teal)' : 'var(--bg-tertiary)', border: 'none', cursor: orderChatText.trim() ? 'pointer' : 'default', color: orderChatText.trim() ? '#fff' : 'var(--text-muted)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {orderChatSending ? '…' : '➤'}
                    </button>
                  </div>
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedTopics.size > 0 && (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{selectedTopics.size} selected</span>
                    <button style={s.btn('#EF4444')} onClick={deleteSelectedTopics} disabled={saving}>
                      🗑️ Delete Selected ({selectedTopics.size})
                    </button>
                    <button style={s.btn('#6B7280')} onClick={() => setSelectedTopics(new Set())}>
                      ✕ Clear
                    </button>
                  </>
                )}
                <button style={s.btn('var(--blue-deep)')} onClick={() => { setBulkMode(true); setPasteMode(false); setTopicForm(null); }}>
                  📂 Bulk Upload
                </button>
                <button style={{ ...s.btn(pasteMode ? '#7C3AED' : '#4F46E5') }} onClick={() => { setPasteMode(p => !p); setBulkMode(false); setTopicForm(null); setBulkParsed([]); }}>
                  📋 Paste Topics
                </button>
                <button style={s.btn('var(--teal)')}
                  onClick={() => { setTopicForm({ title: '', category: 'Nursing Science', pages: '', price: '', description: '', badge: '' }); setBulkMode(false); setPasteMode(false); }}>
                  ＋ Add New Topic
                </button>
                {topics.length > 0 && (
                  <button style={s.btn('#EF4444')} onClick={deleteAllTopics} disabled={saving}>
                    🗑️ Delete All ({topics.length})
                  </button>
                )}
              </div>
            </div>

            {/* ── Paste Topics Panel ── */}
            {pasteMode && (
              <div style={{ ...s.card, border: '2px solid #7C3AED', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: '#7C3AED', margin: 0 }}>
                    📋 Paste Research Topics
                    {bulkParsed.length > 0 && (
                      <span style={{ marginLeft: 10, background: '#7C3AED', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                        {bulkParsed.length} ready
                      </span>
                    )}
                  </h3>
                  <button style={s.btn('#94A3B8')} onClick={() => { setPasteMode(false); setPasteText(''); setBulkParsed([]); }}>✕ Close</button>
                </div>

                {/* Input area — shown when no parsed results yet */}
                {bulkParsed.length === 0 && (
                  <>
                    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      The system auto-detects and parses <strong style={{ color: 'var(--text-primary)' }}>title, category, pages, price, and badge</strong> from your pasted text. Supports 4 formats:
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          ['📋 Tab / Excel', 'Title [TAB] Category [TAB] Pages [TAB] Price [TAB] Description [TAB] Badge'],
                          ['| Pipe',         'Title | Category | Pages | Price | Description | Badge'],
                          [', CSV',          'Title, Category, Pages, Price, Description, Badge'],
                          ['🔤 Freeform',    '1. Topic title — Nursing Science, 65 pages, ₦5,000 (price/pages/category extracted automatically)'],
                        ].map(([label, ex]) => (
                          <div key={label} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#7C3AED', minWidth: 90, fontSize: 12 }}>{label}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{ex}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        Category is auto-detected from title keywords (e.g. "nursing", "accounting", "computer"). Price and pages are extracted from anywhere in the line.
                      </div>
                    </div>

                    <textarea
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder={`Examples of all 4 supported formats:\n\n— Tab/Excel (copy directly from spreadsheet):\nEffect of malaria on pregnancy\tNursing Science\t65\t₦5,000\t\tNew\n\n— Pipe separated:\nKnowledge of infection control among nurses | Nursing Science | 75 | ₦6,000 | | Popular\n\n— CSV:\nAntenatal care utilization among pregnant women, Public Health, 80, ₦7,500, , New\n\n— Freeform (auto-detect everything):\n1. Prevalence of hypertension among adults — Nursing Science, 65 pages, ₦5,000\n2. Impact of community health education on child mortality ₦6,500 80 pages\n3. Knowledge and practice of hand hygiene among healthcare workers`}
                      rows={14}
                      style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}
                    />

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => parsePastedTopics(pasteText)}
                        disabled={!pasteText.trim()}
                        style={{ ...s.btn('#7C3AED'), flex: 1, padding: '11px', fontSize: 14, opacity: pasteText.trim() ? 1 : 0.5 }}>
                        ⚡ Parse Topics
                      </button>
                      <button onClick={() => setPasteText('')}
                        style={{ ...s.btn('var(--bg-tertiary)', 'var(--text-muted)'), border: '1px solid var(--border)', padding: '11px 18px' }}>
                        Clear
                      </button>
                    </div>

                    {pasteText.trim() && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                        ~{pasteText.split('\n').filter(l => l.trim().length > 4).length} lines detected
                      </div>
                    )}
                  </>
                )}

                {/* Editable preview table — shown after parsing */}
                {bulkParsed.length > 0 && (
                  <div>
                    {/* Re-paste bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{bulkParsed.length}</strong> topics parsed — review and edit, then upload.
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setBulkParsed([]); }}
                          style={{ ...s.btn('var(--bg-tertiary)', 'var(--text-muted)'), border: '1px solid var(--border)', padding: '7px 14px', fontSize: 12 }}>
                          ← Paste Again
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete all ${bulkParsed.length} topics? This cannot be undone.`)) setBulkParsed([]);
                          }}
                          style={{ ...s.btn('#EF4444'), padding: '7px 14px', fontSize: 12 }}>
                          🗑️ Delete All
                        </button>
                      </div>
                    </div>

                    {/* Global defaults bar — set category/price/badge for all rows at once */}
                    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                        ⚡ Apply to All Rows
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2, minWidth: 140 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Category</div>
                          <select
                            onChange={e => { if (e.target.value) setBulkParsed(p => p.map(r => ({ ...r, category: e.target.value }))); }}
                            style={{ ...s.input, marginBottom: 0, fontSize: 12, padding: '7px 10px' }}
                            defaultValue="">
                            <option value="">— set for all —</option>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 90 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Price (₦)</div>
                          <input
                            placeholder="e.g. ₦5,000"
                            style={{ ...s.input, marginBottom: 0, fontSize: 12, padding: '7px 10px' }}
                            onBlur={e => { if (e.target.value.trim()) setBulkParsed(p => p.map(r => ({ ...r, price: e.target.value.trim() }))); }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 90 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Pages</div>
                          <input
                            placeholder="e.g. 65"
                            style={{ ...s.input, marginBottom: 0, fontSize: 12, padding: '7px 10px' }}
                            onBlur={e => { if (e.target.value.trim()) setBulkParsed(p => p.map(r => ({ ...r, pages: e.target.value.trim() }))); }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Badge</div>
                          <select
                            onChange={e => { if (e.target.value !== '__none') setBulkParsed(p => p.map(r => ({ ...r, badge: e.target.value === '__clear' ? '' : e.target.value }))); }}
                            style={{ ...s.input, marginBottom: 0, fontSize: 12, padding: '7px 10px' }}
                            defaultValue="__none">
                            <option value="__none">— set for all —</option>
                            <option value="__clear">None (clear)</option>
                            <option value="Popular">🔥 Popular</option>
                            <option value="New">✨ New</option>
                            <option value="Hidden">🚫 Hidden</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Editable table */}
                    <div style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 860 }}>
                        <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 2 }}>
                          <tr>
                            {['#', 'Title', 'Category', 'Pages', 'Price (₦)', 'Description', 'Badge', ''].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkParsed.map((t, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                              <td style={{ padding: '6px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 11, width: 28, userSelect: 'none' }}>{i + 1}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 220 }}>
                                <input value={t.title}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, title: e.target.value} : r))}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, width: '100%', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 140 }}>
                                <select value={t.category}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, category: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-body)', width: '100%' }}>
                                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 70 }}>
                                <input value={t.pages}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, pages: e.target.value} : r))}
                                  placeholder="65" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: 50, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 90 }}>
                                <input value={t.price}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, price: e.target.value} : r))}
                                  placeholder="₦5,000" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontWeight: 700, width: 75, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 180 }}>
                                <input value={t.description}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, description: e.target.value} : r))}
                                  placeholder="Brief description..." style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: '100%', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 110 }}>
                                <select value={t.badge}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, badge: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-body)' }}>
                                  <option value="">None</option>
                                  <option value="Popular">🔥 Popular</option>
                                  <option value="New">✨ New</option>
                                  <option value="Hidden">🚫 Hidden</option>
                                </select>
                              </td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 36 }}>
                                <button onClick={() => setBulkParsed(p => p.filter((_,j) => j !== i))}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14, padding: '2px 4px' }}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button onClick={uploadBulkTopics} disabled={bulkUploading}
                      style={{ ...s.btn('#7C3AED'), width: '100%', marginTop: 14, padding: '13px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {bulkUploading
                        ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Uploading {bulkParsed.length} topics...</>
                        : `🚀 Upload All ${bulkParsed.length} Topics to Firestore`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Bulk Upload Panel ── */}
            {bulkMode && (
              <div style={{ ...s.card, border: '2px solid var(--blue-deep)', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--blue-deep)', margin: 0 }}>📂 Bulk Upload Topics</h3>
                  <button style={s.btn('#94A3B8')} onClick={() => { setBulkMode(false); setBulkParsed([]); setPasteMode(false); }}>✕ Close</button>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Supported formats:</strong><br />
                  • <strong>.csv / .txt</strong> — columns: <code>Title, Category, Pages, Price, Description, Badge</code><br />
                  • <strong>.xlsx / .xls</strong> — same columns as headers (order doesn't matter)<br />
                  • <strong>Plain .txt</strong> — one topic title per line (fill details in preview table below)<br />
                  • Word docs (.docx) — save as .txt or .csv first
                </div>

                {/* Drop zone */}
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px', cursor: 'pointer', marginBottom: 16, background: 'var(--bg-secondary)', gap: 8 }}>
                  <span style={{ fontSize: '2.5rem' }}>📁</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>Click to choose file or drag & drop</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>.csv, .txt, .xlsx, .xls</span>
                  <input type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files[0]) parseBulkFile(e.target.files[0]); e.target.value = ''; }} />
                </label>

                {/* Parsed preview — editable table with ALL fields from screenshot */}
                {bulkParsed.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{bulkParsed.length} topics ready to upload</span>
                      <button style={{ ...s.btn('#EF4444'), padding: '5px 12px', fontSize: 12 }} onClick={() => setBulkParsed([])}>Clear</button>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 860 }}>
                        <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                          <tr>
                            {['#','Title','Category','Pages','Price (₦)','Description','Badge','Del'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkParsed.map((t, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                              <td style={{ padding: '6px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 11, width: 28 }}>{i + 1}</td>
                              {/* Title */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 200 }}>
                                <input value={t.title}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, title: e.target.value} : r))}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, width: '100%', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              {/* Category */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 140 }}>
                                <select value={t.category}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, category: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-body)', width: '100%' }}>
                                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              </td>
                              {/* Pages */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 70 }}>
                                <input value={t.pages}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, pages: e.target.value} : r))}
                                  placeholder="65" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: 50, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              {/* Price */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 90 }}>
                                <input value={t.price}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, price: e.target.value} : r))}
                                  placeholder="₦5,000" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontWeight: 700, width: 75, fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              {/* Description */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', minWidth: 180 }}>
                                <input value={t.description}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, description: e.target.value} : r))}
                                  placeholder="Brief description..." style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: '100%', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }} />
                              </td>
                              {/* Badge */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 110 }}>
                                <select value={t.badge}
                                  onChange={e => setBulkParsed(p => p.map((r,j) => j===i ? {...r, badge: e.target.value} : r))}
                                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px', fontFamily: 'var(--font-body)' }}>
                                  <option value="">None</option>
                                  <option value="Popular">🔥 Popular</option>
                                  <option value="New">✨ New</option>
                                  <option value="Hidden">🚫 Hidden</option>
                                </select>
                              </td>
                              {/* Delete row */}
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', width: 36 }}>
                                <button onClick={() => setBulkParsed(p => p.filter((_,j) => j !== i))}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14, padding: '2px 4px' }}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={uploadBulkTopics} disabled={bulkUploading}
                      style={{ ...s.btn('var(--teal)'), width: '100%', marginTop: 14, padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
                    <select value={topicForm.category || 'Nursing Science'}
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
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: 40 }}>
                      <input type="checkbox"
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#EF4444' }}
                        checked={topics.length > 0 && selectedTopics.size === topics.length}
                        onChange={() => {
                          if (selectedTopics.size === topics.length) setSelectedTopics(new Set());
                          else setSelectedTopics(new Set(topics.map(t => t.id)));
                        }}
                        title="Select all"
                      />
                    </th>
                    {['Title','Category','Pages','Price','Badge','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topics.map(t => (
                    <tr key={t.id} style={{ opacity: t.badge === 'Hidden' ? 0.5 : 1, background: selectedTopics.has(t.id) ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        <input type="checkbox"
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#EF4444' }}
                          checked={selectedTopics.has(t.id)}
                          onChange={() => {
                            setSelectedTopics(prev => {
                              const next = new Set(prev);
                              next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                              return next;
                            });
                          }}
                        />
                      </td>
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
          <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 160px)', overflow: 'hidden', position: 'relative' }}>
            <style>{`
              @media (max-width: 768px) {
                .msg-sidebar { position: absolute !important; left: 0; top: 0; bottom: 0; width: 100% !important; z-index: 2; transition: transform 0.3s ease; }
                .msg-sidebar.hidden { transform: translateX(-110%); }
                .msg-chat { position: absolute !important; left: 0; top: 0; right: 0; bottom: 0; width: 100% !important; z-index: 1; }
              }
              @media (min-width: 769px) {
                .msg-sidebar { width: 280px; flex-shrink: 0; }
                .msg-sidebar.hidden { display: flex !important; transform: none !important; }
                .msg-chat { flex: 1; min-width: 0; }
              }
            `}</style>
            <div className={`msg-sidebar${selectedUser ? ' hidden' : ''}`} style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 10px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[['all','👥 All'],['writers','✍️ Writers'],['clients','🎓 Clients']].map(([val, label]) => (
                    <button key={val} onClick={() => setMsgFilter(val)}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s', background: msgFilter === val ? 'var(--teal)' : 'var(--bg-tertiary)', color: msgFilter === val ? '#fff' : 'var(--text-muted)' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {(msgFilter === 'writers' || msgFilter === 'all') && (
                  <button onClick={() => setBroadcastMode(m => !m)}
                    style={{ ...s.btn(broadcastMode ? '#7C3AED' : 'var(--bg-tertiary)', broadcastMode ? '#fff' : 'var(--text-secondary)'), width: '100%', marginBottom: 10, fontSize: 12, border: '1px solid var(--border)' }}>
                    📢 Broadcast to all writers
                  </button>
                )}
              </div>
              {broadcastMode && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.07)', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, marginBottom: 6 }}>
                    📢 Message all {users.filter(u => u.isWriter || u.role === 'writer').length} writers
                  </div>
                  <textarea rows={3} value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Type your broadcast message..." style={{ ...s.input, marginBottom: 8, fontSize: 12, resize: 'none' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={broadcastToWriters} disabled={broadcasting || !broadcastText.trim()}
                      style={{ ...s.btn('#7C3AED'), flex: 1, fontSize: 12, opacity: broadcastText.trim() ? 1 : 0.5 }}>
                      {broadcasting ? 'Sending...' : '📤 Send to All'}
                    </button>
                    <button onClick={() => { setBroadcastMode(false); setBroadcastText(''); }} style={{ ...s.btn('#94A3B8'), fontSize: 12 }}>✕</button>
                  </div>
                </div>
              )}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {users.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users yet</div>}
                {users.filter(u => !u.isAdmin).filter(u => {
                    if (msgFilter === 'writers') return u.isWriter || u.role === 'writer';
                    if (msgFilter === 'clients') return !u.isWriter && u.role !== 'writer';
                    return true;
                  }).map(u => (
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

            <div className="msg-chat" style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selectedUser ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                  <span style={{ fontSize: '3.5rem' }}>💬</span>
                  <p style={{ fontSize: 14 }}>Select a user to start chatting</p>
                </div>
              ) : (
                <>
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
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 13 }}>No messages yet. Say hello! 👋</div>}
                    {messages.map(msg => {
                      const isAdm = msg.sender === 'admin';
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isAdm ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.55, background: isAdm ? 'var(--teal)' : 'var(--bg-tertiary)', color: isAdm ? '#fff' : 'var(--text-primary)', border: !isAdm ? '1px solid var(--border)' : 'none', borderBottomRightRadius: isAdm ? 4 : 16, borderBottomLeftRadius: !isAdm ? 4 : 16 }}>
                            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 5, fontWeight: 700, letterSpacing: 0.3 }}>{isAdm ? '🛡️ Admin' : (msg.senderName || '👤 Client')}</div>
                            {msg.type === 'audio' ? <audio controls src={msg.audioData} style={{ maxWidth: 220, height: 36, display: 'block' }} /> : <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>}
                            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 5, textAlign: 'right' }}>{msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEnd} />
                  </div>
                  {audioBlob && (
                    <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 36, flex: 1 }} />
                      <button onClick={() => setAudioBlob(null)} style={{ ...s.btn('#EF4444'), padding: '6px 12px' }}>✕</button>
                      <button onClick={sendMessage} style={{ ...s.btn('var(--teal)'), padding: '6px 14px' }}>Send 🎙️</button>
                    </div>
                  )}
                  {!audioBlob && (
                    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)', flexShrink: 0 }}>
                      <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Type a message..." style={{ ...s.input, marginBottom: 0, flex: 1 }} />
                      <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={e => { e.preventDefault(); startRecording(); }} onTouchEnd={stopRecording}
                        style={{ ...s.btn(recording ? '#EF4444' : 'var(--bg-secondary)', recording ? '#fff' : 'var(--text-secondary)'), padding: '10px 14px', fontSize: 18, border: '1px solid var(--border)', flexShrink: 0 }}>
                        {recording ? '⏹' : '🎙️'}
                      </button>
                      <button onClick={sendMessage} disabled={!newMessage.trim()} style={{ ...s.btn('var(--teal)'), padding: '10px 18px', flexShrink: 0, opacity: newMessage.trim() ? 1 : 0.5 }}>➤</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ WITHDRAWALS ══════════════ */}
        {tab === 'withdrawals' && (
          <WithdrawalsTab withdrawalRequests={withdrawalRequests} users={users} s={s} showToast={showToast} />
        )}

        {/* ══════════════ PAYMENTS ══════════════ */}
        {tab === 'payments' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 6 }}>Payment Splits</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>All completed project payouts — pending and paid.</p>
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
                      return (
                        <tr key={sp.id}>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>{sp.createdAt?.toDate?.()?.toLocaleDateString() || '—'}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>{sp.splitType?.replace(/_/g, ' ')}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{recipientUser?.name || sp.writerId || 'Admin'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>₦{sp.totalAmount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#16A34A', borderBottom: '1px solid var(--border)' }}>₦{sp.writerAmount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sp.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', color: sp.status === 'paid' ? '#16A34A' : '#D97706' }}>{sp.status === 'paid' ? 'Paid' : 'Pending'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            {sp.status !== 'paid' && (
                              <button onClick={async () => { await updateDoc(doc(db, 'paymentSplits', sp.id), { status: 'paid', paidAt: serverTimestamp() }); showToast('✅ Marked as paid'); }}
                                style={{ ...s.btn('#16A34A'), padding: '5px 12px', fontSize: 12 }}>✅ Mark Paid</button>
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

        {/* ══════════════ USERS ══════════════ */}
        {tab === 'users' && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 6 }}>🔗 Your Admin Referral Link</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Share this link. Clients who register through it will be assigned to you. You earn <strong style={{ color: 'var(--gold)' }}>95%</strong> if you write it, or writers get <strong style={{ color: 'var(--gold)' }}>95%</strong> if you push to them.
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{window.location.origin}/register?ref=admin</div>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=admin`); showToast('📋 Copied!'); }} style={{ ...s.btn('var(--gold)', '#000'), flexShrink: 0 }}>Copy</button>
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
                            <button style={{ ...s.btn(u.isAdmin ? '#EF4444' : 'var(--blue-deep)'), padding: '5px 12px', fontSize: 12 }} onClick={() => toggleAdminUser(u.id, u.isAdmin)}>
                              {u.isAdmin ? '🚫 Remove Admin' : '🛡️ Make Admin'}
                            </button>
                            <button style={{ ...s.btn('var(--teal)'), padding: '5px 12px', fontSize: 12 }} onClick={() => { setSelectedUser(u); handleNav('messages'); }}>💬 Chat</button>
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

        {/* ══════════════ AI WRITER ══════════════ */}
        {tab === 'ai_writer' && (
          <div style={{ margin: '0 -20px' }}>
            <AIResearchWriterPage />
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.95)', color: '#fff', padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600, zIndex: 9999, backdropFilter: 'blur(10px)', border: '1px solid rgba(13,148,136,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────
function AdminDashboard({ requests, topics, users, paymentSplits, withdrawalRequests, s, onNav }) {
  const totalRequests   = requests.length;
  const pendingReqs     = requests.filter(r => r.status === 'pending').length;
  const inProgress      = requests.filter(r => r.status === 'in_progress').length;
  const completed       = requests.filter(r => r.status === 'completed').length;
  const totalClients    = users.filter(u => !u.isAdmin && !u.isWriter && u.role !== 'writer').length;
  const totalWriters    = users.filter(u => u.isWriter || u.role === 'writer').length;
  const totalRevenue    = paymentSplits.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const pendingPayouts  = paymentSplits.filter(p => p.status !== 'paid').reduce((sum, p) => sum + (p.writerAmount || 0), 0);
  const pendingWithdraw = withdrawalRequests.filter(w => w.status === 'pending').length;

  // Recent activity — last 5 requests
  const recent = [...requests].slice(0, 5);

  // Status breakdown for bar chart
  const statusCounts = {};
  requests.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>🏠 Dashboard</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Live overview of Elite Mobile Cafe operations.</p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Revenue',    value: `₦${totalRevenue.toLocaleString()}`,  color: '#16A34A', bg: 'rgba(22,163,74,0.07)',   icon: '💰', nav: 'payments' },
          { label: 'Pending Payouts',  value: `₦${pendingPayouts.toLocaleString()}`,color: '#D97706', bg: 'rgba(217,119,6,0.07)',   icon: '⏳', nav: 'payments' },
          { label: 'Pending Requests', value: pendingReqs,                           color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   icon: '📋', nav: 'requests' },
          { label: 'In Progress',      value: inProgress,                            color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', icon: '⚙️', nav: 'requests' },
          { label: 'Completed',        value: completed,                             color: '#0D9488', bg: 'rgba(13,148,136,0.07)', icon: '✅', nav: 'requests' },
          { label: 'Total Clients',    value: totalClients,                          color: '#2563EB', bg: 'rgba(37,99,235,0.07)',  icon: '🎓', nav: 'users'    },
          { label: 'Writers',          value: totalWriters,                          color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', icon: '✍️', nav: 'users'    },
          { label: 'Payout Requests',  value: pendingWithdraw,                      color: '#D97706', bg: 'rgba(217,119,6,0.07)',   icon: '💸', nav: 'withdrawals' },
        ].map(kpi => (
          <button key={kpi.label} onClick={() => onNav(kpi.nav)}
            style={{ ...s.card, textAlign: 'left', cursor: 'pointer', background: kpi.bg, border: `1px solid ${kpi.color}22`, marginBottom: 0, transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = kpi.color+'55'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = kpi.color+'22'; }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{kpi.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, marginBottom: 24 }}>

        {/* Status breakdown */}
        <div style={{ ...s.card, marginBottom: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>📊 Requests by Status</div>
          {Object.entries(statusCounts).sort((a,b) => b[1]-a[1]).map(([status, count]) => {
            const cfg = { pending: '#D97706', reviewing: '#2563EB', accepted: '#0D9488', in_progress: '#7C3AED', completed: '#16A34A', rejected: '#EF4444', priced: '#C9A84C' };
            const color = cfg[status] || '#94A3B8';
            return (
              <div key={status} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status.replace('_',' ')}</span>
                  <span style={{ fontWeight: 700, color }}>{count}</span>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 20, height: 7, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: color, borderRadius: 20, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
          {Object.keys(statusCounts).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No requests yet.</p>}
        </div>

        {/* Quick actions */}
        <div style={{ ...s.card, marginBottom: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>⚡ Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '📋 View Pending Requests', nav: 'requests', color: '#EF4444', badge: pendingReqs > 0 ? pendingReqs : null },
              { label: '💸 Process Withdrawals',   nav: 'withdrawals', color: '#D97706', badge: pendingWithdraw > 0 ? pendingWithdraw : null },
              { label: '📚 Add Research Topic',    nav: 'topics',   color: '#0D9488' },
              { label: '💬 Message a User',         nav: 'messages', color: '#7C3AED' },
              { label: '👥 Manage Users',           nav: 'users',    color: '#2563EB' },
              { label: '💰 Review Payments',        nav: 'payments', color: '#16A34A' },
            ].map(a => (
              <button key={a.nav} onClick={() => onNav(a.nav)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', border: `1px solid ${a.color}22`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}11`; e.currentTarget.style.borderColor = `${a.color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = `${a.color}22`; }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.label}</span>
                {a.badge && <span style={{ background: '#EF4444', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{a.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent requests */}
      <div style={{ ...s.card, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>🕐 Recent Requests</div>
          <button onClick={() => onNav('requests')} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>View all →</button>
        </div>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No requests yet.</p>
        ) : (
          recent.map(req => {
            const sc = { pending: '#D97706', reviewing: '#2563EB', accepted: '#0D9488', in_progress: '#7C3AED', completed: '#16A34A', rejected: '#EF4444' };
            const col = sc[req.status] || '#94A3B8';
            return (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.serviceTitle || req.serviceKey || 'Request'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.name} · {req.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {req.agreedPrice && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>₦{Number(req.agreedPrice).toLocaleString()}</span>}
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: col+'18', color: col }}>{req.status?.replace('_',' ')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Withdrawals Tab ───────────────────────────────────────────
function WithdrawalsTab({ withdrawalRequests, users, s, showToast }) {
  const pending   = withdrawalRequests.filter(w => w.status === 'pending');
  const processed = withdrawalRequests.filter(w => w.status !== 'pending');
  const totalPending = pending.reduce((sum, w) => sum + (w.amount || 0), 0);

  const markPaid = async (id, writerId, amount) => {
    await updateDoc(doc(db, 'withdrawalRequests', id), { status: 'paid', paidAt: serverTimestamp() });
    // Notify the writer
    if (writerId) {
      await addDoc(collection(db, 'notifications'), {
        userId: writerId,
        title: '✅ Withdrawal Processed',
        body: `Your withdrawal of ₦${Number(amount).toLocaleString()} has been paid to your account.`,
        type: 'payment', read: false, createdAt: serverTimestamp(),
      });
    }
    showToast('✅ Marked as paid — writer notified');
  };

  const reject = async (id, writerId, amount) => {
    await updateDoc(doc(db, 'withdrawalRequests', id), { status: 'rejected', rejectedAt: serverTimestamp() });
    if (writerId) {
      await addDoc(collection(db, 'notifications'), {
        userId: writerId,
        title: '❌ Withdrawal Rejected',
        body: `Your withdrawal request of ₦${Number(amount).toLocaleString()} was not processed. Contact admin for details.`,
        type: 'payment', read: false, createdAt: serverTimestamp(),
      });
    }
    showToast('✅ Request rejected — writer notified');
  };

  const Row = ({ w }) => {
    const writerUser = users.find(u => (u.uid || u.id) === w.writerId);
    return (
      <div style={{ ...s.card, border: w.status === 'pending' ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--border-card)', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
              {w.writerName || writerUser?.name || 'Writer'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.writerEmail}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.createdAt?.toDate?.()?.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#16A34A' }}>₦{Number(w.amount).toLocaleString()}</div>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              background: w.status === 'paid' ? 'rgba(22,163,74,0.12)' : w.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
              color: w.status === 'paid' ? '#16A34A' : w.status === 'rejected' ? '#EF4444' : '#D97706' }}>
              {w.status}
            </span>
          </div>
        </div>

        {/* Bank details */}
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Bank', w.bankName], ['Account Name', w.accountName], ['Account No.', w.bankAccount]].map(([label, val]) => val ? (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {val}
                <button onClick={() => { navigator.clipboard.writeText(val); showToast('📋 Copied!'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 11, fontWeight: 700, padding: 0 }}>copy</button>
              </div>
            </div>
          ) : null)}
        </div>

        {w.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>"{w.note}"</div>}

        {w.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => markPaid(w.id, w.writerId, w.amount)}
              style={{ ...s.btn('#16A34A'), flex: 1, padding: '10px' }}>
              ✅ Mark as Paid
            </button>
            <button onClick={() => reject(w.id, w.writerId, w.amount)}
              style={{ ...s.btn('#EF4444'), padding: '10px 20px' }}>
              ❌ Reject
            </button>
          </div>
        )}
        {w.status === 'paid' && <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Paid on {w.paidAt?.toDate?.()?.toLocaleDateString()}</div>}
        {w.status === 'rejected' && <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>❌ Rejected</div>}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>💸 Withdrawal Requests</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Process writer payout requests. Bank details included for direct transfer.</p>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Pending Requests', value: pending.length, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
          { label: 'Amount Due',       value: `₦${totalPending.toLocaleString()}`, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Processed',        value: processed.length, color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            🟡 Pending ({pending.length})
          </div>
          {pending.map(w => <Row key={w.id} w={w} />)}
        </div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            History ({processed.length})
          </div>
          {processed.map(w => <Row key={w.id} w={w} />)}
        </div>
      )}

      {withdrawalRequests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💸</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>No withdrawal requests yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Writers will submit requests from their Wallet tab.</div>
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