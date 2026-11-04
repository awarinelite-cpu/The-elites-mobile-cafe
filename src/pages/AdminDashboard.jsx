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

  const activeTopics = topics.filter(x => x.badge !== 'Hidden').length;
  // Revenue growth: last 30 days vs the 30 days before (null when not computable)
  const dayMs = 86400000, now = Date.now();
  const sumBetween = (from, to) => paymentSplits.reduce((sum, p) => {
    const ts = p.createdAt?.toDate?.()?.getTime?.();
    return ts && ts >= from && ts < to ? sum + (p.totalAmount || 0) : sum;
  }, 0);
  const curRev = sumBetween(now - 30 * dayMs, now + dayMs), prevRev = sumBetween(now - 60 * dayMs, now - 30 * dayMs);
  const growth = prevRev > 0 ? Math.round(((curRev - prevRev) / prevRev) * 100) : null;

  // Recent activity — last 5 requests
  const recent = [...requests].slice(0, 5);

  // Status breakdown for bar chart
  const statusCounts = {};
  requests.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div>
      <style>{`
        .db-live { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#fff; border:1px solid var(--border); border-radius:20px; padding:12px 14px 12px 18px; box-shadow:0 4px 14px rgba(6,52,44,.07); margin-bottom:18px; }
        .db-live .dot { width:16px; height:16px; border-radius:50%; background:#0F8A5F; box-shadow:0 0 0 4px rgba(15,138,95,.18); flex:0 0 auto; }
        .db-live b { display:block; font-size:1rem; color:#06342C; }
        .db-live small { color:var(--text-secondary); font-size:.82rem; }
        .db-date { display:flex; align-items:center; gap:8px; padding:9px 14px; border-radius:14px; background:#EEF3F2; border:1px solid var(--border); font-weight:600; font-size:.88rem; color:#06342C; white-space:nowrap; }
        .db-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
        @media (min-width:900px) { .db-grid { grid-template-columns:repeat(3,1fr); } }
        .db-k { position:relative; overflow:hidden; text-align:left; cursor:pointer; border-radius:22px; padding:16px 14px 16px 14px; min-height:150px; border:1px solid rgba(255,255,255,.7); box-shadow:0 8px 20px rgba(6,52,44,.1); display:flex; gap:10px; font-family:var(--font-body); transition:transform .15s; }
        .db-k:hover { transform:translateY(-2px); }
        .db-k .ic { flex:0 0 auto; font-size:2.6rem; line-height:1; width:56px; display:flex; align-items:flex-start; justify-content:center; padding-top:22px; }
        .db-k .body { position:relative; z-index:1; min-width:0; flex:1; padding-top:2px; }
        .db-k .lbl { font-size:.9rem; font-weight:500; color:#1F2937; padding-right:24px; line-height:1.2; }
        .db-k .val { font-family:var(--font-display); font-size:1.75rem; font-weight:800; line-height:1.15; margin:4px 0 8px; }
        .db-k .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-size:.78rem; font-weight:700; background:rgba(255,255,255,.65); }
        .db-k .go { position:absolute; top:10px; right:10px; width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.75); display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:800; z-index:2; }
        .db-k .wave { position:absolute; left:0; right:0; bottom:0; height:46%; opacity:.45; pointer-events:none; }
        .db-more { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .db-more button { flex:1 1 90px; background:#fff; border:1px solid var(--border); border-radius:16px; padding:10px 12px; text-align:left; cursor:pointer; font-family:var(--font-body); }
        .db-more b { display:block; font-family:var(--font-display); font-size:1.2rem; color:#06342C; }
        .db-more small { font-size:.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.4px; }
        .db-foot { display:flex; align-items:center; gap:14px; margin-top:22px; padding:14px 16px; border-radius:24px; color:#fff; background:linear-gradient(120deg,#06342C,#0F5C4D); box-shadow:0 8px 20px rgba(6,52,44,.2); flex-wrap:wrap; }
        .db-foot .tro { font-size:2.4rem; }
        .db-foot .tx { flex:1 1 160px; border-left:1.5px solid rgba(245,184,46,.7); padding-left:14px; }
        .db-foot .tx i { font-family:var(--font-display); font-size:1.05rem; font-weight:700; }
        .db-foot .tx i em { color:#F5B82E; }
        .db-foot .tx small { display:block; font-size:.82rem; opacity:.9; margin-top:2px; }
        .db-foot button { border:none; cursor:pointer; padding:11px 18px; border-radius:999px; background:linear-gradient(135deg,#FFC93C,#E9A60F); color:#06342C; font-weight:800; font-size:.88rem; font-family:var(--font-body); }
      `}</style>

      <div className="db-live">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="dot" />
          <div><b>Live Overview</b><small>Elite Mobile Cafe Operations</small></div>
        </div>
        <div className="db-date">📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <span style={{ fontSize: 11 }}>⌄</span></div>
      </div>

      <div className="db-grid">
        {[
          { label: 'Total Revenue',      value: `₦${totalRevenue.toLocaleString()}`,   color: '#15803D', bg: 'linear-gradient(135deg,#D9F5E6,#A7E6C8)', icon: '💰', nav: 'payments',
            chip: growth !== null ? `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}%` : 'All time', chipColor: '#15803D', wave: '#34D399' },
          { label: 'Pending Payouts',    value: `₦${pendingPayouts.toLocaleString()}`, color: '#B45309', bg: 'linear-gradient(135deg,#FFF1D6,#FFD98F)', icon: '⏳', nav: 'payments',
            chip: pendingPayouts === 0 ? 'All Clear! ✔' : 'Needs payout', chipColor: '#B45309', wave: '#FBBF24' },
          { label: 'Pending Requests',   value: pendingReqs,                            color: '#DC2626', bg: 'linear-gradient(135deg,#E3F0FF,#C7DCFB)', icon: '📋', nav: 'requests',
            chip: pendingReqs === 0 ? '✔ No Pending Requests' : 'Needs attention', chipColor: '#1E3A8A', wave: '#60A5FA' },
          { label: 'In Progress',        value: inProgress,                             color: '#6D28D9', bg: 'linear-gradient(135deg,#EFE7FF,#D3C2FA)', icon: '⚙️', nav: 'requests',
            chip: '✔ On Track', chipColor: '#6D28D9', wave: '#A78BFA' },
          { label: 'Completed Projects', value: completed,                              color: '#0F766E', bg: 'linear-gradient(135deg,#DDF7EF,#B3EBDB)', icon: '✅', nav: 'requests',
            chip: 'View Details →', chipColor: '#0F766E', wave: '#34D399' },
          { label: 'Active Topics',      value: activeTopics,                           color: '#1D4ED8', bg: 'linear-gradient(135deg,#E4EEFF,#BFD6FA)', icon: '🎓', nav: 'topics',
            chip: 'Browse Topics →', chipColor: '#1D4ED8', wave: '#60A5FA' },
        ].map(k => (
          <button key={k.label} className="db-k" style={{ background: k.bg }} onClick={() => onNav(k.nav)}>
            <svg className="wave" viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 40 C40 10 80 60 120 30 S180 20 200 10 V60 H0 Z" fill={k.wave} /></svg>
            <span className="go" style={{ color: k.color }}>›</span>
            <span className="ic">{k.icon}</span>
            <span className="body">
              <span className="lbl" style={{ display: 'block' }}>{k.label}</span>
              <span className="val" style={{ display: 'block', color: k.color }}>{k.value}</span>
              <span className="chip" style={{ color: k.chipColor }}>{k.chip}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="db-more">
        {[
          { l: 'Total Clients', v: totalClients, nav: 'users' },
          { l: 'Writers', v: totalWriters, nav: 'users' },
          { l: 'Payout Requests', v: pendingWithdraw, nav: 'withdrawals' },
        ].map(x => (
          <button key={x.l} onClick={() => onNav(x.nav)}><b>{x.v}</b><small>{x.l}</small></button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, marginBottom: 24 }}>

        {/* Status breakdown */}
        <div style={{ ...s.card, marginBottom: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>📊 Requests by Status</div>
          {Object.entries(statusCounts).sort((a,b) => b[1]-a[1]).map(([status, count]) => {
            const cfg = { pending: '#D97706', reviewing: '#2563EB', accepted: '#16836D', in_progress: '#7C3AED', completed: '#16A34A', rejected: '#EF4444', priced: '#C9A84C' };
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
              { label: '📚 Add Research Topic',    nav: 'topics',      color: '#16836D' },
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
            const sc = { pending: '#D97706', reviewing: '#2563EB', accepted: '#16836D', in_progress: '#7C3AED', completed: '#16A34A', rejected: '#EF4444' };
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

      <div className="db-foot">
        <span className="tro">🏆</span>
        <div className="tx"><i>Excellence in <em>Academic Support</em></i><small>Together, we make research easier.</small></div>
        <button onClick={() => onNav('messages')}>Visit Help Center →</button>
      </div>
    </div>
  );
}
