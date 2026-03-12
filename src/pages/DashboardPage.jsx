
  // src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToClientOrders } from '../firebase/orderService';
import { initiatePayment } from '../firebase/paystackService';
import { doc, updateDoc, addDoc, collection, serverTimestamp as ts } from 'firebase/firestore';

const NAV = [
  { id: 'overview', label: '🏠 Overview'  },
  { id: 'orders',   label: '📋 My Orders' },
  { id: 'messages', label: '💬 Messages'  },
  { id: 'payments', label: '💳 Payments'  },
];

const STATUS_COLORS = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  priced:      { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C' },
  paid:        { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#eee', color: '#333' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: s.bg, color: s.color }}>
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState('overview');
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(null); // orderId being paid

  useEffect(() => {
    if (profile?.isAdmin) navigate('/admin', { replace: true });
    if (profile?.isWriter || profile?.role === 'writer') navigate('/writer', { replace: true });
  }, [profile, navigate]);

  useEffect(() => {
    if (!user || profile?.isAdmin) return;
    const unsub = subscribeToClientOrders(user.uid, data => { setOrders(data); setLoading(false); });
    return unsub;
  }, [user, profile]);

  if (profile?.isAdmin || profile?.isWriter) return null;

  const handlePayNow = async (order) => {
    if (paying) return;
    setPaying(order.id);
    try {
      await initiatePayment({
        email: user.email,
        amount: Number(order.agreedPrice || order.totalAmount),
        orderId: order.id,
        type: order.serviceKey || order.serviceTitle || 'service',
        onSuccess: async (response) => {
          // 1. Update order status to 'paid' with paystack reference
          const orderRef = doc(db, 'serviceRequests', order.id);
          await updateDoc(orderRef, {
            status: 'paid',
            paystackRef: response.reference,
            paidAt: ts(),
          });

          // 2. Calculate and save payment splits
          const total      = Number(order.agreedPrice || order.totalAmount);
          const referrerId = order.referredBy;
          const writerId   = order.assignedWriterId;
          const pushedBy   = order.pushedBy;

          let splitType, writerAmount, referrerAmount, adminAmount, maintenanceAmount;
          maintenanceAmount = +(total * 0.05).toFixed(2);

          if (!writerId && !pushedBy) {
            // Admin refers + writes: 95% admin, 5% maintenance
            splitType       = 'admin_refers_writes';
            writerAmount    = 0;
            referrerAmount  = 0;
            adminAmount     = +(total * 0.95).toFixed(2);
          } else if (referrerId && referrerId === writerId) {
            // Writer refers + writes: 85% writer, 10% admin, 5% maintenance
            splitType       = 'writer_refers_writes';
            writerAmount    = +(total * 0.85).toFixed(2);
            referrerAmount  = 0;
            adminAmount     = +(total * 0.10).toFixed(2);
          } else if (referrerId && writerId && referrerId !== writerId) {
            // Writer refers + pushes out: 10% referrer, 75% writer, 10% admin, 5% maintenance
            splitType       = 'writer_refers_pushes';
            referrerAmount  = +(total * 0.10).toFixed(2);
            writerAmount    = +(total * 0.75).toFixed(2);
            adminAmount     = +(total * 0.10).toFixed(2);
          } else {
            // Admin refers + pushes to writer: 75% writer, 20% admin, 5% maintenance
            splitType       = 'admin_refers_pushes';
            writerAmount    = +(total * 0.75).toFixed(2);
            referrerAmount  = 0;
            adminAmount     = +(total * 0.20).toFixed(2);
          }

          await addDoc(collection(db, 'paymentSplits'), {
            orderId:           order.id,
            clientId:          user.uid,
            writerId:          writerId || null,
            referrerId:        referrerId || null,
            splitType,
            totalAmount:       total,
            writerAmount,
            referrerAmount,
            adminAmount,
            maintenanceAmount,
            paystackRef:       response.reference,
            status:            'pending_payout',
            createdAt:         ts(),
          });

          // 3. Notify writer if assigned
          if (writerId) {
            await addDoc(collection(db, 'notifications'), {
              userId:    writerId,
              title:     '💰 Payment Received',
              body: `Client has paid for "${order.serviceTitle || order.topicTitle || 'order'}". You can start working now.`,
              type:      'payment',
              read:      false,
              createdAt: ts(),
            });
          }

          // 4. Notify admin
          await addDoc(collection(db, 'notifications'), {
            userId:    'admin',
            title:     '✅ Payment Confirmed',
            body: `₦${total.toLocaleString()} received for "${order.serviceTitle || order.topicTitle || 'order'}" — Ref: ${response.reference}`,
            type:      'payment',
            read:      false,
            createdAt: ts(),
          });

          setPaying(null);
          alert('✅ Payment successful! Your order is now active.');
        },
        onClose: () => setPaying(null),
      });
    } catch (e) {
      console.error('Payment error:', e);
      setPaying(null);
      alert('Payment failed. Please try again.');
    }
  };

  const stats = {
    total:    orders.length,
    active:   orders.filter(o => ['pending','reviewing','accepted','in_progress','quoted'].includes(o.status)).length,
    complete: orders.filter(o => o.status === 'completed').length,
    spent:    orders.reduce((s, o) => s + Number(o.agreedPrice || o.totalAmount || 0), 0),
  };

  const s = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20 },
    btn:  (bg, col='#fff') => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Sidebar */}
      <aside style={{ width: 210, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 18px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Client Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name?.split(' ')[0] || 'Client'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: active ? 'var(--teal-glow)' : 'transparent', border: `1px solid ${active ? 'var(--teal)' : 'transparent'}`, color: active ? 'var(--teal)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>
                {n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '10px' }}>
          <Link to="/services" style={s.btn('var(--teal)')}>＋ New Request</Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 'clamp(20px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        {tab === 'overview'  && <Overview  stats={stats} orders={orders} loading={loading} s={s} onPay={handlePayNow} paying={paying} />}
        {tab === 'orders'    && <OrdersTab orders={orders} loading={loading} s={s} onPay={handlePayNow} paying={paying} />}
        {tab === 'messages'  && <MessagesTab user={user} profile={profile} />}
        {tab === 'payments'  && <PaymentsTab orders={orders} stats={stats} />}
      </main>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────
function Overview({ stats, orders, loading, s, onPay, paying }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Overview</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your activity at a glance.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 36 }}>
        {[['Total Orders', stats.total, 'var(--gold)'],['Active', stats.active, 'var(--teal)'],['Completed', stats.complete, '#16A34A'],['Spent', `₦${stats.spent.toLocaleString()}`, 'var(--gold)']].map(([label, val, color]) => (
          <div key={label} style={s.card}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Recent Orders</h3>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', ...s.card }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No orders yet.</p>
          <Link to="/services" style={s.btn('var(--teal)')}>Browse Services</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle || o.serviceKey}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <StatusBadge status={o.status} />
                {(o.agreedPrice || o.totalAmount) && <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}</span>}
                {o.status === 'priced' && (o.agreedPrice || o.totalAmount) && (
                  <button onClick={() => onPay(o)} disabled={paying === o.id}
                    style={{ background: paying === o.id ? 'rgba(201,168,76,0.4)' : 'var(--gold)', color: '#0a0a0f', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    {paying === o.id ? '⏳' : '💳 Pay'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────
function OrdersTab({ orders, loading, s, onPay, paying }) {
  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>My Orders</h2>
        <Link to="/services" style={s.btn('var(--teal)')}>＋ New Request</Link>
      </div>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', ...s.card }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle || o.serviceKey}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge status={o.status} />
                  {(o.agreedPrice || o.totalAmount) && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}</span>}
                </div>
              </div>
              {o.adminNote && (
                <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)' }}>
                  💬 <strong>Admin note:</strong> {o.adminNote}
                </div>
              )}
              {/* Pay Now button — shows when order is priced but not yet paid */}
              {o.status === 'priced' && (o.agreedPrice || o.totalAmount) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Amount due</div>
                    <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>₦{Number(o.agreedPrice || o.totalAmount).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => onPay(o)}
                    disabled={paying === o.id}
                    style={{ background: paying === o.id ? 'rgba(201,168,76,0.4)' : 'var(--gold)', color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '12px 28px', cursor: paying === o.id ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {paying === o.id ? '⏳ Opening...' : '💳 Pay Now'}
                  </button>
                </div>
              )}
              {o.status === 'paid' && (
                <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 8, fontSize: 13, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✅ Payment confirmed · Ref: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{o.paystackRef}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Messages — General chat with admin ───────────────────────
function MessagesTab({ user, profile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const bottomRef     = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);

  // Subscribe to this client's thread: adminMessages/{userId}/messages
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'adminMessages', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [user]);

  const sendText = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const txt = text.trim();
      setText('');
      await addDoc(collection(db, 'adminMessages', user.uid, 'messages'), {
        sender: 'client',
        senderName: profile?.name || user.displayName || 'Client',
        type: 'text',
        text: txt,
        createdAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setSending(false);
  };

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
      setTimeout(() => { if (mediaRecorder.current?.state === 'recording') stopRecording(); }, 55000);
    } catch { alert('Microphone access denied'); }
  };
  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };

  const sendAudio = async () => {
    if (!audioBlob || !user) return;
    if (audioBlob.size > 650000) {
      alert('Voice note too long. Please keep it under 55 seconds.');
      setAudioBlob(null);
      return;
    }
    setSending(true);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      try {
        await addDoc(collection(db, 'adminMessages', user.uid, 'messages'), {
          sender: 'client',
          senderName: profile?.name || user.displayName || 'Client',
          type: 'audio',
          audioData: reader.result,
          createdAt: serverTimestamp(),
        });
        setAudioBlob(null);
      } catch (e) { console.error(e); }
      setSending(false);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)', flexShrink: 0 }}>Messages</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, flexShrink: 0 }}>Chat directly with our team</p>

      {/* Chat box */}
      <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 14 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>👋</div>
              No messages yet. Send us a message — we're here to help!
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender === 'client';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.55,
                  background: isMe ? 'var(--teal)' : 'var(--bg-tertiary)',
                  color: isMe ? '#fff' : 'var(--text-primary)',
                  border: !isMe ? '1px solid var(--border)' : 'none',
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: !isMe ? 4 : 16,
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontWeight: 700 }}>
                    {isMe ? 'You' : '🛡️ Admin'}
                  </div>
                  {msg.type === 'audio'
                    ? <audio controls src={msg.audioData} style={{ maxWidth: 220, height: 36, display: 'block' }} />
                    : <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>
                  }
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                    {msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Audio preview */}
        {audioBlob && (
          <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 36, flex: 1 }} />
            <button onClick={() => setAudioBlob(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
            <button onClick={sendAudio} disabled={sending} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>Send 🎙️</button>
          </div>
        )}

        {/* Input bar */}
        {!audioBlob && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)' }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendText()}
              placeholder="Type a message..."
              style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}
            />
            {/* Hold to record */}
            <button
              onMouseDown={startRecording} onMouseUp={stopRecording}
              onTouchStart={e => { e.preventDefault(); startRecording(); }} onTouchEnd={stopRecording}
              title="Hold to record voice note"
              style={{ background: recording ? '#EF4444' : 'var(--bg-secondary)', color: recording ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
              {recording ? '⏹' : '🎙️'}
            </button>
            <button onClick={sendText} disabled={sending || !text.trim()}
              style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 18, opacity: text.trim() ? 1 : 0.5, flexShrink: 0 }}>
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Price Negotiation Response ────────────────────────────────
function ClientPriceResponse({ order, user, profile }) {
  const [response, setResponse]         = useState('');      // 'accept' | 'counter'
  const [message, setMessage]           = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);

  const handleSubmit = async () => {
    if (!response) return;
    if (response === 'counter' && !counterPrice) return;
    setSubmitting(true);
    try {
      const entry = {
        from:         'client',
        response,
        message:      message.trim() || (response === 'accept' ? 'I accept the price.' : ''),
        counterPrice: response === 'counter' ? Number(counterPrice) : null,
        createdAt:    new Date().toISOString(),
      };
      await updateDoc(doc(db, 'serviceRequests', order.id), {
        clientPriceResponse: response,
        priceNegotiation:    [...(order.priceNegotiation || []), entry],
        updatedAt:           ts(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId:    'admin',
        title:     response === 'accept' ? '✅ Client accepted the price' : '🔄 Client sent a counter offer',
        body:      response === 'accept'
          ? `${profile?.name || 'Client'} accepted ₦${Number(order.agreedPrice).toLocaleString()} for "${order.serviceTitle || order.topicTitle}".`
          : `${profile?.name || 'Client'} countered with ₦${Number(counterPrice).toLocaleString()} for "${order.serviceTitle || order.topicTitle}". Message: ${message}`,
        type:      'negotiation',
        orderId:   order.id,
        read:      false,
        createdAt: ts(),
      });
      setDone(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (done) return (
    <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)' }}>
      ✅ Response sent. Waiting for admin to confirm.
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Is this price okay for you?
      </div>

      {/* Accept / Negotiate buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setResponse('accept')} style={{
          flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
          border: `2px solid ${response === 'accept' ? '#16A34A' : 'var(--border)'}`,
          background: response === 'accept' ? 'rgba(22,163,74,0.1)' : 'transparent',
          color: response === 'accept' ? '#16A34A' : 'var(--text-secondary)',
        }}>
          ✅ Accept Price
        </button>
        <button onClick={() => setResponse('counter')} style={{
          flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
          border: `2px solid ${response === 'counter' ? 'var(--gold)' : 'var(--border)'}`,
          background: response === 'counter' ? 'rgba(201,168,76,0.08)' : 'transparent',
          color: response === 'counter' ? 'var(--gold)' : 'var(--text-secondary)',
        }}>
          🔄 Negotiate
        </button>
      </div>

      {/* Counter price input — only when negotiating */}
      {response === 'counter' && (
        <input type="number" placeholder="Your counter price (₦)"
          value={counterPrice} onChange={e => setCounterPrice(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
        />
      )}

      {/* Optional message */}
      {response && (
        <textarea rows={2}
          placeholder={response === 'accept' ? 'Any message for admin? (optional)' : 'Explain your counter offer...'}
          value={message} onChange={e => setMessage(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-body)' }}
        />
      )}

      {/* Submit */}
      {response && (
        <button onClick={handleSubmit}
          disabled={submitting || (response === 'counter' && !counterPrice)}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            background: response === 'accept' ? '#16A34A' : 'var(--gold)',
            color: response === 'accept' ? '#fff' : '#000',
            opacity: submitting ? 0.6 : 1,
          }}>
          {submitting ? 'Sending...' : response === 'accept' ? '✅ Confirm Acceptance' : '📤 Send Counter Offer'}
        </button>
      )}
    </div>
  );
}
// ── Payments ──────────────────────────────────────────────────
function PaymentsTab({ orders, stats }) {
  const paid = orders.filter(o => o.status === 'paid');
  const pending = orders.filter(o => o.status === 'priced');
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Payments</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Total paid: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₦{stats.spent.toLocaleString()}</span>
      </p>
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#C9A84C', marginBottom: 12 }}>⏳ Awaiting Payment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(o => (
              <div key={o.id} style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Price set by admin</div>
                </div>
                <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                  ₦{Number(o.agreedPrice || o.totalAmount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>✅ Payment History</h3>
      {paid.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💳</div>
          <p style={{ color: 'var(--text-muted)' }}>No payment history yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paid.map(o => (
            <div key={o.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>{o.serviceTitle || o.topicTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Ref: <span style={{ fontFamily: 'monospace' }}>{o.paystackRef}</span></div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: STATUS_COLORS['paid']?.bg, color: STATUS_COLORS['paid']?.color }}>Paid</span>
              </div>
              <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                ₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
  
