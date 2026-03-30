// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToClientOrders } from '../firebase/orderService';
import { doc, updateDoc, addDoc, collection, serverTimestamp as ts } from 'firebase/firestore';
import ManualPaymentUpload from '../components/ManualPaymentUpload';

const NAV = [
  { id: 'overview', label: '🏠 Overview'  },
  { id: 'orders',   label: '📋 My Orders' },
  { id: 'topics',   label: '📚 Topics'    },
  { id: 'services', label: '🛎️ Services'  },
  { id: 'messages', label: '💬 Messages'  },
  { id: 'payments', label: '💳 Payments'  },
];

const SERVICES = [
  { icon: '🔬', key: 'research_projects',       title: 'Research Projects',        desc: 'Full research assistance from topic to final write-up.' },
  { icon: '📊', key: 'data_analysis',            title: 'Data Analysis',             desc: 'SPSS, Excel, charts, interpretation and reporting.' },
  { icon: '🤝', key: 'client_care',              title: 'Client Care Support',       desc: 'Personalized guidance and follow-up support.' },
  { icon: '📝', key: 'academic_assignments',     title: 'Academic Assignments',      desc: 'Essays, coursework, reports for all academic levels.' },
  { icon: '🖥️', key: 'online_registration',     title: 'Online Registration',       desc: 'Jamb, WAEC, school portals and online applications.' },
  { icon: '📑', key: 'powerpoint',               title: 'PowerPoint Presentation',   desc: 'Professional slides for defence, pitches and seminars.' },
  { icon: '✏️', key: 'proofreading',             title: 'Proofreading & Editing',    desc: 'Grammar, flow, citations and formatting corrections.' },
  { icon: '📋', key: 'survey_design',            title: 'Survey Design & Analysis',  desc: 'Questionnaire design, data collection and analysis.' },
  { icon: '🎫', key: 'waec_neco',               title: 'WAEC / NECO Scratch Cards',  desc: 'Affordable scratch cards for result checking.' },
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
        {tab === 'overview'  && <Overview stats={stats} orders={orders} loading={loading} s={s} onSelectOrder={setSelectedOrder} />}
        {tab === 'orders'    && <OrdersTab orders={orders} loading={loading} s={s} user={user} profile={profile} onSelectOrder={setSelectedOrder} />}
        {tab === 'topics'    && <TopicsTab user={user} profile={profile} onOrderCreated={() => setTab('orders')} s={s} />}
        {tab === 'services'  && <ServicesTab user={user} profile={profile} onOrderCreated={() => { setTab('orders'); }} s={s} />}
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
function OrderDetailView({ order: initialOrder, user, profile, onBack }) {
  const [order, setOrder]       = useState(initialOrder);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);

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
        type: 'text', text: txt, createdAt: ts(),
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

  const sendFile = async (file) => {
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB.'); return; }
    setFileUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await addDoc(collection(db, 'orderChats', order.id, 'messages'), {
            sender: 'client', senderName: profile?.name || user.displayName || 'Client',
            type: 'file',
            fileName: file.name,
            fileData: reader.result,
            fileSize: file.size,
            createdAt: ts(),
          });
          await addDoc(collection(db, 'notifications'), {
            userId: 'admin',
            title: `📎 File sent on: ${order.serviceTitle || order.topicTitle || 'Order'}`,
            body: `${profile?.name || 'Client'} sent a file: ${file.name}`,
            orderId: order.id, type: 'message', read: false, createdAt: ts(),
          });
        } catch (e) { console.error(e); alert('File send failed.'); }
        setFileUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) { console.error(e); setFileUploading(false); }
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

        {/* Accepted — pay 50% advance (show for accepted OR in_progress until advance confirmed) */}
        {['accepted', 'in_progress', 'priced'].includes(order.status) && (order.agreedPrice || order.totalAmount) && !(order.advancePaid || order.paymentStatus === 'advance_confirmed') && (
          <div>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>✅ Price agreed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>₦{Number(order.agreedPrice || order.totalAmount).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Total agreed price</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(201,168,76,0.08)', borderRadius: 8, padding: '10px 12px', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>50% Advance (pay now)</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>₦{Math.round(Number(order.agreedPrice || order.totalAmount) / 2).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 12px' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>50% Final (after completion)</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>₦{Math.round(Number(order.agreedPrice || order.totalAmount) / 2).toLocaleString()}</span>
              </div>
            </div>
            <ManualPaymentUpload order={order} paymentStage="advance" onDone={() => {}} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>Work begins after advance payment is confirmed. Final 50% due on completion.</div>
          </div>
        )}

        {/* In progress — advance confirmed, waiting for completion */}
        {(order.advancePaid || order.paymentStatus === 'advance_confirmed') && !(order.finalPaid || order.paymentStatus === 'final_confirmed') && order.status !== 'completed' && (order.agreedPrice || order.totalAmount) && (
          <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>⚙️ Work In Progress</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>✅ Advance paid</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₦{(order.advanceAmount || Math.round(Number(order.agreedPrice || order.totalAmount) / 2)).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⏳ Balance due on completion</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>₦{Math.round(Number(order.agreedPrice || order.totalAmount) / 2).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Completed — locked document + pay final 50% */}
        {order.status === 'completed' && (order.advancePaid || order.paymentStatus === 'advance_confirmed') && !(order.finalPaid || order.paymentStatus === 'final_confirmed') && (
          <div>
            {/* Locked document card */}
            <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(201,168,76,0.45)', borderRadius: 14, overflow: 'hidden', marginBottom: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              {/* Header strip */}
              <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Your work is ready!</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Complete payment to unlock and download your document.</div>
                </div>
              </div>

              {/* Blurred / locked preview */}
              <div style={{ position: 'relative', background: 'var(--bg-tertiary)', padding: 16 }}>
                {/* Fake document lines — blurred */}
                <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.55 }}>
                  {[100, 90, 95, 70, 85, 60, 92, 75, 88, 50].map((w, i) => (
                    <div key={i} style={{ height: i % 4 === 0 ? 14 : 9, width: `${w}%`, background: i % 4 === 0 ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: 4, marginBottom: i % 4 === 0 ? 10 : 7, opacity: i % 4 === 0 ? 0.7 : 0.4 }} />
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    {[45, 55].map((w, i) => (
                      <div key={i} style={{ flex: 1, height: 60, background: 'var(--border)', borderRadius: 6, opacity: 0.3 }} />
                    ))}
                  </div>
                  {[80, 65, 90, 40].map((w, i) => (
                    <div key={i} style={{ height: 9, width: `${w}%`, background: 'var(--text-muted)', borderRadius: 4, marginBottom: 7, marginTop: i === 0 ? 14 : 0, opacity: 0.4 }} />
                  ))}
                </div>

                {/* Lock overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(var(--bg-primary-rgb, 15,23,42), 0.55)',
                  backdropFilter: 'blur(2px)',
                  gap: 10,
                }}>
                  {/* Animated lock icon */}
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.10))',
                    border: '2px solid rgba(201,168,76,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 8px rgba(201,168,76,0.08)',
                    animation: 'lockPulse 2.4s ease-in-out infinite',
                  }}>
                    <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="14" width="26" height="19" rx="4" fill="#C9A84C" fillOpacity="0.9"/>
                      <path d="M7 14V10C7 6.13 10.13 3 14 3H16C19.87 3 23 6.13 23 10V14" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="15" cy="23" r="3" fill="white" fillOpacity="0.9"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold, #C9A84C)', fontSize: 15, letterSpacing: 0.3 }}>Document Locked</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>Pay balance to unlock</div>
                  </div>
                </div>
              </div>

              {/* File name hint */}
              {order.draftFileName && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)' }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{order.draftFileName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gold, #C9A84C)', fontWeight: 700 }}>🔒 Locked</span>
                </div>
              )}
            </div>

            {/* Payment breakdown */}
            <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>✅ Advance already paid</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₦{(order.advanceAmount || Math.round(Number(order.agreedPrice || order.totalAmount) / 2)).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔒 Balance to unlock delivery</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>₦{Math.round(Number(order.agreedPrice || order.totalAmount) / 2).toLocaleString()}</span>
              </div>
            </div>

            <ManualPaymentUpload order={order} paymentStage="final" onDone={() => {}} />
            <style>{`@keyframes lockPulse { 0%,100%{box-shadow:0 0 0 8px rgba(201,168,76,0.08)} 50%{box-shadow:0 0 0 16px rgba(201,168,76,0.04)} }`}</style>
          </div>
        )}

        {/* Fully paid — unlocked download */}
        {(order.finalPaid || order.paymentStatus === 'final_confirmed') && order.draftFileData && (
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '2px solid rgba(22,163,74,0.4)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(22,163,74,0.15)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#15803D,#16A34A)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🔓</span>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Document Unlocked!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Your payment was confirmed. Download your work below.</div>
              </div>
            </div>
            {/* Document card */}
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(22,163,74,0.12)', border: '2px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.draftFileName || `${title}.pdf`}</div>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Ready to download</div>
              </div>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <a
                href={order.draftFileData}
                download={order.draftFileName || `${title}.pdf`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', textDecoration: 'none', boxSizing: 'border-box' }}>
                ⬇️ Download {order.draftFileName || 'Completed Work'}
              </a>
            </div>
          </div>
        )}

        {/* Fully paid but work not yet uploaded */}
        {(order.finalPaid || order.paymentStatus === 'final_confirmed') && !order.draftFileData && (
          <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>✅ Payment Confirmed — Preparing Your Document</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your full payment has been received. The admin will upload your completed work shortly — you'll see a download button appear here.</div>
          </div>
        )}

        {/* ── Order Chat ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>💬 Order Chat</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Back-and-forth with admin / writer about this order. You can also send files here.</div>
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
                    {msg.type === 'file' ? (
                      <a href={msg.fileData} download={msg.fileName}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMe ? '#fff' : 'var(--teal)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                        <span style={{ fontSize: 20 }}>📎</span>
                        <div>
                          <div style={{ wordBreak: 'break-word' }}>{msg.fileName}</div>
                          <div style={{ fontSize: 10, opacity: 0.7 }}>{msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : ''} · Tap to download</div>
                        </div>
                      </a>
                    ) : (
                      <span style={{ wordBreak: 'break-word' }}>{msg.text}</span>
                    )}
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-card)' }}>
            <label title="Attach file" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0, fontSize: 16 }}>
              {fileUploading ? <div style={{ width: 14, height: 14, border: '2px solid var(--teal)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : '📎'}
              <input ref={fileRef} type="file" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { sendFile(f); e.target.value = ''; } }} />
            </label>
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Type a message or attach a file..."
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
                {o.status === 'accepted' && !o.advancePaid && (o.agreedPrice || o.totalAmount) && (
                  <span style={{ fontSize: 11, color: '#fff', background: 'var(--gold)', borderRadius: 6, padding: '3px 9px', fontWeight: 700 }}>💳 Pay 50%</span>
                )}
                {(o.status === 'completed' || o.draftFileData) && !(o.finalPaid || o.paymentStatus === 'final_confirmed') && (o.advancePaid || o.paymentStatus === 'advance_confirmed') && (
                  <span style={{ fontSize: 11, color: '#fff', background: 'linear-gradient(135deg,#92400E,#C9A84C)', borderRadius: 6, padding: '3px 9px', fontWeight: 700 }}>🔒 Locked</span>
                )}
                {o.finalPaid && o.draftFileData && (
                  <span style={{ fontSize: 11, color: '#fff', background: '#16A34A', borderRadius: 6, padding: '3px 9px', fontWeight: 700 }}>🔓 Download ready</span>
                )}
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
                  {o.status === 'accepted' && !o.advancePaid && (o.agreedPrice || o.totalAmount) && (
                    <span style={{ fontSize: 11, color: '#fff', background: 'var(--gold)', borderRadius: 6, padding: '3px 9px', fontWeight: 700 }}>💳 Pay 50% to start</span>
                  )}
                  {(o.status === 'completed' || o.draftFileData) && !(o.finalPaid || o.paymentStatus === 'final_confirmed') && (o.advancePaid || o.paymentStatus === 'advance_confirmed') && (
                    <span style={{ fontSize: 11, color: '#fff', background: 'linear-gradient(135deg,#92400E,#C9A84C)', borderRadius: 6, padding: '3px 9px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔒 Pay to unlock document
                    </span>
                  )}
                  {(o.finalPaid || o.paymentStatus === 'final_confirmed') && o.draftFileData && (
                    <span style={{ fontSize: 11, color: '#fff', background: '#16A34A', borderRadius: 6, padding: '3px 9px', fontWeight: 700 }}>🔓 Ready to download</span>
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
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Ref: <span style={{ fontFamily: 'monospace' }}>{o.monnifyRef || o.finalMonnifyRef}</span></div>
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

// ── Services Tab ──────────────────────────────────────────────
const SERVICE_FIELDS = {
  research_projects: [
    { name: 'topic',    label: 'Research Topic / Area *',  type: 'text',     placeholder: 'e.g. Effect of malaria on under-5 children in Lagos', required: true },
    { name: 'level',    label: 'Academic Level *',          type: 'select',   required: true,
      options: ['OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD','Other'] },
    { name: 'chapters', label: 'Chapters Needed',           type: 'select',   required: false,
      options: ['Chapter 1 only','Chapters 1–3','Chapters 1–5 (Full)','Data Analysis only','Full Project + Defence Slides'] },
    { name: 'subject',  label: 'Course / Department',       type: 'text',     placeholder: 'e.g. Nursing Science, Public Health', required: false },
  ],
  data_analysis: [
    { name: 'software',    label: 'Software / Tool *',          type: 'select', required: true,
      options: ['SPSS','Excel','R','Stata','Python','Google Sheets','Other'] },
    { name: 'dataType',    label: 'Type of Data *',              type: 'select', required: true,
      options: ['Survey / Questionnaire','Experimental','Secondary / Existing','Clinical','Other'] },
    { name: 'sampleSize',  label: 'Sample Size',                 type: 'text',   placeholder: 'e.g. 150 respondents', required: false },
    { name: 'outputNeeded',label: 'Output Needed *',             type: 'select', required: true,
      options: ['Tables & Charts only','Full Interpretation','Chapter 4 Write-up','Full Report','Presentation Slides'] },
  ],
  client_care: [
    { name: 'issueType',   label: 'What Do You Need Help With? *', type: 'select', required: true,
      options: ['Follow-up on an existing order','Complaint / Issue','General Inquiry','Price Negotiation','Other'] },
    { name: 'orderId',     label: 'Order / Reference ID (if any)', type: 'text', placeholder: 'Leave blank if not applicable', required: false },
  ],
  academic_assignments: [
    { name: 'assignmentType', label: 'Assignment Type *', type: 'select', required: true,
      options: ['Essay','Case Study','Report','Term Paper','Coursework','Lab Report','Dissertation Chapter','Other'] },
    { name: 'subject',        label: 'Course / Subject *',  type: 'text',   placeholder: 'e.g. Community Health Nursing', required: true },
    { name: 'wordCount',      label: 'Word / Page Count',   type: 'text',   placeholder: 'e.g. 1500 words or 5 pages', required: false },
    { name: 'academicLevel',  label: 'Academic Level',      type: 'select', required: false,
      options: ['Secondary / WAEC','OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD','Other'] },
  ],
  online_registration: [
    { name: 'regType', label: 'Registration Type *', type: 'select', required: true,
      options: ['JAMB / UTME','WAEC','NECO','Post-UTME','School Portal','NIN / BVN',
                'NMCN Indexing','NMCN Licensing','Professional Body','Other'] },
    { name: 'candidateName', label: "Candidate's Full Name (if different)", type: 'text', placeholder: 'Leave blank if same as above', required: false },
  ],
  powerpoint: [
    { name: 'topic',      label: 'Presentation Topic *',        type: 'text',   placeholder: 'e.g. Effect of hypertension in elderly patients', required: true },
    { name: 'slides',     label: 'Number of Slides (approx.)',  type: 'text',   placeholder: 'e.g. 20 slides', required: false },
    { name: 'purpose',    label: 'Purpose *',                   type: 'select', required: true,
      options: ['Project Defence','Seminar','Business Pitch','Conference','Lecture','Other'] },
    { name: 'hasContent', label: 'Do you have existing content / notes?', type: 'select', required: false,
      options: ['Yes — I will provide notes / text','Partially — some ideas only','No — create from scratch'] },
  ],
  proofreading: [
    { name: 'docType',    label: 'Document Type *',   type: 'select', required: true,
      options: ['Research Project','Essay / Assignment','Thesis / Dissertation','Report','CV / Cover Letter','Business Document','Other'] },
    { name: 'wordCount',  label: 'Approximate Word Count', type: 'text', placeholder: 'e.g. 5000 words', required: false },
    { name: 'citationStyle', label: 'Citation Style',   type: 'select', required: false,
      options: ['APA','MLA','Harvard','Vancouver','Chicago','None / Not sure'] },
    { name: 'focus',      label: 'Focus Areas',         type: 'select', required: false,
      options: ['Grammar & Spelling only','Grammar + Flow + Structure','Full Edit + Formatting','Plagiarism Check included'] },
  ],
  survey_design: [
    { name: 'surveyTopic',  label: 'Survey Topic / Research Area *', type: 'text',   placeholder: 'e.g. Patient satisfaction in primary healthcare', required: true },
    { name: 'needType',     label: 'What Do You Need? *',             type: 'select', required: true,
      options: ['Questionnaire Design only','Google Form Setup','Data Collection Strategy','Full Analysis of Results','Complete End-to-End Package'] },
    { name: 'respondents',  label: 'Target Respondents',              type: 'text',   placeholder: 'e.g. Final year nursing students', required: false },
    { name: 'sampleSize',   label: 'Expected Sample Size',            type: 'text',   placeholder: 'e.g. 100–200', required: false },
  ],
  waec_neco: [
    { name: 'cardType',    label: 'Card Type *',       type: 'select', required: true,
      options: ['WAEC Result Checker','NECO Result Checker','WAEC Scratch Card (others)','NECO Scratch Card (others)'] },
    { name: 'quantity',    label: 'Number of Cards *', type: 'select', required: true,
      options: ['1','2','3','4','5','10','Other'] },
    { name: 'examYear',    label: 'Exam Year',          type: 'text',   placeholder: 'e.g. 2024', required: false },
    { name: 'delivery',    label: 'Delivery Method *',  type: 'select', required: true,
      options: ['WhatsApp (instant)','Email','In-person pickup'] },
  ],
};

const inputSt = { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const labelSt = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

function ServicesTab({ user, profile, onOrderCreated, s }) {
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const service = SERVICES.find(sv => sv.key === selected);
  const fields  = selected ? (SERVICE_FIELDS[selected] || []) : [];

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const requiredFilled = () => {
    if (!form.details?.trim()) return false;
    return fields.filter(f => f.required).every(f => form[f.name]?.trim?.());
  };

  const submit = async () => {
    if (!requiredFilled()) { alert('Please fill in all required fields.'); return; }
    if (!user) { alert('Please log in first.'); return; }
    setSubmitting(true);
    try {
      const extraData = {};
      fields.forEach(f => { if (form[f.name]) extraData[f.name] = form[f.name]; });
      await addDoc(collection(db, 'serviceRequests'), {
        serviceKey:      service.key,
        serviceTitle:    service.title,
        userId:          user.uid,
        clientId:        user.uid,
        name:            profile?.name || user.displayName || '',
        email:           user.email || '',
        phone:           form.phone || profile?.phone || '',
        description:     form.details,
        details:         form.details,
        deadline:        form.deadline || '',
        additionalNotes: form.notes || '',
        extraData,
        status:          'pending',
        agreedPrice:     null,
        adminNote:       '',
        paymentStatus:   'not_set',
        referredBy:      profile?.referredBy || null,
        createdAt:       ts(),
        updatedAt:       ts(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId:    'admin',
        title:     `📋 New ${service.title} request`,
        body:      `${profile?.name || 'Client'} submitted a ${service.title} request.`,
        type:      'order',
        read:      false,
        createdAt: ts(),
      });
      setSubmitted(true);
      setTimeout(() => onOrderCreated(), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  const isNMCN = selected === 'online_registration' &&
    (form.regType === 'NMCN Indexing' || form.regType === 'NMCN Licensing');

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>Request Submitted!</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Admin will review and send you a quote shortly. Redirecting to My Orders…</p>
    </div>
  );

  if (selected === 'online_registration' && isNMCN) return (
    <NMCNForm
      regType={form.regType}
      user={user}
      profile={profile}
      onBack={() => { setSelected(null); setForm({}); }}
      onSuccess={() => { setSubmitted(true); setTimeout(() => onOrderCreated(), 2000); }}
    />
  );

  if (selected && service) return (
    <div>
      <button onClick={() => { setSelected(null); setForm({}); setSubmitted(false); }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Services
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <span style={{ fontSize: 36 }}>{service.icon}</span>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{service.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>{service.desc}</p>
        </div>
      </div>
      <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10, padding: '11px 14px', marginBottom: 24, fontSize: 13, color: 'var(--teal)', display: 'flex', gap: 8 }}>
        📋 After submitting, our team will review your request, discuss details & pricing with you, then begin work once agreed.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelSt}>Full Name *</label>
          <input name="fullName" value={form.fullName || profile?.name || user?.displayName || ''} onChange={handle} placeholder="Your full name" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Email Address *</label>
          <input name="email" type="email" value={form.email || user?.email || ''} onChange={handle} placeholder="your@email.com" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Phone Number *</label>
          <input name="phone" value={form.phone || profile?.phone || ''} onChange={handle} placeholder="e.g. 08012345678" style={inputSt} />
        </div>
        {fields.map(f => (
          <div key={f.name}>
            <label style={labelSt}>{f.label}</label>
            {f.type === 'select' ? (
              <select name={f.name} value={form[f.name] || ''} onChange={handle} style={inputSt}>
                <option value="">-- Select --</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name] || ''} onChange={handle} placeholder={f.placeholder} rows={3} style={{ ...inputSt, resize: 'vertical' }} />
            ) : (
              <input name={f.name} type={f.type || 'text'} value={form[f.name] || ''} onChange={handle} placeholder={f.placeholder} style={inputSt} />
            )}
          </div>
        ))}
        <div>
          <label style={labelSt}>Project Details / Description *</label>
          <textarea name="details" rows={5} value={form.details || ''} onChange={handle} placeholder="Describe exactly what you need — the more detail, the better we can help you." style={{ ...inputSt, resize: 'vertical' }} />
        </div>
        <div>
          <label style={labelSt}>Preferred Deadline</label>
          <select name="deadline" value={form.deadline || ''} onChange={handle} style={inputSt}>
            <option value="">-- Select --</option>
            {['Within 24 hours','2–3 days','Within a week','2 weeks','1 month','Flexible'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button onClick={submit} disabled={submitting || !requiredFilled()}
          style={{ background: 'linear-gradient(135deg, #1E3A8A, #0D9488)', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', opacity: requiredFilled() ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? '⏳ Submitting…' : `🚀 Submit Request`}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Our Services</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Choose a service — admin will review and send you a price quote.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SERVICES.map(sv => (
          <button key={sv.key} onClick={() => { setSelected(sv.key); setForm({}); setSubmitted(false); }}
            style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--border-card)', textAlign: 'left', width: '100%', transition: 'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--teal-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{sv.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>{sv.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sv.desc}</div>
            </div>
            <span style={{ color: 'var(--teal)', fontSize: 20, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── NMCN Full Registration Form ───────────────────────────────
function NMCNForm({ regType, user, profile, onBack, onSuccess }) {
  const isIndexing  = regType === 'NMCN Indexing';

  const [subType, setSubType]       = useState('');
  const [passport, setPassport]     = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection]       = useState('A');
  const [form, setForm]             = useState({
    surname:    profile?.name?.split(' ')[0] || '',
    firstName:  profile?.name?.split(' ')[1] || '',
    lastName:   profile?.name?.split(' ')[0] || '',
    email:      user?.email || '',
    phone:      profile?.phone || '',
  });

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePassport = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert('Passport photo must be under 500KB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setPassport(reader.result); setPassportPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const indexingTypes  = ['Basic Indexing','Midwifery Indexing','Public Health Indexing','Community Nursing','Community Midwifery','Other Post Basic'];
  const licensingTypes = ['Basic Licensing','Midwifery Licensing','Public Health Licensing','Community Nursing Licensing','Community Midwifery Licensing','Other Post Basic Licensing'];
  const subOptions = isIndexing ? indexingTypes : licensingTypes;
  const sections = ['A','B','C','D','E','F'];

  const inp = { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 };
  const sec = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: '18px 16px', marginBottom: 20 };
  const secTitle = { fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--teal)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 0.5 };
  const row = { display: 'flex', flexDirection: 'column', gap: 14 };

  const Field = ({ name, label, type='text', placeholder='', options=[] }) => (
    <div>
      <label style={lbl}>{label}</label>
      {type === 'select' ? (
        <select name={name} value={form[name] || ''} onChange={handle} style={inp}>
          <option value="">-- Select --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'date' ? (
        <input name={name} type="date" value={form[name] || ''} onChange={handle} style={{ ...inp, colorScheme: 'dark' }} />
      ) : (
        <input name={name} type={type} value={form[name] || ''} onChange={handle} placeholder={placeholder} style={inp} />
      )}
    </div>
  );

  const submit = async () => {
    if (!subType) { alert('Please select the specific type (e.g. Basic Indexing).'); return; }
    if (!form.surname || !form.firstName || !form.email || !form.phone) {
      alert('Please fill in at least your name, email and phone number.'); return;
    }
    setSubmitting(true);
    try {
      const allData = { ...form, subType, passport: passport || null };
      await addDoc(collection(db, 'serviceRequests'), {
        serviceKey:   'online_registration',
        serviceTitle: `NMCN ${regType.replace('NMCN ','')} — ${subType}`,
        userId:       user.uid,
        clientId:     user.uid,
        name:         `${form.firstName || ''} ${form.surname || ''}`.trim() || profile?.name || '',
        email:        form.email || user?.email || '',
        phone:        form.phone || '',
        description:  `NMCN ${regType} — ${subType}`,
        details:      `NMCN ${regType} — ${subType}`,
        nmcnType:     regType,
        nmcnSubType:  subType,
        extraData:    allData,
        status:       'pending',
        agreedPrice:  null,
        adminNote:    '',
        paymentStatus:'not_set',
        referredBy:   profile?.referredBy || null,
        createdAt:    ts(),
        updatedAt:    ts(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId:    'admin',
        title:     `📋 NMCN ${regType} — ${subType}`,
        body:      `${form.firstName || profile?.name || 'Client'} submitted NMCN ${regType} (${subType}).`,
        type:      'order',
        read:      false,
        createdAt: ts(),
      });
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <button onClick={onBack} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>← Back</button>
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>NMCN</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff' }}>{regType} Registration</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Online Registration and Licensing Platform</div>
      </div>
      <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
        <label style={{ ...lbl, color: 'var(--gold)' }}>{regType} Type *</label>
        <select value={subType} onChange={e => setSubType(e.target.value)} style={{ ...inp, borderColor: subType ? 'var(--gold)' : 'var(--border)' }}>
          <option value="">-- Select Type --</option>
          {subOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10, padding: '11px 14px', marginBottom: 24, fontSize: 13, color: 'var(--teal)' }}>
        📋 Fill all sections accurately. Admin will process and provide payment details. Documents can be uploaded as files after submission via the order chat.
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', background: section === s ? 'var(--teal)' : 'var(--bg-secondary)', color: section === s ? '#fff' : 'var(--text-muted)' }}>
            Sec {s}
          </button>
        ))}
      </div>

      {section === 'A' && (
        <div style={sec}>
          <div style={secTitle}>Section A — Institution & Admission Details</div>
          <div style={row}>
            <Field name="institutionName" label="1. Institution Name" placeholder="e.g. University of Lagos Teaching Hospital" />
            <Field name="examNumber" label="2. Exam Number" placeholder="e.g. 1234567890" />
            <Field name="surname" label="3. Surname *" placeholder="e.g. Okonkwo" />
            <Field name="emailA" label="4. Email Address *" type="email" placeholder={user?.email || 'your@email.com'} />
            <Field name="phoneA" label="5. Phone Number *" placeholder="e.g. 08012345678" />
            <Field name="applicationNumber" label="6. Application Number" placeholder="Application reference number" />
            <Field name="indexingNumber" label="7. Indexing Number" placeholder="Your NMCN indexing number (if any)" />
            <Field name="admissionDate" label="8. Admission Date" type="date" />
            <Field name="dobA" label="9. Date of Birth" type="date" />
            <Field name="genderA" label="10. Gender" type="select" options={['Male','Female']} />
            <Field name="maritalStatusA" label="11. Marital Status" type="select" options={['Single','Married','Divorced','Widowed']} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button onClick={() => setSection('B')} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Next: Section B →</button>
          </div>
        </div>
      )}
      {section === 'B' && (
        <div style={sec}>
          <div style={secTitle}>Section B — Personal Information</div>
          <div style={row}>
            <Field name="firstName" label="1. First Name *" placeholder="e.g. Emeka" />
            <Field name="middleName" label="2. Middle Name" placeholder="Optional" />
            <Field name="lastName" label="3. Last Name *" placeholder="e.g. Okonkwo" />
            <Field name="dob" label="4. Date of Birth *" type="date" />
            <Field name="gender" label="5. Gender *" type="select" options={['Male','Female']} />
            <Field name="phone" label="6. Phone Number *" placeholder="e.g. 08012345678" />
            <Field name="email" label="7. Email Address *" type="email" placeholder={user?.email} />
            <Field name="nationality" label="8. Nationality" placeholder="e.g. Nigerian" />
            <Field name="stateOfOrigin" label="9. State of Origin" placeholder="e.g. Anambra State" />
            <Field name="lga" label="10. Local Government Area" placeholder="e.g. Onitsha North" />
            <Field name="permanentAddress" label="11. Town & Permanent Address" placeholder="e.g. 5 Eze Street, Onitsha" />
            <Field name="maritalStatus" label="12. Marital Status" type="select" options={['Single','Married','Divorced','Widowed']} />
            <Field name="country" label="13. Country" placeholder="e.g. Nigeria" />
            <Field name="residentialAddress" label="14. Residential Address" placeholder="Current residential address" />
            <Field name="residentialLGA" label="15. Residential LGA" placeholder="e.g. Yaba" />
            <Field name="residentialState" label="16. Residential State" placeholder="e.g. Lagos State" />
            <Field name="residentialTown" label="17. Residential Town" placeholder="e.g. Yaba" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
            <button onClick={() => setSection('A')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>← Section A</button>
            <button onClick={() => setSection('C')} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Next: Section C →</button>
          </div>
        </div>
      )}
      {section === 'C' && (
        <div style={sec}>
          <div style={secTitle}>Section C — Next of Kin (NOK)</div>
          <div style={row}>
            <Field name="nokName" label="1. NOK Full Name" placeholder="e.g. Mrs. Grace Okonkwo" />
            <Field name="nokPhone" label="2. NOK Phone Number" placeholder="e.g. 08098765432" />
            <Field name="nokAddress" label="3. NOK Address" placeholder="e.g. 5 Eze Street, Onitsha" />
            <Field name="nokRelationship" label="4. Relationship with NOK" type="select" options={['Father','Mother','Spouse','Sibling','Child','Guardian','Other']} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
            <button onClick={() => setSection('B')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>← Section B</button>
            <button onClick={() => setSection('D')} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Next: Section D →</button>
          </div>
        </div>
      )}
      {section === 'D' && (
        <div style={sec}>
          <div style={secTitle}>Section D — Documents to Upload (Scanned Copies)</div>
          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#2563EB' }}>
            ℹ️ Upload scanned copies of each document below. Max 1MB per file. JPG, PNG or PDF.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'waecNeco', label: '1. WAEC or NECO Certificate *', desc: 'Scanned copy of result certificate' },
              { name: 'admissionLetter', label: '2. Admission Letter *', desc: 'Original admission letter from institution' },
              { name: 'testimonial', label: '3. Testimonial', desc: 'Signed testimonial from institution' },
              { name: 'birthCert', label: '4. Birth Certificate *', desc: 'Birth certificate or declaration of age' },
            ].map(doc => {
              const fileKey = `docFile_${doc.name}`;
              const uploaded = form[fileKey];
              return (
                <div key={doc.name} style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '14px', border: `1.5px solid ${uploaded ? 'rgba(22,163,74,0.5)' : 'var(--border)'}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{doc.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{doc.desc}</div>
                  {uploaded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{uploaded.startsWith('data:image') ? '🖼️' : '📄'}</span>
                      <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 700 }}>✅ Uploaded</span>
                      <button onClick={() => setForm(p => { const n = {...p}; delete n[fileKey]; return n; })}
                        style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Remove</button>
                    </div>
                  ) : (
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--teal)', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      📎 Choose File
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 1048576) { alert(`${doc.label}: File must be under 1MB.`); return; }
                          const reader = new FileReader();
                          reader.onloadend = () => setForm(p => ({ ...p, [fileKey]: reader.result, [`has${doc.name.charAt(0).toUpperCase()+doc.name.slice(1)}`]: 'yes' }));
                          reader.readAsDataURL(file);
                        }} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
            <button onClick={() => setSection('C')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>← Section C</button>
            <button onClick={() => setSection('E')} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Next: Section E →</button>
          </div>
        </div>
      )}
      {section === 'E' && (
        <div style={sec}>
          <div style={secTitle}>Section E — Sponsor Information</div>
          <div style={row}>
            <Field name="nin" label="1. NIN (National ID Number)" placeholder="11-digit NIN" />
            <Field name="sponsorName" label="2. Sponsor Name" placeholder="e.g. Mr. John Okonkwo" />
            <Field name="sponsorAddress" label="3. Sponsor Address" placeholder="Full sponsor address" />
            <Field name="sponsorPhone" label="4. Sponsor Phone" placeholder="e.g. 08012345678" />
            <Field name="sponsorEmail" label="5. Sponsor Email" type="email" placeholder="sponsor@email.com" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
            <button onClick={() => setSection('D')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>← Section D</button>
            <button onClick={() => setSection('F')} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>Next: Section F →</button>
          </div>
        </div>
      )}
      {section === 'F' && (
        <div style={sec}>
          <div style={secTitle}>Section F — Examination Body Details & Passport</div>
          <div style={row}>
            <Field name="examBody" label="1. WAEC / NECO" type="select" options={['WAEC','NECO','Both']} />
            <Field name="examType" label="2. Exam Type" type="select" options={['SSCE','GCE','Other']} />
            <Field name="examinationNumber" label="3. Examination Number" placeholder="Your exam registration number" />
            <Field name="examYear" label="4. Exam Year" placeholder="e.g. 2022" />
            <Field name="scratchSerial" label="5. Scratch Card Serial Number" placeholder="Serial number on card" />
            <Field name="scratchPin" label="6. Scratch Card PIN" placeholder="Scratch card PIN" />
            <Field name="necoToken" label="7. Token (NECO only)" placeholder="NECO token (leave blank if WAEC)" />
            <div>
              <label style={{ ...lbl, color: 'var(--gold)' }}>8. Passport Photograph *</label>
              <div style={{ border: `2px dashed ${passportPreview ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 10, padding: '20px', textAlign: 'center', background: 'var(--bg-tertiary)' }}>
                {passportPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <img src={passportPreview} alt="Passport preview" style={{ width: 100, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--teal)' }} />
                    <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Passport uploaded</span>
                    <button onClick={() => { setPassport(null); setPassportPreview(null); }} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Upload passport photograph (max 500KB, JPG/PNG)</div>
                    <label style={{ background: 'var(--teal)', color: '#fff', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'inline-block' }}>
                      Choose Photo
                      <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePassport} style={{ display: 'none' }} />
                    </label>
                  </>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>White background, front-facing, recent passport-size photo</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
            <button onClick={() => setSection('E')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>← Section E</button>
            <button onClick={submit} disabled={submitting || !subType}
              style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)', opacity: subType ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {submitting ? '⏳ Submitting…' : '🚀 Submit NMCN Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Topics Tab ────────────────────────────────────────────────
function TopicsTab({ user, profile, onOrderCreated, s }) {
  const [topics, setTopics]         = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTopic, setSelectedTopic]   = useState(null);
  const [ordering, setOrdering]     = useState(false);
  const [details, setDetails]       = useState('');
  const [ordered, setOrdered]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const CATEGORY_GROUPS = [
    { group: '🏥 Health Sciences', color: '#0D9488', bg: 'rgba(13,148,136,0.1)', cats: ['Nursing Science','Midwifery','Medicine & Surgery','Public Health','Community Health','Mental Health','Pharmacology','Medical Laboratory Science','Physiotherapy','Radiography','Nutrition & Dietetics','Environmental Health','Health Information Management','Optometry','Dental Surgery','Medical Rehabilitation','Veterinary Medicine'] },
    { group: '🎓 Education', color: '#2563EB', bg: 'rgba(37,99,235,0.1)', cats: ['Education','Educational Management','Guidance & Counselling','Early Childhood Education','Special Education','Curriculum Studies','Educational Psychology'] },
    { group: '💼 Business & Social Sciences', color: '#D97706', bg: 'rgba(217,119,6,0.1)', cats: ['Business Administration','Accounting','Economics','Marketing','Banking & Finance','Public Administration','Sociology','Psychology','Political Science','Mass Communication','Social Work'] },
    { group: '⚙️ Sciences & Technology', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', cats: ['Computer Science','Information Technology','Electrical Engineering','Civil Engineering','Mechanical Engineering','Agricultural Science','Biochemistry','Microbiology','Chemistry','Physics','Environmental Science'] },
    { group: '⚖️ Law & Humanities', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', cats: ['Law','English Language','History','Philosophy','Religious Studies','Linguistics'] },
  ];

  const getCategoryGroup = (cat) => CATEGORY_GROUPS.find(g => g.cats.includes(cat)) || null;

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'researchTopics'), orderBy('createdAt', 'desc')),
      snap => {
        setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.badge !== 'Hidden'));
        setLoadingTopics(false);
      },
      () => setLoadingTopics(false)
    );
    return unsub;
  }, []);

  const filtered = topics.filter(t => {
    const matchCat  = activeCategory === 'All' || t.category === activeCategory;
    const matchSrch = !search.trim() || t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  const submitOrder = async () => {
    if (!user) { alert('Please log in first.'); return; }
    setOrdering(true);
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        serviceKey: 'research_projects', serviceTitle: selectedTopic.title, topicId: selectedTopic.id,
        topicTitle: selectedTopic.title, userId: user.uid, clientId: user.uid,
        name: profile?.name || user.displayName || '', email: user.email || '',
        phone: profile?.phone || '', description: details || `Order for topic: ${selectedTopic.title}`,
        details: details || '', pages: selectedTopic.pages || '', status: 'pending',
        agreedPrice: selectedTopic.price ? Number(selectedTopic.price.replace(/[^0-9]/g,'')) || null : null,
        adminNote: '', paymentStatus: 'not_set', referredBy: profile?.referredBy || null,
        createdAt: ts(), updatedAt: ts(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', title: `📚 Topic Order: ${selectedTopic.title}`,
        body: `${profile?.name || 'Client'} ordered the topic "${selectedTopic.title}"`,
        type: 'order', read: false, createdAt: ts(),
      });
      setOrdered(true);
      setTimeout(() => { onOrderCreated(); }, 2200);
    } catch (e) { console.error(e); alert('Failed to place order. Please try again.'); }
    setOrdering(false);
  };

  if (ordered) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>Topic Order Placed!</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Admin will review and send you a quote shortly. Redirecting to My Orders…</p>
    </div>
  );

  if (selectedTopic) return (
    <div>
      <button onClick={() => { setSelectedTopic(null); setDetails(''); }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>← Back to Topics</button>
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', borderRadius: 14, padding: '22px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{selectedTopic.category} · {selectedTopic.pages ? `${selectedTopic.pages} pages` : 'Pages TBD'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,3vw,20px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.4 }}>{selectedTopic.title}</h2>
            {selectedTopic.description && <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{selectedTopic.description}</p>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {selectedTopic.price && <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>{selectedTopic.price}</div>}
            {selectedTopic.badge && <div style={{ marginTop: 6, display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{selectedTopic.badge}</div>}
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 10, padding: '11px 14px', marginBottom: 20, fontSize: 13, color: 'var(--teal)' }}>📋 After ordering, admin will confirm and send you a final price quote. No payment until you agree.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Additional Instructions / Details</label>
          <textarea rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="Any specific instructions, department, academic level, deadline details, etc." style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <button onClick={submitOrder} disabled={ordering} style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', cursor: ordering ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: ordering ? 0.7 : 1 }}>
          {ordering ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Placing Order…</> : '📚 Order This Topic'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Research Library</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Browse pre-researched topics — select one and we'll write it to your specifications.</p>
      </div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..." style={{ width: '100%', padding: '11px 14px 11px 38px', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
      <div style={{ position: 'relative', marginBottom: 20 }} ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(v => !v)} style={{ width: '100%', padding: '11px 16px', background: 'var(--bg-card)', border: `1.5px solid ${activeCategory !== 'All' ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeCategory === 'All' ? <span style={{ color: 'var(--text-muted)' }}>🗂️ All Departments</span> : <><span style={{ width: 10, height: 10, borderRadius: '50%', background: getCategoryGroup(activeCategory)?.color || 'var(--teal)', display: 'inline-block', flexShrink: 0 }} /><span style={{ color: 'var(--teal)' }}>{activeCategory}</span></>}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
        </button>
        {dropdownOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 200, maxHeight: 400, overflowY: 'auto' }}>
            <button onClick={() => { setActiveCategory('All'); setDropdownOpen(false); }} style={{ width: '100%', padding: '11px 16px', background: activeCategory === 'All' ? 'var(--teal-glow)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: activeCategory === 'All' ? 'var(--teal)' : 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: activeCategory === 'All' ? 700 : 500, textAlign: 'left' }}>
              🗂️ All Departments {activeCategory === 'All' && <span style={{ marginLeft: 'auto', color: 'var(--teal)', fontSize: 14 }}>✓</span>}
            </button>
            {CATEGORY_GROUPS.map((grp, gi) => (
              <div key={grp.group}>
                <div style={{ padding: '8px 16px 5px', fontSize: 10, fontWeight: 800, color: grp.color, textTransform: 'uppercase', letterSpacing: 1, background: grp.bg, borderTop: gi > 0 ? '1px solid var(--border)' : 'none' }}>{grp.group}</div>
                {grp.cats.map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                      style={{ width: '100%', padding: '9px 16px 9px 24px', background: isActive ? grp.bg : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: isActive ? grp.color : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: isActive ? 700 : 400, textAlign: 'left' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? grp.color : 'transparent', flexShrink: 0 }} />
                      {cat}
                      {isActive && <span style={{ marginLeft: 'auto', color: grp.color, fontSize: 14 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setActiveCategory('Other'); setDropdownOpen(false); }} style={{ width: '100%', padding: '10px 16px', background: activeCategory === 'Other' ? 'rgba(148,163,184,0.1)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: activeCategory === 'Other' ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: activeCategory === 'Other' ? 700 : 400, textAlign: 'left' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0 }} />Other
                {activeCategory === 'Other' && <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>}
              </button>
            </div>
          </div>
        )}
      </div>
      {!loadingTopics && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{filtered.length} topic{filtered.length !== 1 ? 's' : ''} {activeCategory !== 'All' ? `in ${activeCategory}` : 'available'}{search && ` matching "${search}"`}</div>}
      {loadingTopics && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}><div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />Loading topics…</div>}
      {!loadingTopics && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>No topics found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{search ? `No topics match "${search}"` : `No topics available in this category yet.`}</div>
          {search && <button onClick={() => setSearch('')} style={{ marginTop: 14, background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Clear Search</button>}
        </div>
      )}
      {!loadingTopics && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <button key={t.id} onClick={() => { setSelectedTopic(t); setDetails(''); setOrdered(false); }}
              style={{ ...s.card, display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', border: '1px solid var(--border-card)', textAlign: 'left', width: '100%', transition: 'border-color 0.2s, background 0.2s', padding: '16px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--teal-glow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>{t.title}</div>
                  {t.badge && <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: t.badge === 'Popular' ? 'rgba(13,148,136,0.12)' : t.badge === 'New' ? 'rgba(37,99,235,0.12)' : 'var(--bg-tertiary)', color: t.badge === 'Popular' ? 'var(--teal)' : t.badge === 'New' ? '#2563EB' : 'var(--text-muted)' }}>{t.badge === 'Popular' ? '🔥 Popular' : t.badge === 'New' ? '✨ New' : t.badge}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>{t.category}</span>
                  {t.pages && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📄 {t.pages} pages</span>}
                  {t.price && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>{t.price}</span>}
                </div>
                {t.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.description}</div>}
              </div>
              <span style={{ color: 'var(--teal)', fontSize: 20, flexShrink: 0, alignSelf: 'center' }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}