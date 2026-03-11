// src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, CreditCard, Plus, Send, Download, Lock, Eye, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToClientOrders, subscribeToMessages, sendMessage, updateOrder, subscribeToOrder } from '../firebase/orderService';
import { initiatePayment } from '../firebase/paystackService';
import { StatusBadge, Modal, EmptyState, Spinner, Card, Btn } from '../components/shared/UI';
import toast from 'react-hot-toast';

const NAV = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'orders',   icon: FileText,        label: 'My Orders' },
  { id: 'messages', icon: MessageSquare,   label: 'Messages' },
  { id: 'payments', icon: CreditCard,      label: 'Payments' },
];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drillOrder, setDrillOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToClientOrders(user.uid, data => { setOrders(data); setLoading(false); });
    return unsub;
  }, [user]);

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['pending','quoted','advance_paid','in_progress','preview_ready'].includes(o.status)).length,
    complete: orders.filter(o => o.status === 'final_paid').length,
    spent: orders.filter(o => o.paymentStatus !== 'unpaid').reduce((s, o) => s + (o.advanceAmount || 0) + (o.status === 'final_paid' ? (o.finalAmount || 0) : 0), 0),
  };

  const openOrder = (o) => { setDrillOrder(o); setTab('orders'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', paddingTop: 70 }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--dark-card)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 70, height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Client Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{profile?.name?.split(' ')[0] || 'Client'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
        <nav style={{ padding: '14px 10px', flex: 1 }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => { setTab(n.id); if (n.id !== 'orders') setDrillOrder(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 'var(--radius)', background: active ? 'var(--gold-glow)' : 'transparent', border: `1px solid ${active ? 'var(--border-gold)' : 'transparent'}`, color: active ? 'var(--gold)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'var(--transition)' }}>
                <Icon size={14} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '10px' }}>
          <button onClick={() => navigate('/request')} style={{ width: '100%', background: 'var(--gold)', color: 'var(--dark)', border: 'none', borderRadius: 'var(--radius)', padding: '9px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Plus size={13} /> New Request
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '28px clamp(14px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        {tab === 'overview' && <Overview stats={stats} orders={orders} loading={loading} onViewOrder={openOrder} navigate={navigate} />}
        {tab === 'orders'   && <OrdersTab orders={orders} loading={loading} user={user} profile={profile} initial={drillOrder} />}
        {tab === 'messages' && <MessagesTab orders={orders} user={user} profile={profile} />}
        {tab === 'payments' && <PaymentsTab orders={orders} />}
      </main>
    </div>
  );
}

function Overview({ stats, orders, loading, onViewOrder, navigate }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Overview</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your activity at a glance.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 32 }}>
        {[['Total Orders', stats.total, 'var(--gold)'],['Active', stats.active, 'var(--blue)'],['Completed', stats.complete, 'var(--green)'],['Spent', `₦${stats.spent.toLocaleString()}`, 'var(--gold)']].map(([l,v,c]) => (
          <Card key={l} hover={false}><div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{l}</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: c, fontWeight: 600 }}>{v}</div></Card>
        ))}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Recent Orders</h3>
      {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : orders.length === 0 ? (
        <EmptyState title="No orders yet" desc="Browse topics or submit a custom request to get started." action={<button onClick={() => navigate('/topics')} style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '9px 20px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Browse Topics</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.slice(0,4).map(o => (
            <Card key={o.id} onClick={() => onViewOrder(o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '16px 20px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{o.topicTitle}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{o.createdAt?.toDate?.()?.toLocaleDateString() || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><StatusBadge status={o.status} /><ChevronRight size={13} color="var(--text-muted)" /></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders, loading, user, profile, initial }) {
  const [detail, setDetail] = useState(initial || null);
  useEffect(() => { if (initial) setDetail(initial); }, [initial]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner size={36} /></div>;
  if (detail) return <OrderDetail order={detail} onBack={() => setDetail(null)} user={user} profile={profile} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>My Orders</h2>
        <Link to="/request" style={{ background: 'var(--gold)', color: 'var(--dark)', padding: '8px 16px', borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={12} /> New</Link>
      </div>
      {orders.length === 0 ? <EmptyState title="No orders yet" desc="Place your first order." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <Card key={o.id} onClick={() => setDetail(o)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{o.topicTitle}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                  {o.pages && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.pages} pages</span>}
                  {o.totalAmount && <span style={{ color: 'var(--gold)', fontSize: 12 }}>₦{Number(o.totalAmount).toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><StatusBadge status={o.status} /><ChevronRight size={13} color="var(--text-muted)" /></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order: init, onBack, user, profile }) {
  const [order, setOrder] = useState(init);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const unsub = subscribeToOrder(init.id, setOrder);
    return unsub;
  }, [init.id]);

  const pay = async (type) => {
    setPaying(true);
    try {
      const amount = type === 'advance' ? order.advanceAmount : order.finalAmount;
      await initiatePayment({
        email: user.email, amount, orderId: order.id, type,
        onSuccess: async (res) => {
          const updates = type === 'advance'
            ? { status: 'advance_paid', paymentStatus: 'advance_paid', advanceRef: res.reference }
            : { status: 'final_paid', paymentStatus: 'final_paid', finalRef: res.reference };
          await updateOrder(order.id, updates);
          toast.success(type === 'advance' ? 'Advance paid! Your project is now active.' : '🎉 Download is now unlocked!');
        },
        onClose: () => toast('Payment cancelled.'),
      });
    } finally { setPaying(false); }
  };

  const canDownload = order.status === 'final_paid' && order.finalFileUrl;
  const canPreview  = ['preview_ready','final_paid'].includes(order.status) && order.draftFileUrl;

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>← Back to Orders</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card hover={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{order.topicTitle}</div>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              {[['Ordered', order.createdAt?.toDate?.()?.toLocaleDateString() || '—'],['Pages', order.pages || '—'],['Category', order.category || '—'],['Deadline', order.deadline || 'Flexible']].map(([k,v]) => (
                <div key={k}><div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 13 }}>{v}</div></div>
              ))}
            </div>
            {order.details && <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}><div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 5 }}>Details</div><p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.details}</p></div>}
          </Card>

          {order.status === 'quoted' && (
            <Card hover={false} style={{ border: '1px solid var(--border-gold)', background: 'rgba(201,168,76,0.04)' }}>
              <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={13} /> Price Quote from Admin</div>
              {order.quoteNote && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>{order.quoteNote}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['Advance 50%', order.advanceAmount],['Final 50%', order.finalAmount],['Total', order.totalAmount]].map(([l,v]) => (
                  <div key={l} style={{ background: 'var(--dark-elevated)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>{l}</div>
                    <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>₦{Number(v || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <Btn onClick={() => pay('advance')} loading={paying} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                <CreditCard size={14} /> Accept & Pay ₦{Number(order.advanceAmount || 0).toLocaleString()} Advance
              </Btn>
            </Card>
          )}

          {['preview_ready','final_paid'].includes(order.status) && (
            <Card hover={false} style={{ border: `1px solid ${canDownload ? 'rgba(46,204,113,0.5)' : 'var(--border)'}` }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>
                {canDownload ? '✅ Document Ready' : '📄 Preview Available'}
              </div>
              {canPreview && (
                <a href={order.draftFileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, textDecoration: 'none', padding: '9px 12px', background: 'var(--dark-elevated)', borderRadius: 'var(--radius)' }}>
                  <Eye size={13} /> View Draft Preview (watermarked)
                </a>
              )}
              {!canDownload && order.status === 'preview_ready' && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>Pay the final balance to unlock your clean full document.</p>
                  <Btn onClick={() => pay('final')} loading={paying} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                    <Lock size={13} /> Pay Final ₦{Number(order.finalAmount || 0).toLocaleString()} & Unlock
                  </Btn>
                </div>
              )}
              {canDownload && (
                <a href={order.finalFileUrl} download target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                  <Download size={14} /> Download Full Document
                </a>
              )}
            </Card>
          )}
        </div>

        <MessagePanel orderId={order.id} user={user} profile={profile} />
      </div>
    </div>
  );
}

function MessagePanel({ orderId, user, profile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { const unsub = subscribeToMessages(orderId, setMessages); return unsub; }, [orderId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ orderId, senderId: user.uid, senderName: profile?.name || user.displayName, senderRole: 'client', text: text.trim() });
      setText('');
    } finally { setSending(false); }
  };

  return (
    <Card hover={false} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Messages</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', margin: 'auto', padding: 20 }}>No messages yet. Ask a question!</p>}
        {messages.map(m => {
          const isMe = m.senderId === user.uid;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: isMe ? 'rgba(201,168,76,0.12)' : 'var(--dark-elevated)', border: `1px solid ${isMe ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 10, padding: '7px 10px', maxWidth: '88%' }}>
                <div style={{ fontSize: 10, color: isMe ? 'var(--gold)' : '#4A90D9', marginBottom: 2, fontWeight: 600 }}>{isMe ? 'You' : m.senderName}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 7 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message…" style={{ flex: 1, background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 11px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={handleSend} disabled={sending || !text.trim()} style={{ background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius)', width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={13} color="var(--dark)" /></button>
      </div>
    </Card>
  );
}

function MessagesTab({ orders, user, profile }) {
  const [sel, setSel] = useState(orders[0] || null);
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 22 }}>Messages</h2>
      {orders.length === 0 ? <EmptyState title="No conversations" desc="Messages appear here once you have an active order." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {orders.map(o => (
              <button key={o.id} onClick={() => setSel(o)} style={{ background: sel?.id === o.id ? 'var(--gold-glow)' : 'var(--dark-card)', border: `1px solid ${sel?.id === o.id ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'var(--transition)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{o.topicTitle}</div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>
          {sel && <MessagePanel orderId={sel.id} user={user} profile={profile} />}
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ orders }) {
  const paid = orders.filter(o => o.paymentStatus !== 'unpaid');
  const totalSpent = paid.reduce((s, o) => s + (o.advanceAmount || 0) + (o.status === 'final_paid' ? (o.finalAmount || 0) : 0), 0);
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Payment History</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Total spent: <span style={{ color: 'var(--gold)' }}>₦{totalSpent.toLocaleString()}</span></p>
      {paid.length === 0 ? <EmptyState title="No payments yet" desc="Your payment history will appear here." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paid.map(o => (
            <Card key={o.id} hover={false} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{o.topicTitle}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--green)', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 10, padding: '2px 8px' }}>Advance ₦{Number(o.advanceAmount || 0).toLocaleString()} ✓</span>
                  {o.status === 'final_paid' && <span style={{ fontSize: 11, color: 'var(--green)', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 10, padding: '2px 8px' }}>Final ₦{Number(o.finalAmount || 0).toLocaleString()} ✓</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>₦{Number(o.totalAmount || 0).toLocaleString()}</div>
                <StatusBadge status={o.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
