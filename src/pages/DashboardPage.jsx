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
  const [tab, setTab]         = useState('overview');
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (profile?.isAdmin) navigate('/admin', { replace: true });
    if (profile?.isWriter || profile?.role === 'writer') navigate('/writer', { replace: true });
  }, [profile, navigate]);

  useEffect(() => {
    if (!user || profile?.isAdmin) return;
    const timeout = setTimeout(() => setLoading(false), 8000);
    const unsub = subscribeToClientOrders(user.uid, data => {
      setOrders(data);
      setLoading(false);
      clearTimeout(timeout);
    });
    return () => { unsub?.(); clearTimeout(timeout); };
  }, [user, profile]);

  // Keep selected order in sync with live updates
  useEffect(() => {
    if (!selectedOrder) return;
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [orders]);

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
          const orderRef = doc(db, 'serviceRequests', order.id);
          await updateDoc(orderRef, { status: 'paid', paystackRef: response.reference, paidAt: ts() });
          const total = Number(order.agreedPrice || order.totalAmount);
          const referrerId = order.referredBy;
          const writerId   = order.assignedWriterId;
          const pushedBy   = order.pushedBy;
          let splitType, writerAmount, referrerAmount, adminAmount;
          const maintenanceAmount = +(total * 0.05).toFixed(2);
          if (!writerId && !pushedBy) {
            splitType = 'admin_refers_writes'; writerAmount = 0; referrerAmount = 0; adminAmount = +(total * 0.95).toFixed(2);
          } else if (referrerId && referrerId === writerId) {
            splitType = 'writer_refers_writes'; writerAmount = +(total * 0.85).toFixed(2); referrerAmount = 0; adminAmount = +(total * 0.10).toFixed(2);
          } else if (referrerId && writerId && referrerId !== writerId) {
            splitType = 'writer_refers_pushes'; referrerAmount = +(total * 0.10).toFixed(2); writerAmount = +(total * 0.75).toFixed(2); adminAmount = +(total * 0.10).toFixed(2);
          } else {
            splitType = 'admin_refers_pushes'; writerAmount = +(total * 0.75).toFixed(2); referrerAmount = 0; adminAmount = +(total * 0.20).toFixed(2);
          }
          await addDoc(collection(db, 'paymentSplits'), {
            orderId: order.id, clientId: user.uid, writerId: writerId || null, referrerId: referrerId || null,
            splitType, totalAmount: total, writerAmount, referrerAmount, adminAmount, maintenanceAmount,
            paystackRef: response.reference, status: 'pending_payout', createdAt: ts(),
          });
          if (writerId) {
            await addDoc(collection(db, 'notifications'), {
              userId: writerId, title: '💰 Payment Received',
              body: `Client has paid for "${order.serviceTitle || order.topicTitle || 'order'}". You can start working now.`,
              type: 'payment', read: false, createdAt: ts(),
            });
          }
          await addDoc(collection(db, 'notifications'), {
            userId: 'admin', title: '✅ Payment Confirmed',
            body: `₦${total.toLocaleString()} received for "${order.serviceTitle || order.topicTitle || 'order'}" — Ref: ${response.reference}`,
            type: 'payment', read: false, createdAt: ts(),
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

  const handleTabChange = (id) => { setTab(id); setSidebarOpen(false); setSelectedOrder(null); };

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

  // Order detail view replaces main content
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        user={user}
        profile={profile}
        onBack={() => setSelectedOrder(null)}
        onPay={handlePayNow}
        paying={paying}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 768px) {
          .dash-sidebar { position: fixed !important; top: 64px !important; left: 0 !important; height: calc(100vh - 64px) !important; z-index: 100 !important; transform: translateX(0); transition: transform 0.3s ease !important; box-shadow: 4px 0 20px rgba(0,0,0,0.2); }
          .dash-sidebar.closed { transform: translateX(-110%) !important; }
          .dash-main { padding: 16px !important; }
          .dash-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) { .dash-sidebar { position: sticky !important; transform: none !important; } .dash-menu-btn { display: none !important; } }
        .dash-menu-btn { display: none; }
      `}</style>

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? '' : ' closed'}`} style={{ width: 210, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 18px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Client Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name?.split(' ')[0] || 'Client'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => handleTabChange(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: active ? 'var(--teal-glow)' : 'transparent', border: `1px solid ${active ? 'var(--teal)' : 'transparent'}`, color: active ? 'var(--teal)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>
                {n.label}
              </button>
            );
          })}
          <Link to="/request" onClick={() => setSidebarOpen(false)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--teal)', color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginTop: 6, textAlign: 'left', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}>
            ＋ New Request
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="dash-main" style={{ flex: 1, padding: 'clamp(20px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="dash-menu-btn" onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span className="dash-menu-btn" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', alignItems: 'center' }}>
            {NAV.find(n => n.id === tab)?.label || ''}
          </span>
        </div>
        {tab === 'overview'  && <Overview stats={stats} orders={orders} loading={loading} s={s} onPay={handlePayNow} paying={paying} onSelectOrder={setSelectedOrder} />}
        {tab === 'orders'    && <OrdersTab orders={orders} loading={loading} s={s} onPay={handlePayNow} paying={paying} user={user} profile={profile} onSelectOrder={setSelectedOrder} />}
        {tab === 'messages'  && <MessagesTab user={user} profile={profile} />}
        {tab === 'payments'  && <PaymentsTab orders={orders} stats={stats} />}
      </main>

      {sidebarOpen && (
        <div className="dash-menu-btn" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, display: 'block', top: 64 }} />
      )}
    </div>
  );
}

// ── Order Detail View ─────────────────────────────────────────
function OrderDetailView({ order: initialOrder, user, profile, onBack, onPay, paying }) {
  const [order, setOrder]     = useState(initialOrder);
  const [messages, setMessages] = useState([]);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Live order updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'serviceRequests', initialOrder.id), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [initialOrder.id]);

  // Live chat for this specific order
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orderChats', initialOrder.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [initialOrder.id, user]);

  const sendMsg = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const txt = text.trim();
    try {
      await addDoc(collection(db, 'orderChats', order.id, 'messages'), {
        sender: 'client', senderName: profile?.name || user.displayName || 'Client',
        text: txt, createdAt: ts(),
      });
      setText('');
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: `💬 Message on: ${order.serviceTitle || order.topicTitle || 'Order'}`,
        body: txt.slice(0, 80), orderId: order.id,
        type: 'message', read: false, createdAt: ts(),
      });
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const title = order.serviceTitle || order.topicTitle || order.serviceKey || 'Order';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          ← Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, width: '100%', margin: '0 auto' }}>

        {/* Order summary */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Order Details</div>
          {[
            ['Service', order.serviceTitle || order.serviceKey],
            ['Description', order.description || order.details],
            ['Category', order.category],
            ['Pages', order.pages],
            ['Deadline', order.deadline],
            ['Notes', order.additionalNotes],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 8, lineHeight: 1.5 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Admin note */}
        {order.adminNote && (
          <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>💬 Admin Note</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{order.adminNote}</div>
          </div>
        )}

        {/* Priced — negotiation */}
        {order.status === 'priced' && (order.agreedPrice || order.totalAmount) && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>💰 Price Offer from Admin</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>₦{Number(order.agreedPrice || order.totalAmount).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Review this offer and accept or negotiate below.</div>
            </div>
            {order.priceNegotiation?.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {order.priceNegotiation.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: entry.from === 'client' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
                      background: entry.from === 'client' ? 'var(--teal)' : 'var(--bg-secondary)',
                      color: entry.from === 'client' ? '#fff' : 'var(--text-primary)',
                      border: entry.from !== 'client' ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3, fontWeight: 700 }}>{entry.from === 'client' ? 'You' : '🛡️ Admin'}</div>
                      {entry.counterPrice && <div style={{ fontWeight: 800, marginBottom: 2 }}>Counter: ₦{Number(entry.counterPrice).toLocaleString()}</div>}
                      <div>{entry.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!order.clientPriceResponse
              ? <ClientPriceResponse order={order} user={user} profile={profile} />
              : <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)' }}>⏳ Your response has been sent. Waiting for admin to confirm.</div>
            }
          </div>
        )}

        {/* Accepted — pay */}
        {order.status === 'accepted' && (order.agreedPrice || order.totalAmount) && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>✅ Price agreed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>₦{Number(order.agreedPrice || order.totalAmount).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Make a 50% advance payment to begin your project.</div>
            </div>
            <button onClick={() => onPay(order)} disabled={paying === order.id}
              style={{ width: '100%', background: paying === order.id ? 'rgba(201,168,76,0.4)' : 'var(--gold)', color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: paying === order.id ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {paying === order.id ? '⏳ Opening...' : `💳 Pay 50% Advance — ₦${Math.round(Number(order.agreedPrice || order.totalAmount) / 2).toLocaleString()}`}
            </button>
          </div>
        )}

        {/* Paid */}
        {order.status === 'paid' && (
          <div style={{ padding: '12px 16px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 10, fontSize: 14, color: '#16A34A' }}>
            ✅ Payment confirmed · Ref: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.paystackRef}</span>
          </div>
        )}

        {/* ── Order Chat ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>💬 Order Chat</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Back-and-forth with admin / writer about this order</div>
          </div>
          <div style={{ minHeight: 180, maxHeight: 380, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
                No messages yet. Ask about this order or request an update.
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender === 'client';
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.55,
                    background: isMe ? 'var(--teal)' : 'var(--bg-tertiary)',
                    color: isMe ? '#fff' : 'var(--text-primary)',
                    border: !isMe ? '1px solid var(--border)' : 'none',
                    borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: !isMe ? 4 : 16 }}>
                    <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontWeight: 700 }}>
                      {isMe ? 'You' : (msg.senderName || '🛡️ Admin')}
                    </div>
                    <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)' }}>
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Type a message about this order..."
              style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }} />
            <button onClick={sendMsg} disabled={sending || !text.trim()}
              style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 18, opacity: text.trim() ? 1 : 0.5, flexShrink: 0 }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────
function Overview({ stats, orders, loading, s, onSelectOrder }) {
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
          <Link to="/request" style={s.btn('var(--teal)')}>＋ New Request</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} onClick={() => onSelectOrder(o)}
              style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle || o.serviceKey}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <StatusBadge status={o.status} />
                {(o.agreedPrice || o.totalAmount) && <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}</span>}
                <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────
function OrdersTab({ orders, loading, s, onSelectOrder }) {
  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>My Orders</h2>
        <Link to="/request" style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>＋ New Request</Link>
      </div>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', ...s.card }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No orders yet. Submit your first request!</p>
          <Link to="/request" style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>＋ New Request</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} onClick={() => onSelectOrder(o)}
              style={{ ...s.card, cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-card)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle || o.serviceKey}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
                  {o.adminNote && (
                    <span style={{ fontSize: 11, color: 'var(--teal)', background: 'var(--teal-glow)', borderRadius: 6, padding: '3px 8px' }}>💬 Admin replied</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={o.status} />
                  {(o.agreedPrice || o.totalAmount) && <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}</span>}
                  {o.status === 'priced' && !o.clientPriceResponse && (
                    <span style={{ fontSize: 11, color: '#D97706', fontWeight: 700 }}>⚠️ Action needed</span>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600 }}>Tap to view & chat →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Messages ─────────────────────────────────────────────────
function MessagesTab({ user, profile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const bottomRef     = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks   = useRef([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'adminMessages', user.uid, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [user]);

  const sendText = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const txt = text.trim();
    try {
      await addDoc(collection(db, 'adminMessages', user.uid, 'messages'), {
        sender: 'client', senderName: profile?.name || user.displayName || 'Client',
        type: 'text', text: txt, createdAt: ts(),
      });
      setText('');
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', title: `💬 Message from ${profile?.name || 'Client'}`,
        body: txt.slice(0, 80), type: 'message', read: false, createdAt: ts(),
      });
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 } : { audioBitsPerSecond: 16000 };
      mediaRecorder.current = new MediaRecorder(stream, options);
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => { setAudioBlob(new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType || 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); };
      mediaRecorder.current.start();
      setRecording(true);
      setTimeout(() => { if (mediaRecorder.current?.state === 'recording') stopRecording(); }, 55000);
    } catch { alert('Microphone access denied'); }
  };
  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };

  const sendAudio = async () => {
    if (!audioBlob || !user) return;
    if (audioBlob.size > 650000) { alert('Voice note too long.'); setAudioBlob(null); return; }
    setSending(true);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      try {
        await addDoc(collection(db, 'adminMessages', user.uid, 'messages'), { sender: 'client', senderName: profile?.name || user.displayName || 'Client', type: 'audio', audioData: reader.result, createdAt: ts() });
        setAudioBlob(null);
        await addDoc(collection(db, 'notifications'), { userId: 'admin', title: `🎙️ Voice note from ${profile?.name || 'Client'}`, body: 'Sent a voice message.', type: 'message', read: false, createdAt: ts() });
      } catch (e) { console.error(e); }
      setSending(false);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)', flexShrink: 0 }}>Messages</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, flexShrink: 0 }}>General chat with our team. For order-specific chat, tap any order.</p>
      <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (<div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 14 }}><div style={{ fontSize: '3rem', marginBottom: 12 }}>👋</div>No messages yet. Send us a message!</div>)}
          {messages.map(msg => {
            const isMe = msg.sender === 'client';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.55, background: isMe ? 'var(--teal)' : 'var(--bg-tertiary)', color: isMe ? '#fff' : 'var(--text-primary)', border: !isMe ? '1px solid var(--border)' : 'none', borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: !isMe ? 4 : 16 }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontWeight: 700 }}>{isMe ? 'You' : '🛡️ Admin'}</div>
                  {msg.type === 'audio' ? <audio controls src={msg.audioData} style={{ maxWidth: 220, height: 36, display: 'block' }} /> : <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>}
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>{msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {audioBlob && (
          <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 36, flex: 1 }} />
            <button onClick={() => setAudioBlob(null)} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
            <button onClick={sendAudio} disabled={sending} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>Send 🎙️</button>
          </div>
        )}
        {!audioBlob && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)' }}>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendText()} placeholder="Type a message..." style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }} />
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={e => { e.preventDefault(); startRecording(); }} onTouchEnd={stopRecording} style={{ background: recording ? '#EF4444' : 'var(--bg-secondary)', color: recording ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>{recording ? '⏹' : '🎙️'}</button>
            <button onClick={sendText} disabled={sending || !text.trim()} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 18, opacity: text.trim() ? 1 : 0.5, flexShrink: 0 }}>➤</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Price Negotiation Response ────────────────────────────────
function ClientPriceResponse({ order, user, profile }) {
  const [response, setResponse]         = useState('');
  const [message, setMessage]           = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);

  const handleSubmit = async () => {
    if (!response || (response === 'counter' && !counterPrice)) return;
    setSubmitting(true);
    try {
      const entry = { from: 'client', response, message: message.trim() || (response === 'accept' ? 'I accept the price.' : ''), counterPrice: response === 'counter' ? Number(counterPrice) : null, createdAt: new Date().toISOString() };
      await updateDoc(doc(db, 'serviceRequests', order.id), { clientPriceResponse: response, priceNegotiation: [...(order.priceNegotiation || []), entry], updatedAt: ts() });
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: response === 'accept' ? '✅ Client accepted the price' : '🔄 Client sent a counter offer',
        body: response === 'accept' ? `${profile?.name || 'Client'} accepted ₦${Number(order.agreedPrice).toLocaleString()} for "${order.serviceTitle || order.topicTitle}".` : `${profile?.name || 'Client'} countered with ₦${Number(counterPrice).toLocaleString()} for "${order.serviceTitle || order.topicTitle}". Message: ${message}`,
        type: 'negotiation', orderId: order.id, read: false, createdAt: ts(),
      });
      setDone(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (done) return <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)' }}>✅ Response sent. Waiting for admin to confirm.</div>;

  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Is this price okay for you?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setResponse('accept')} style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: `2px solid ${response === 'accept' ? '#16A34A' : 'var(--border)'}`, background: response === 'accept' ? 'rgba(22,163,74,0.1)' : 'transparent', color: response === 'accept' ? '#16A34A' : 'var(--text-secondary)' }}>✅ Accept Price</button>
        <button onClick={() => setResponse('counter')} style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: `2px solid ${response === 'counter' ? 'var(--gold)' : 'var(--border)'}`, background: response === 'counter' ? 'rgba(201,168,76,0.08)' : 'transparent', color: response === 'counter' ? 'var(--gold)' : 'var(--text-secondary)' }}>🔄 Negotiate</button>
      </div>
      {response === 'counter' && <input type="number" placeholder="Your counter price (₦)" value={counterPrice} onChange={e => setCounterPrice(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />}
      {response && <textarea rows={2} placeholder={response === 'accept' ? 'Any message for admin? (optional)' : 'Explain your counter offer...'} value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-body)' }} />}
      {response && <button onClick={handleSubmit} disabled={submitting || (response === 'counter' && !counterPrice)} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: response === 'accept' ? '#16A34A' : 'var(--gold)', color: response === 'accept' ? '#fff' : '#000', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Sending...' : response === 'accept' ? '✅ Confirm Acceptance' : '📤 Send Counter Offer'}</button>}
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────
function PaymentsTab({ orders, stats }) {
  const paid    = orders.filter(o => o.status === 'paid');
  const pending = orders.filter(o => o.status === 'priced');
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Payments</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Total paid: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₦{stats.spent.toLocaleString()}</span></p>
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#C9A84C', marginBottom: 12 }}>⏳ Awaiting Payment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(o => (
              <div key={o.id} style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div><div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.topicTitle}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Price set by admin</div></div>
                <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>₦{Number(o.agreedPrice || o.totalAmount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>✅ Payment History</h3>
      {paid.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}><div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💳</div><p style={{ color: 'var(--text-muted)' }}>No payment history yet.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paid.map(o => (
            <div key={o.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>{o.serviceTitle || o.topicTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Ref: <span style={{ fontFamily: 'monospace' }}>{o.paystackRef}</span></div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: STATUS_COLORS['paid']?.bg, color: STATUS_COLORS['paid']?.color }}>Paid</span>
              </div>
              <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>₦{Number(o.agreedPrice || o.totalAmount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
