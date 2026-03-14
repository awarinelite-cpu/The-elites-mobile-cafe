// src/pages/WriterPage.jsx
import { useState, useEffect } from 'react';
import AIResearchWriterPage from './AIResearchWriterPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection, doc, getDoc, updateDoc, addDoc, onSnapshot,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const NAV = [
  { id: 'overview',  label: '🏠 Overview'    },
  { id: 'projects',  label: '📋 My Projects' },
  { id: 'ai_writer', label: '🤖 AI Writer'   },
  { id: 'earnings',  label: '💰 Earnings'    },
  { id: 'referral',  label: '🔗 Referral'    },
  { id: 'settings',  label: '⚙️ Settings'    },
];

const STATUS_COLORS = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
};

export default function WriterPage() {
  const { user, profile } = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]         = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTabChange = (id) => {
    setTab(id);
    setSidebarOpen(false);
  };
  const [projects, setProjects]         = useState([]);
  const [earnings, setEarnings]         = useState([]);
  const [writerProfile, setWriterProfile] = useState(null);
  const [allWriters, setAllWriters]     = useState([]);

  useEffect(() => {
    if (profile && !profile.isWriter && profile.role !== 'writer') {
      navigate(profile.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  // Load assigned projects
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'serviceRequests'),
      where('assignedWriterId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Load earnings
  useEffect(() => {
    if (!user) return;
    // earnings where this writer is the referrer OR the actual writer
    const q = query(
      collection(db, 'paymentSplits'),
      where('writerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => setEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Load writer profile
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setWriterProfile(snap.data());
    });
  }, [user]);

  // Load all other writers for push-to-writer feature
  useEffect(() => {
    const q = query(collection(db, 'users'), where('isWriter', '==', true));
    return onSnapshot(q, snap => {
      setAllWriters(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(w => w.uid !== user?.uid));
    });
  }, [user]);

  const referralLink = user ? `${window.location.origin}/register?ref=${user.uid}` : '';

  const totalEarned = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + (e.writerAmount || 0), 0);
  const pendingPay  = earnings.filter(e => e.status !== 'paid').reduce((s, e) => s + (e.writerAmount || 0), 0);
  const activeCount = projects.filter(p => ['accepted','in_progress'].includes(p.status)).length;
  const doneCount   = projects.filter(p => p.status === 'completed').length;
  const referredClients = projects.filter(p => p.referredBy === user?.uid).length;

  const s = {
    card:  { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20 },
    btn:   (bg, col='#fff') => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }),
    input: { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
    lbl:   { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 768px) {
          .writer-sidebar {
            position: fixed !important;
            top: 64px !important; left: 0 !important;
            height: calc(100vh - 64px) !important;
            z-index: 100 !important;
            transform: translateX(0);
            transition: transform 0.3s ease !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.2);
          }
          .writer-sidebar.closed { transform: translateX(-110%) !important; }
          .writer-main { padding: 16px !important; }
          .writer-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .writer-sidebar { position: sticky !important; transform: none !important; }
          .writer-menu-btn { display: none !important; }
        }
        .writer-menu-btn { display: none; }
      `}</style>

      {/* Sidebar */}
      <aside className={`writer-sidebar${sidebarOpen ? '' : ' closed'}`} style={{ width: 210, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 18px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Writer Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name?.split(' ')[0] || 'Writer'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 6, display: 'inline-block', background: 'rgba(139,92,246,0.15)', color: '#7C3AED', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>✍️ Writer</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => handleTabChange(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: active ? 'rgba(139,92,246,0.12)' : 'transparent', border: `1px solid ${active ? '#7C3AED' : 'transparent'}`, color: active ? '#7C3AED' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>
                {n.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="writer-main" style={{ flex: 1, padding: 'clamp(20px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="writer-menu-btn" onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span className="writer-menu-btn" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', alignItems: 'center' }}>
            {NAV.find(n => n.id === tab)?.label || ''}
          </span>
        </div>
        {tab === 'overview'  && <Overview stats={{ totalEarned, pendingPay, activeCount, doneCount, referredClients }} projects={projects} s={s} />}
        {tab === 'projects'  && <ProjectsTab projects={projects} user={user} allWriters={allWriters} s={s} />}
        {tab === 'earnings'  && <EarningsTab earnings={earnings} stats={{ totalEarned, pendingPay }} s={s} />}
        {tab === 'referral'  && <ReferralTab referralLink={referralLink} user={user} projects={projects} s={s} />}
        {tab === 'ai_writer' && <AIResearchWriterPage />}
        {tab === 'settings'  && <SettingsTab user={user} writerProfile={writerProfile} setWriterProfile={setWriterProfile} s={s} />}
      </main>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="writer-menu-btn" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,0.4)', zIndex: 99, display: 'block' }} />
      )}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────
function Overview({ stats, projects, s }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Overview</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your writer activity at a glance.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 36 }}>
        {[
          ['Total Earned',    `₦${stats.totalEarned.toLocaleString()}`, '#16A34A'],
          ['Pending Pay',     `₦${stats.pendingPay.toLocaleString()}`,  '#D97706'],
          ['Active Projects',  stats.activeCount,                        '#7C3AED'],
          ['Completed',        stats.doneCount,                          'var(--teal)'],
          ['Referred Clients', stats.referredClients,                    'var(--gold)'],
        ].map(([label, val, color]) => (
          <div key={label} style={s.card}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Active Projects</h3>
      {projects.filter(p => ['accepted','in_progress'].includes(p.status)).length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No active projects yet. Admin will assign work to you.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.filter(p => ['accepted','in_progress'].includes(p.status)).map(p => (
            <ProjectCard key={p.id} project={p} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Projects Tab ──────────────────────────────────────────────
function ProjectsTab({ projects, user, allWriters, s }) {
  const [pushing, setPushing] = useState(null); // projectId being pushed

  const pushToWriter = async (project, targetWriterId) => {
    if (!targetWriterId) return;
    try {
      await updateDoc(doc(db, 'serviceRequests', project.id), {
        assignedWriterId: targetWriterId,
        pushedBy:         user.uid,
        pushedAt:         serverTimestamp(),
      });
      // Update payment split to reflect referrer vs writer
      await addDoc(collection(db, 'notifications'), {
        userId:    targetWriterId,
        title:     '📋 New project assigned to you',
        body:      `You've been assigned: ${project.serviceTitle}`,
        type:      'assignment',
        read:      false,
        createdAt: serverTimestamp(),
      });
      setPushing(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>My Projects</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        You can push a project to another writer if you're busy. You'll earn <strong style={{ color: 'var(--gold)' }}>10%</strong> as referrer; the writer earns <strong style={{ color: '#16A34A' }}>75%</strong>.
      </p>
      {projects.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No projects assigned yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} style={s.card}>
              <ProjectCard project={p} s={s} />
              {/* Push to another writer */}
              {['pending','accepted','in_progress'].includes(p.status) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {pushing === p.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select defaultValue=""
                        onChange={e => { if (e.target.value) pushToWriter(p, e.target.value); }}
                        style={{ ...s.input, marginBottom: 0, flex: 1, fontSize: 13 }}>
                        <option value="">— Select a writer —</option>
                        {allWriters.map(w => (
                          <option key={w.id} value={w.uid || w.id}>{w.name || w.email}</option>
                        ))}
                      </select>
                      <button onClick={() => setPushing(null)} style={{ ...s.btn('#94A3B8'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setPushing(p.id)} style={{ ...s.btn('var(--bg-secondary)', 'var(--text-secondary)'), border: '1px solid var(--border)', fontSize: 12, padding: '7px 14px' }}>
                      📤 Push to another writer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p, s }) {
  const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#333' };
  const isPushed = p.pushedBy && p.pushedBy !== p.assignedWriterId;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{p.serviceTitle || p.serviceKey}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</div>
          {p.referredBy && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>🔗 Your referred client</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>
            {p.status?.replace('_', ' ')}
          </span>
          {p.agreedPrice && (
            <span style={{ color: '#16A34A', fontWeight: 700, fontSize: 14 }}>
              ₦{Math.round(Number(p.agreedPrice) * (isPushed ? 0.10 : 0.85)).toLocaleString()}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}> {isPushed ? '(referral 10%)' : '(your 85%)'}</span>
            </span>
          )}
        </div>
      </div>
      {p.adminNote && (
        <div style={{ marginTop: 10, background: 'var(--teal-glow)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--teal)' }}>
          💬 <strong>Admin note:</strong> {p.adminNote}
        </div>
      )}
    </div>
  );
}

// ── Referral Tab ──────────────────────────────────────────────
function ReferralTab({ referralLink, user, projects, s }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const referredProjects = projects.filter(p => p.referredBy === user?.uid);

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Your Referral Link</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
        Share this link with your clients. Any registration through your link ties that client to you.
      </p>

      {/* Link box */}
      <div style={{ ...s.card, marginBottom: 20, border: '1px solid rgba(201,168,76,0.3)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your unique referral link</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {referralLink}
          </div>
          <button onClick={copy} style={{ ...s.btn(copied ? '#16A34A' : 'var(--gold)', '#000'), flexShrink: 0, padding: '10px 16px' }}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Commission breakdown */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>💰 How your commissions work</div>
        {[
          { scenario: 'You refer + you write the project', you: '85%', other: '—',   admin: '10%', maint: '5%', highlight: true },
          { scenario: 'You refer + push to another writer', you: '10%', other: '75%', admin: '10%', maint: '5%', highlight: false },
        ].map((r, i) => (
          <div key={i} style={{ background: r.highlight ? 'rgba(22,163,74,0.07)' : 'var(--bg-tertiary)', border: `1px solid ${r.highlight ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{r.scenario}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['You', r.you, '#16A34A'], ['Other writer', r.other, '#7C3AED'], ['Admin', r.admin, 'var(--teal)'], ['Maintenance', r.maint, 'var(--text-muted)']].map(([label, val, color]) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 70 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Referred clients */}
      <div style={{ ...s.card }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>👥 Clients from your link ({referredProjects.length})</div>
        {referredProjects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No clients have registered through your link yet. Share it!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {referredProjects.map(p => {
              const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#333' };
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.serviceTitle || p.serviceKey}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.name}</div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>{p.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Earnings Tab ──────────────────────────────────────────────
function EarningsTab({ earnings, stats, s }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Earnings</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Total earned: <span style={{ color: '#16A34A', fontWeight: 700 }}>₦{stats.totalEarned.toLocaleString()}</span>
        {'  '}·{'  '}
        Pending: <span style={{ color: '#D97706', fontWeight: 700 }}>₦{stats.pendingPay.toLocaleString()}</span>
      </p>
      {earnings.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💰</div>
          <p style={{ color: 'var(--text-muted)' }}>No earnings yet. Complete projects to get paid.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {earnings.map(e => (
            <div key={e.id} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {e.splitType === 'referral_only' ? '🔗 Referral commission' : '✍️ Project payment'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total project: ₦{e.totalAmount?.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.createdAt?.toDate?.()?.toLocaleDateString() || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#16A34A' }}>₦{e.writerAmount?.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {e.splitType === 'referral_only' ? '10% referral' : e.splitType === 'pushed_writer' ? '75% (wrote it)' : '85% (referred + wrote)'}
                </div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  background: e.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                  color: e.status === 'paid' ? '#16A34A' : '#D97706',
                }}>{e.status === 'paid' ? 'Paid' : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────────
function SettingsTab({ user, writerProfile, setWriterProfile, s }) {
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (writerProfile) setForm({ ...writerProfile });
  }, [writerProfile]);

  const save = async () => {
    if (!user || !form) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name:        form.name        || '',
        phone:       form.phone       || '',
        bio:         form.bio         || '',
        bankName:    form.bankName    || '',
        bankAccount: form.bankAccount || '',
        accountName: form.accountName || '',
        specialties: form.specialties || '',
        updatedAt:   serverTimestamp(),
      });
      setWriterProfile(f => ({ ...f, ...form }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!form) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Profile & Settings</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your information, specialties and payment details.</p>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>👤 Personal Info</h3>
        {[
          { key: 'name',  label: 'Full Name',    placeholder: 'Your full name' },
          { key: 'phone', label: 'Phone Number', placeholder: '+234 ...' },
        ].map(f => (
          <div key={f.key}>
            <label style={s.lbl}>{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} style={s.input} />
          </div>
        ))}
        <label style={s.lbl}>Bio / About You</label>
        <textarea rows={3} value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell clients and admin about yourself..."
          style={{ ...s.input, resize: 'vertical' }} />
        <label style={s.lbl}>Specialties</label>
        <input value={form.specialties || ''} onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))}
          placeholder="e.g. Nursing, Public Health, Mental Health" style={s.input} />
      </div>

      <div style={{ ...s.card, marginBottom: 20, border: '1px solid rgba(22,163,74,0.3)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>🏦 Payment Details</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Your earnings will be deposited here automatically via Paystack.
        </p>
        {[
          { key: 'bankName',    label: 'Bank Name',      placeholder: 'e.g. GTBank, Access, Zenith' },
          { key: 'accountName', label: 'Account Name',   placeholder: 'Name on your bank account' },
          { key: 'bankAccount', label: 'Account Number', placeholder: '10-digit account number' },
        ].map(f => (
          <div key={f.key}>
            <label style={s.lbl}>{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} style={s.input} />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} style={{ ...s.btn('#16A34A'), padding: '12px 28px', fontSize: 14, width: '100%' }}>
        {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Settings'}
      </button>
    </div>
  );
}