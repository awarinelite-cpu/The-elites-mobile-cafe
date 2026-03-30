// src/pages/AdminDashboard.jsx
export default function AdminDashboard({ requests, topics, users, paymentSplits, withdrawalRequests, s, onNav }) {
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
              { label: '📋 View Pending Requests', nav: 'requests',    color: '#EF4444', badge: pendingReqs > 0 ? pendingReqs : null },
              { label: '💸 Process Withdrawals',   nav: 'withdrawals', color: '#D97706', badge: pendingWithdraw > 0 ? pendingWithdraw : null },
              { label: '📚 Add Research Topic',    nav: 'topics',      color: '#0D9488' },
              { label: '💬 Message a User',         nav: 'messages',   color: '#7C3AED' },
              { label: '👥 Manage Users',           nav: 'users',      color: '#2563EB' },
              { label: '💰 Review Payments',        nav: 'payments',   color: '#16A34A' },
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
