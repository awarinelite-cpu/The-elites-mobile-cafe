// src/pages/AdminPage.jsx
import { useState, useEffect, useRef } from 'react';
import { BarChart2, FileText, MessageSquare, BookOpen, Users, Upload, Send, ChevronRight, CheckCircle, X, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToAllOrders, sendQuote, updateOrder, subscribeToMessages, sendMessage, createTopic, subscribeToTopics, updateTopic } from '../firebase/orderService';
import { uploadDraft, uploadFinal } from '../firebase/storageService';
import { StatusBadge, EmptyState, Spinner, Card, Btn, Field, inputStyle, textareaStyle, Modal } from '../components/shared/UI';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const NAV = [
  { id: 'overview', icon: BarChart2,    label: 'Overview' },
  { id: 'orders',   icon: FileText,     label: 'All Orders' },
  { id: 'messages', icon: MessageSquare,label: 'Messages' },
  { id: 'topics',   icon: BookOpen,     label: 'Manage Topics' },
];

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllOrders(data => { setOrders(data); setLoading(false); });
    return unsub;
  }, []);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    active: orders.filter(o => ['advance_paid','in_progress','preview_ready'].includes(o.status)).length,
    complete: orders.filter(o => o.status === 'final_paid').length,
    revenue: orders.filter(o => o.paymentStatus !== 'unpaid').reduce((s, o) => s + (o.advanceAmount || 0) + (o.status === 'final_paid' ? (o.finalAmount || 0) : 0), 0),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', paddingTop: 70 }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--dark-card)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 70, height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Admin Panel</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{profile?.name?.split(' ')[0]}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Site Owner</div>
        </div>
        <nav style={{ padding: '14px 10px', flex: 1 }}>
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 'var(--radius)', background: active ? 'var(--gold-glow)' : 'transparent', border: `1px solid ${active ? 'var(--border-gold)' : 'transparent'}`, color: active ? 'var(--gold)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'var(--transition)' }}>
                <Icon size={14} /> {n.label}
                {n.id === 'orders' && stats.pending > 0 && <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{stats.pending}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '28px clamp(14px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        {tab === 'overview' && <AdminOverview stats={stats} orders={orders} loading={loading} onGoto={setTab} />}
        {tab === 'orders'   && <AdminOrders orders={orders} loading={loading} user={user} profile={profile} />}
        {tab === 'messages' && <AdminMessages orders={orders} user={user} profile={profile} />}
        {tab === 'topics'   && <AdminTopics />}
      </main>
    </div>
  );
}

// ── OVERVIEW ─────────────────────────────────────────────
function AdminOverview({ stats, orders, loading, onGoto }) {
  const actionable = orders.filter(o => ['pending','quoted','advance_paid','in_progress','preview_ready'].includes(o.status));
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Dashboard</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Platform overview and pending actions.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 32 }}>
        {[['Total Orders', stats.total, 'var(--gold)'],['Needs Attention', stats.pending, 'var(--red)'],['Active Jobs', stats.active, 'var(--blue)'],['Completed', stats.complete, 'var(--green)'],['Revenue', `₦${stats.revenue.toLocaleString()}`, 'var(--gold)']].map(([l,v,c]) => (
          <Card key={l} hover={false}><div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{l}</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: c, fontWeight: 600 }}>{v}</div></Card>
        ))}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Needs Action</h3>
      {loading ? <Spinner /> : actionable.length === 0 ? (
        <Card hover={false} style={{ textAlign: 'center', padding: '32px', color: 'var(--green)' }}>
          <CheckCircle size={28} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>All caught up!</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actionable.slice(0,6).map(o => (
            <Card key={o.id} onClick={() => onGoto('orders')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.topicTitle}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{o.clientName} • {o.createdAt?.toDate?.()?.toLocaleDateString()}</div>
              </div>
              <StatusBadge status={o.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ALL ORDERS ────────────────────────────────────────────
function AdminOrders({ orders, loading, user, profile }) {
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');

  const FILTERS = ['all','pending','quoted','advance_paid','in_progress','preview_ready','final_paid'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (detail) return <AdminOrderDetail order={detail} onBack={() => setDetail(null)} user={user} profile={profile} />;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 20 }}>All Orders</h2>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20, overflowX: 'auto' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'var(--gold)' : 'var(--dark-card)', color: filter === f ? 'var(--dark)' : 'var(--text-secondary)', border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 20, padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')} {f !== 'all' && `(${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 60, textAlign: 'center' }}><Spinner size={36} /></div> :
       filtered.length === 0 ? <EmptyState title="No orders" desc={`No orders with status "${filter}"`} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {filtered.map(o => (
            <Card key={o.id} onClick={() => setDetail(o)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: '14px 18px' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{o.topicTitle}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.clientName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                  {o.totalAmount && <span style={{ color: 'var(--gold)', fontSize: 11 }}>₦{Number(o.totalAmount).toLocaleString()}</span>}
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

// ── ADMIN ORDER DETAIL ────────────────────────────────────
function AdminOrderDetail({ order: init, onBack, user, profile }) {
  const [order, setOrder] = useState(init);
  const [quoteModal, setQuoteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const draftRef = useRef(null);
  const finalRef = useRef(null);

  useEffect(() => {
    const unsubPromise = import('../firebase/orderService').then(m => m.subscribeToOrder(init.id, setOrder));
    return () => { unsubPromise.then(unsub => unsub()); };
  }, [init.id]);

  const handleStatusChange = async (newStatus) => {
    await updateOrder(order.id, { status: newStatus });
    toast.success(`Status updated to: ${newStatus.replace('_', ' ')}`);
  };

  const handleUpload = async (type) => {
    const file = type === 'draft' ? draftRef.current?.files?.[0] : finalRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFn = type === 'draft' ? (await import('../firebase/storageService')).uploadDraft : (await import('../firebase/storageService')).uploadFinal;
      const url = await uploadFn(order.id, file, setUploadProgress);
      const field = type === 'draft' ? { draftFileUrl: url, status: 'preview_ready' } : { finalFileUrl: url };
      await updateOrder(order.id, field);
      toast.success(`${type === 'draft' ? 'Draft' : 'Final file'} uploaded successfully!`);
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const NEXT_STATUSES = {
    pending: ['quoted'],
    quoted: ['advance_paid', 'cancelled'],
    advance_paid: ['in_progress'],
    in_progress: ['preview_ready'],
    preview_ready: ['final_paid'],
  };
  const next = NEXT_STATUSES[order.status] || [];

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>← Back to Orders</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Order info */}
          <Card hover={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{order.topicTitle}</div>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              {[['Client', order.clientName],['Email', order.clientEmail],['Pages', order.pages || '—'],['Deadline', order.deadline || 'Flexible'],['Category', order.category || '—'],['Ordered', order.createdAt?.toDate?.()?.toLocaleDateString() || '—']].map(([k,v]) => (
                <div key={k}><div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div></div>
              ))}
            </div>
            {order.details && <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}><div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Client Details</div><p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.details}</p></div>}
          </Card>

          {/* Actions */}
          <Card hover={false}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Admin Actions</div>

            {/* Send Quote */}
            {order.status === 'pending' && (
              <div style={{ marginBottom: 16 }}>
                <Btn onClick={() => setQuoteModal(true)} style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={13} /> Send Price Quote to Client
                </Btn>
              </div>
            )}

            {/* Status updates */}
            {next.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>Update Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {next.map(s => (
                    <Btn key={s} variant="outline" size="sm" onClick={() => handleStatusChange(s)}>
                      Mark as {s.replace(/_/g, ' ')}
                    </Btn>
                  ))}
                </div>
              </div>
            )}

            {/* File uploads */}
            {['advance_paid','in_progress','preview_ready','final_paid'].includes(order.status) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>Upload Draft (Watermarked Preview)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="file" ref={draftRef} accept=".pdf,.doc,.docx" style={{ flex: 1, background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
                    <Btn onClick={() => handleUpload('draft')} loading={uploading} size="sm">
                      <Upload size={12} /> Upload
                    </Btn>
                  </div>
                  {order.draftFileUrl && <a href={order.draftFileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, textDecoration: 'none' }}><Eye size={11} /> Draft uploaded ✓</a>}
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>Upload Final File (Unlocked after payment)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="file" ref={finalRef} accept=".pdf,.doc,.docx" style={{ flex: 1, background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
                    <Btn onClick={() => handleUpload('final')} loading={uploading} size="sm" variant="outline">
                      <Upload size={12} /> Upload
                    </Btn>
                  </div>
                  {order.finalFileUrl && <span style={{ color: 'var(--green)', fontSize: 11, marginTop: 4, display: 'block' }}>Final file uploaded ✓ {order.status !== 'final_paid' ? '(locked until payment)' : '(unlocked ✅)'}</span>}
                  {uploading && <div style={{ marginTop: 6, background: 'var(--dark-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--gold)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} /></div>}
                </div>
              </div>
            )}

            {/* Payment info */}
            {order.totalAmount && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[['Advance', order.advanceAmount, order.paymentStatus !== 'unpaid'],['Final', order.finalAmount, order.status === 'final_paid'],['Total', order.totalAmount, order.status === 'final_paid']].map(([l,v,paid]) => (
                    <div key={l} style={{ background: 'var(--dark-elevated)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>{l} {paid ? '✓' : ''}</div>
                      <div style={{ color: paid ? 'var(--green)' : 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>₦{Number(v || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Messages */}
        <AdminMessagePanel orderId={order.id} user={user} profile={profile} />
      </div>

      {/* Quote Modal */}
      <QuoteModal open={quoteModal} onClose={() => setQuoteModal(false)} order={order} onSent={() => setQuoteModal(false)} />
    </div>
  );
}

// ── QUOTE MODAL ───────────────────────────────────────────
function QuoteModal({ open, onClose, order, onSent }) {
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();
  const advance = watch('advanceAmount', '');
  const final   = watch('finalAmount', '');
  const total   = (Number(advance) || 0) + (Number(final) || 0);

  const onSubmit = async (data) => {
    try {
      await sendQuote({ orderId: order.id, clientId: order.clientId, advanceAmount: Number(data.advanceAmount), finalAmount: Number(data.finalAmount), totalAmount: Number(data.advanceAmount) + Number(data.finalAmount), note: data.note });
      toast.success('Quote sent to client!');
      onSent();
    } catch (e) { toast.error('Failed to send quote'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Send Price Quote">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--dark-elevated)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{order.topicTitle}</strong><br />
          <span style={{ fontSize: 11 }}>Client: {order.clientName} • {order.pages} pages</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Advance Amount (₦) *">
            <input {...register('advanceAmount', { required: true, min: 1 })} type="number" placeholder="e.g. 5000" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Final Amount (₦) *">
            <input {...register('finalAmount', { required: true, min: 1 })} type="number" placeholder="e.g. 5000" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
        </div>
        {total > 0 && <div style={{ background: 'var(--gold-glow)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>Total: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>₦{total.toLocaleString()}</span></div>}
        <Field label="Note to Client (optional)">
          <textarea {...register('note')} placeholder="Any message to accompany the quote…" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose} type="button">Cancel</Btn>
          <Btn type="submit" loading={isSubmitting}><Send size={13} /> Send Quote</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── ADMIN MESSAGE PANEL ───────────────────────────────────
function AdminMessagePanel({ orderId, user, profile }) {
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
      await sendMessage({ orderId, senderId: user.uid, senderName: profile?.name || 'Admin', senderRole: 'admin', text: text.trim() });
      setText('');
    } finally { setSending(false); }
  };

  return (
    <Card hover={false} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Client Messages</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', margin: 'auto', padding: 20 }}>No messages yet.</p>}
        {messages.map(m => {
          const isAdmin = m.senderRole === 'admin';
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: isAdmin ? 'rgba(201,168,76,0.12)' : 'var(--dark-elevated)', border: `1px solid ${isAdmin ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 10, padding: '7px 10px', maxWidth: '88%' }}>
                <div style={{ fontSize: 10, color: isAdmin ? 'var(--gold)' : '#4A90D9', marginBottom: 2, fontWeight: 600 }}>{isAdmin ? 'You (Admin)' : m.senderName}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 7 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Reply to client…" style={{ flex: 1, background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 11px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={handleSend} disabled={sending || !text.trim()} style={{ background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius)', width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={13} color="var(--dark)" /></button>
      </div>
    </Card>
  );
}

// ── ADMIN MESSAGES TAB ────────────────────────────────────
function AdminMessages({ orders, user, profile }) {
  const [sel, setSel] = useState(orders[0] || null);
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 22 }}>All Conversations</h2>
      {orders.length === 0 ? <EmptyState title="No orders yet" desc="Conversations will appear here." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: '70vh', overflowY: 'auto' }}>
            {orders.map(o => (
              <button key={o.id} onClick={() => setSel(o)} style={{ background: sel?.id === o.id ? 'var(--gold-glow)' : 'var(--dark-card)', border: `1px solid ${sel?.id === o.id ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'var(--transition)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{o.topicTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{o.clientName}</div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>
          {sel && <AdminMessagePanel orderId={sel.id} user={user} profile={profile} />}
        </div>
      )}
    </div>
  );
}

// ── MANAGE TOPICS ─────────────────────────────────────────
function AdminTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

  useEffect(() => { const unsub = subscribeToTopics(data => { setTopics(data); setLoading(false); }); return unsub; }, []);

  const onSubmit = async (data) => {
    try {
      await createTopic({ title: data.title, description: data.description, category: data.category, pages: data.pages, price: Number(data.price), available: true });
      toast.success('Topic created!');
      reset();
      setShowForm(false);
    } catch (e) { toast.error('Failed to create topic'); }
  };

  const toggleAvailable = async (id, current) => {
    await updateTopic(id, { available: !current });
    toast.success(`Topic ${!current ? 'enabled' : 'disabled'}`);
  };

  const CATS = ['Technology','Business','Economics','Sociology','Psychology','Environmental Science','Health','Education','Law','Other'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>Manage Topics</h2>
        <Btn onClick={() => setShowForm(!showForm)}>+ Add Topic</Btn>
      </div>

      {showForm && (
        <Card hover={false} style={{ marginBottom: 20, border: '1px solid var(--border-gold)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>New Topic</div>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Title *" error={errors.title?.message}>
              <input {...register('title', { required: true })} placeholder="Research topic title" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Category *">
                <select {...register('category', { required: true })} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Select…</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Pages">
                <input {...register('pages')} placeholder="e.g. 10–15" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
              <Field label="Price (₦) *">
                <input {...register('price', { required: true, min: 1 })} type="number" placeholder="e.g. 10000" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </Field>
            </div>
            <Field label="Description">
              <textarea {...register('description')} placeholder="Brief description of the topic…" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn type="submit" loading={isSubmitting}>Create Topic</Btn>
            </div>
          </form>
        </Card>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={32} /></div> :
       topics.length === 0 ? <EmptyState title="No topics yet" desc="Add your first topic above." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {topics.map(t => (
            <Card key={t.id} hover={false} style={{ opacity: t.available === false ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase' }}>{t.category}</span>
                <button onClick={() => toggleAvailable(t.id, t.available !== false)} style={{ fontSize: 10, background: t.available !== false ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)', color: t.available !== false ? 'var(--green)' : 'var(--red)', border: `1px solid ${t.available !== false ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {t.available !== false ? 'Active' : 'Disabled'}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{t.title}</div>
              {t.description && <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{t.description}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.pages || '—'} pages</span>
                <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>₦{Number(t.price || 0).toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
