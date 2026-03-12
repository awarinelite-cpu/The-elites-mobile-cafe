// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, CreditCard, Plus, Send, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const NAV = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Overview'  },
  { id: 'orders',    icon: FileText,        label: 'My Orders' },
  { id: 'messages',  icon: MessageSquare,   label: 'Messages'  },
  { id: 'payments',  icon: CreditCard,      label: 'Payments'  },
];

const STATUS_COLORS = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
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
  const navigate = useNavigate();
  const [tab, setTab]       = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Redirect admin straight to admin panel ──────────────
  useEffect(() => {
    if (profile?.isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [profile, navigate]);

  // ── Load client orders ──────────────────────────────────
  useEffect(() => {
    if (!user || profile?.isAdmin) return;
    const q = query(
      collection(db, 'serviceRequests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, profile]);

  const stats = {
    total:    orders.length,
    active:   orders.filter(o => ['pending','reviewing','accepted','in_progress'].includes(o.status)).length,
    complete: orders.filter(o => o.status === 'completed').length,
    spent:    orders.filter(o => o.agreedPrice).reduce((s, o) => s + Number(o.agreedPrice || 0), 0),
  };

  // Don't render client dashboard for admins
  if (profile?.isAdmin) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64 }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Client Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {profile?.name?.split(' ')[0] || 'Client'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>

        <nav style={{ padding: '14px 10px', flex: 1 }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, background: active ? 'var(--teal-glow)' : 'transparent', border: `1px solid ${active ? 'var(--teal)' : 'transparent'}`, color: active ? 'var(--teal)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>
                <Icon size={14} /> {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '10px' }}>
          <Link to="/services" style={{ width: '100%', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
            <Plus size={14} /> New Request
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: 'clamp(20px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        {tab === 'overview'  && <Overview stats={stats} orders={orders} loading={loading} onView={(o) => { setTab('orders'); }} navigate={navigate} />}
        {tab === 'orders'    && <OrdersTab orders={orders} loading={loading} />}
        {tab === 'messages'  && <MessagesTab orders={orders} user={user} profile={profile} />}
        {tab === 'payments'  && <PaymentsTab orders={orders} stats={stats} />}
      </main>
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────
function Overview({ stats, orders, loading, navigate }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Overview</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your activity at a glance.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 36 }}>
        {[
          ['Total Orders', stats.total,                          'var(--gold)'],
          ['Active',       stats.active,                         'var(--teal)'],
          ['Completed',    stats.complete,                       '#16A34A'],
          ['Spent',        `₦${stats.spent.toLocaleString()}`,  'var(--gold)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Recent Orders</h3>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No orders yet. Browse our services to get started.</p>
          <Link to="/services" style={{ background: 'var(--teal)', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Browse Services
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.serviceKey}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge status={o.status} />
                {o.agreedPrice && <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>₦{Number(o.agreedPrice).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ──────────────────────────────────────────────
function OrdersTab({ orders, loading }) {
  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>My Orders</h2>
        <Link to="/services" style={{ background: 'var(--teal)', color: '#fff', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={13} /> New Request
        </Link>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{o.serviceTitle || o.serviceKey}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge status={o.status} />
                  {o.agreedPrice && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₦{Number(o.agreedPrice).toLocaleString()}</span>}
                </div>
              </div>
              {o.adminNote && (
                <div style={{ background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)', marginBottom: 12 }}>
                  💬 <strong>Admin note:</strong> {o.adminNote}
                </div>
              )}
              {o.description && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{o.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Messages Tab ────────────────────────────────────────────
function MessagesTab({ orders, user, profile }) {
  const [sel, setSel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!sel) return;
    const q = query(
      collection(db, 'adminMessages', sel, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [sel]);

  const sendMsg = async () => {
    if (!text.trim() || !sel) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'adminMessages', sel, 'messages'), {
        sender: 'client',
        senderId: user.uid,
        senderName: profile?.name || 'Client',
        type: 'text',
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch { toast.error('Failed to send'); }
    setSending(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Messages</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
          <p style={{ color: 'var(--text-muted)' }}>Submit a request first to start messaging admin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, height: 500 }}>
          {/* Thread list */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {orders.map(o => (
              <button key={o.id} onClick={() => setSel(user.uid)}
                style={{ width: '100%', padding: '12px 14px', textAlign: 'left', background: sel === user.uid ? 'var(--teal-glow)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{o.serviceTitle || o.serviceKey}</div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>

          {/* Chat */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            {!sel ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select an order to view messages
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 'auto' }}>No messages yet</p>
                  )}
                  {messages.map(m => {
                    const isMe = m.sender === 'client';
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 14, background: isMe ? 'var(--teal)' : 'var(--bg-tertiary)', color: isMe ? '#fff' : 'var(--text-primary)', border: isMe ? 'none' : '1px solid var(--border)', fontSize: 14, lineHeight: 1.5, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                          {m.type === 'audio' ? (
                            <audio controls src={m.audioData} style={{ maxWidth: 200, height: 36 }} />
                          ) : m.text}
                          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                            {m.createdAt?.toDate?.()?.toLocaleTimeString?.('en', { hour: '2-digit', minute: '2-digit' }) || ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="Type a message..."
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }} />
                  <button onClick={sendMsg} disabled={sending || !text.trim()}
                    style={{ background: 'var(--teal)', border: 'none', borderRadius: 8, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
                    <Send size={14} color="#fff" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payments Tab ────────────────────────────────────────────
function PaymentsTab({ orders, stats }) {
  const paid = orders.filter(o => o.agreedPrice && o.status !== 'pending');
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Payments</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Total spent: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₦{stats.spent.toLocaleString()}</span>
      </p>
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
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>{o.serviceTitle}</div>
                <StatusBadge status={o.status} />
              </div>
              <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                ₦{Number(o.agreedPrice || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

    
