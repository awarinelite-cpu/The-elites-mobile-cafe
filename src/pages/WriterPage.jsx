// src/pages/WriterPage.jsx
import { useState, useEffect, useRef } from 'react';
import AIResearchWriterPage from './AIResearchWriterPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection, doc, getDoc, updateDoc, addDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const NAV = [
  { id: 'overview',    label: '🏠 Overview'       },
  { id: 'projects',    label: '📋 My Projects'    },
  { id: 'ai_writer',   label: '🤖 AI Writer'      },
  { id: 'wallet',      label: '💳 Wallet'          },
  { id: 'performance', label: '⭐ Performance'     },
  { id: 'tasks',       label: '✅ Tasks'           },
  { id: 'referral',    label: '🔗 Referral'        },
  { id: 'chat',        label: '💬 Client Chat'     },
  { id: 'profile',     label: '🪪 My Profile'      },
  { id: 'settings',    label: '⚙️ Settings'        },
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
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTabChange = (id) => { setTab(id); setSidebarOpen(false); };

  const [projects, setProjects]           = useState([]);
  const [earnings, setEarnings]           = useState([]);
  const [writerProfile, setWriterProfile] = useState(null);
  const [allWriters, setAllWriters]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadChats, setUnreadChats]     = useState(0);

  useEffect(() => {
    if (profile && !profile.isWriter && profile.role !== 'writer') {
      navigate(profile.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'serviceRequests'), where('assignedWriterId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'paymentSplits'), where('writerId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => { if (snap.exists()) setWriterProfile(snap.data()); });
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isWriter', '==', true));
    return onSnapshot(q, snap => setAllWriters(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(w => w.uid !== user?.uid)));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Unread client chat messages across assigned projects
  useEffect(() => {
    if (!user || !projects.length) return;
    let total = 0;
    const unsubs = projects.filter(p => ['accepted','in_progress','reviewing','completed'].includes(p.status)).map(p => {
      const q = query(collection(db, 'orderChats', p.id, 'messages'), where('senderRole', '==', 'client'), where('readByWriter', '==', false));
      return onSnapshot(q, snap => {
        total = snap.size;
        setUnreadChats(t => t + snap.size); // approximate; reset each cycle
      }, () => {});
    });
    setUnreadChats(0); // reset before re-counting
    return () => unsubs.forEach(u => u());
  }, [user, projects.length]);

  const referralLink   = user ? `${window.location.origin}/register?ref=${user.uid}` : '';
  const totalEarned    = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + (e.writerAmount || 0), 0);
  const pendingPay     = earnings.filter(e => e.status !== 'paid').reduce((s, e) => s + (e.writerAmount || 0), 0);
  const activeCount    = projects.filter(p => ['accepted','in_progress'].includes(p.status)).length;
  const doneCount      = projects.filter(p => p.status === 'completed').length;
  const referredClients = projects.filter(p => p.referredBy === user?.uid).length;
  const unreadNotifs   = notifications.filter(n => !n.read).length;

  const s = {
    card:  { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20 },
    btn:   (bg, col='#fff') => ({ background: bg, color: col, border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }),
    input: { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
    lbl:   { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', paddingTop: 64, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes countup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media (max-width: 768px) {
          .writer-sidebar { position: fixed !important; top: 64px !important; left: 0 !important; height: calc(100vh - 64px) !important; z-index: 100 !important; transform: translateX(0); transition: transform 0.3s ease !important; box-shadow: 4px 0 20px rgba(0,0,0,0.2); }
          .writer-sidebar.closed { transform: translateX(-110%) !important; }
          .writer-main { padding: 16px !important; }
          .writer-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) { .writer-sidebar { position: sticky !important; transform: none !important; } .writer-menu-btn { display: none !important; } }
        .writer-menu-btn { display: none; }
        .nav-btn:hover { background: rgba(139,92,246,0.08) !important; }
      `}</style>

      {/* Sidebar */}
      <aside className={`writer-sidebar${sidebarOpen ? '' : ' closed'}`}
        style={{ width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 0', flexShrink: 0, top: 64, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '0 18px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Writer Portal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name?.split(' ')[0] || 'Writer'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(139,92,246,0.15)', color: '#7C3AED', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>✍️ Writer</span>
            {pendingPay > 0 && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#D97706', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>₦{pendingPay.toLocaleString()} pending</span>}
          </div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(n => {
            const active = tab === n.id;
            const badge = n.id === 'wallet' && pendingPay > 0 ? '₦'
              : n.id === 'tasks' && activeCount > 0 ? activeCount
              : n.id === 'chat' && unreadChats > 0 ? unreadChats
              : null;
            return (
              <button key={n.id} className="nav-btn" onClick={() => handleTabChange(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 8, background: active ? 'rgba(139,92,246,0.12)' : 'transparent', border: `1px solid ${active ? '#7C3AED' : 'transparent'}`, color: active ? '#7C3AED' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', marginBottom: 3, textAlign: 'left', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>
                <span>{n.label}</span>
                {badge && <span style={{ background: active ? '#7C3AED' : 'rgba(139,92,246,0.2)', color: active ? '#fff' : '#7C3AED', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="writer-main" style={{ flex: 1, padding: 'clamp(20px,3vw,36px)', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="writer-menu-btn" onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span className="writer-menu-btn" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', alignItems: 'center' }}>
            {NAV.find(n => n.id === tab)?.label || ''}
          </span>
        </div>

        {tab === 'overview'    && <Overview stats={{ totalEarned, pendingPay, activeCount, doneCount, referredClients }} projects={projects} notifications={notifications} user={user} s={s} onTabChange={handleTabChange} />}
        {tab === 'projects'    && <ProjectsTab projects={projects} user={user} allWriters={allWriters} s={s} />}
        {tab === 'ai_writer'   && <AIResearchWriterPage />}
        {tab === 'wallet'      && <WalletTab earnings={earnings} stats={{ totalEarned, pendingPay }} user={user} writerProfile={writerProfile} s={s} />}
        {tab === 'performance' && <PerformanceTab projects={projects} earnings={earnings} allWriters={allWriters} user={user} s={s} />}
        {tab === 'tasks'       && <TasksTab projects={projects} user={user} s={s} />}
        {tab === 'referral'    && <ReferralTab referralLink={referralLink} user={user} projects={projects} s={s} />}
        {tab === 'chat'        && <ClientChatTab projects={projects} user={user} writerProfile={writerProfile} setUnreadChats={setUnreadChats} s={s} />}
        {tab === 'profile'     && <ProfileTab user={user} writerProfile={writerProfile} projects={projects} earnings={earnings} s={s} />}
        {tab === 'settings'    && <SettingsTab user={user} writerProfile={writerProfile} setWriterProfile={setWriterProfile} s={s} />}
      </main>

      {sidebarOpen && (
        <div className="writer-menu-btn" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,0.4)', zIndex: 99, display: 'block' }} />
      )}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────
function Overview({ stats, projects, notifications, user, s, onTabChange }) {
  const active  = projects.filter(p => ['accepted','in_progress'].includes(p.status));
  const unread  = notifications.filter(n => !n.read);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
        Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} 👋
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Here's your work summary.</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Earned',    value: `₦${stats.totalEarned.toLocaleString()}`, color: '#16A34A', icon: '💰', tab: 'wallet' },
          { label: 'Pending Pay',     value: `₦${stats.pendingPay.toLocaleString()}`,  color: '#D97706', icon: '⏳', tab: 'wallet' },
          { label: 'Active Projects', value: stats.activeCount,                         color: '#7C3AED', icon: '📋', tab: 'projects' },
          { label: 'Completed',       value: stats.doneCount,                           color: '#0D9488', icon: '✅', tab: 'performance' },
        ].map(stat => (
          <button key={stat.label} onClick={() => onTabChange(stat.tab)}
            style={{ ...s.card, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-card)', transition: 'all 0.2s', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: stat.color, animation: 'countup 0.4s ease' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Notifications */}
      {unread.length > 0 && (
        <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#7C3AED', marginBottom: 10 }}>🔔 {unread.length} New Notification{unread.length > 1 ? 's' : ''}</div>
          {unread.slice(0, 3).map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              <span style={{ fontSize: 16 }}>📣</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active projects quick view */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>📋 Active Projects ({active.length})</div>
        {active.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active projects right now. Check My Projects for new assignments.</p>
        ) : (
          active.slice(0, 3).map(p => {
            const deadline = p.deadline ? new Date(p.deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.serviceTitle || p.topicTitle || 'Project'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.name}</div>
                </div>
                {daysLeft !== null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: daysLeft <= 1 ? '#DC2626' : daysLeft <= 3 ? '#D97706' : '#16A34A', background: daysLeft <= 1 ? 'rgba(220,38,38,0.1)' : daysLeft <= 3 ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                    {daysLeft <= 0 ? '🔴 Overdue' : `⏰ ${daysLeft}d left`}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
        {[
          { label: '🤖 AI Writer',    tab: 'ai_writer',   color: '#1E3A8A' },
          { label: '💳 My Wallet',    tab: 'wallet',      color: '#16A34A' },
          { label: '✅ My Tasks',     tab: 'tasks',       color: '#7C3AED' },
          { label: '🔗 Referral',     tab: 'referral',    color: '#D97706' },
        ].map(a => (
          <button key={a.tab} onClick={() => onTabChange(a.tab)}
            style={{ ...s.btn(a.color), padding: '12px', textAlign: 'center', borderRadius: 10, fontSize: 13 }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Projects Tab ──────────────────────────────────────────────
function ProjectsTab({ projects, user, allWriters, s }) {
  const [uploading, setUploading]         = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState({});

  const handleFileUpload = async (projectId, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB.'); return; }
    setUploading(projectId);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await updateDoc(doc(db, 'serviceRequests', projectId), {
          draftFileData: reader.result,
          draftFileName: file.name,
          draftUploadedAt: serverTimestamp(),
          status: 'reviewing',
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          title: '📎 Draft Uploaded',
          body: `Writer uploaded draft for project ${projectId.slice(0,8)}`,
          type: 'project', read: false, createdAt: serverTimestamp(),
        });
        setUploadSuccess(p => ({ ...p, [projectId]: true }));
        setTimeout(() => setUploadSuccess(p => ({ ...p, [projectId]: false })), 3000);
      };
      reader.readAsDataURL(file);
    } catch (e) { alert('Upload failed: ' + e.message); }
    setUploading(null);
  };

  const statusGroups = [
    { label: '🔴 New / Pending',  statuses: ['pending','reviewing','accepted'] },
    { label: '🟡 In Progress',    statuses: ['in_progress'] },
    { label: '✅ Completed',      statuses: ['completed'] },
    { label: '❌ Rejected',       statuses: ['rejected'] },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>My Projects</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>{projects.length} total assigned projects.</p>

      {projects.length === 0 && (
        <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No projects assigned yet. Admin will assign projects to you.</p>
        </div>
      )}

      {statusGroups.map(grp => {
        const grpProjects = projects.filter(p => grp.statuses.includes(p.status));
        if (!grpProjects.length) return null;
        return (
          <div key={grp.label} style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>{grp.label} ({grpProjects.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grpProjects.map(p => {
                const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#333' };
                const deadline = p.deadline ? new Date(p.deadline) : null;
                const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
                return (
                  <div key={p.id} style={{ ...s.card, border: `1px solid ${sc.color}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{p.serviceTitle || p.topicTitle || 'Untitled Project'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Client: {p.name} · {p.email}</div>
                        {p.agreedPrice && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>₦{Number(p.agreedPrice).toLocaleString()}</div>}
                      </div>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, flexShrink: 0 }}>{p.status?.replace('_',' ')}</span>
                    </div>

                    {p.description && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, lineHeight: 1.6 }}>
                        {p.description.slice(0, 200)}{p.description.length > 200 ? '...' : ''}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.adminNote && (
                          <div style={{ fontSize: 12, color: '#0D9488', background: 'rgba(13,148,136,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                            📌 Admin: {p.adminNote.slice(0, 60)}
                          </div>
                        )}
                        {daysLeft !== null && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: daysLeft <= 1 ? '#DC2626' : daysLeft <= 3 ? '#D97706' : '#16A34A', background: daysLeft <= 1 ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                            ⏰ {daysLeft <= 0 ? 'Overdue!' : `${daysLeft} days left`}
                          </span>
                        )}
                        {p.draftFileName && (
                          <span style={{ fontSize: 12, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                            📎 {p.draftFileName}
                          </span>
                        )}
                      </div>

                      {/* Upload draft button */}
                      {['accepted','in_progress'].includes(p.status) && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: uploadSuccess[p.id] ? '#16A34A' : '#7C3AED', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                          {uploading === p.id ? (
                            <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Uploading…</>
                          ) : uploadSuccess[p.id] ? '✅ Uploaded!' : '📤 Upload Draft'}
                          <input type="file" style={{ display: 'none' }}
                            onChange={e => handleFileUpload(p.id, e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Wallet Tab ────────────────────────────────────────────────
function WalletTab({ earnings, stats, user, writerProfile, s }) {
  const [requesting, setRequesting]   = useState(false);
  const [amount, setAmount]           = useState('');
  const [note, setNote]               = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeMonth, setActiveMonth] = useState('all');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'withdrawalRequests'), where('writerId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const requestWithdrawal = async () => {
    const amt = Number(amount);
    if (!amt || amt < 500) { alert('Minimum withdrawal is ₦500.'); return; }
    if (amt > stats.pendingPay) { alert(`You only have ₦${stats.pendingPay.toLocaleString()} pending.`); return; }
    if (!writerProfile?.bankAccount || !writerProfile?.bankName) {
      alert('Please add your bank details in Settings first.'); return;
    }
    setRequesting(true);
    try {
      await addDoc(collection(db, 'withdrawalRequests'), {
        writerId:    user.uid,
        writerName:  writerProfile?.name || user.email,
        writerEmail: user.email,
        bankName:    writerProfile?.bankName || '',
        accountName: writerProfile?.accountName || '',
        bankAccount: writerProfile?.bankAccount || '',
        amount:      amt,
        note:        note.trim(),
        status:      'pending',
        createdAt:   serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', title: '💸 Withdrawal Request',
        body: `${writerProfile?.name || 'Writer'} requested ₦${amt.toLocaleString()} withdrawal`,
        type: 'payment', read: false, createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setAmount(''); setNote('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (e) { alert('Error: ' + e.message); }
    setRequesting(false);
  };

  // Monthly earnings breakdown
  const monthlyMap = {};
  earnings.forEach(e => {
    const d = e.createdAt?.toDate?.() || new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { total: 0, paid: 0, count: 0 };
    monthlyMap[key].total += e.writerAmount || 0;
    if (e.status === 'paid') monthlyMap[key].paid += e.writerAmount || 0;
    monthlyMap[key].count++;
  });
  const months = Object.entries(monthlyMap).sort((a,b) => b[0].localeCompare(a[0]));

  const displayEarnings = activeMonth === 'all' ? earnings : earnings.filter(e => {
    const d = e.createdAt?.toDate?.() || new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return key === activeMonth;
  });

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>💳 My Wallet</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Your earnings, withdrawals and payment history.</p>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Earned',  value: `₦${stats.totalEarned.toLocaleString()}`,                                   color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  icon: '💰' },
          { label: 'Pending',       value: `₦${stats.pendingPay.toLocaleString()}`,                                    color: '#D97706', bg: 'rgba(217,119,6,0.08)',  icon: '⏳' },
          { label: 'Paid Out',      value: `₦${Math.max(0, stats.totalEarned - stats.pendingPay).toLocaleString()}`,   color: '#0D9488', bg: 'rgba(13,148,136,0.08)', icon: '✅' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 14, padding: '18px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Withdrawal request */}
      <div style={{ ...s.card, border: '1px solid rgba(22,163,74,0.3)', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#16A34A', marginBottom: 4 }}>💸 Request Withdrawal</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Bank: <strong style={{ color: 'var(--text-primary)' }}>{writerProfile?.bankName || '—'}</strong> ·
          Account: <strong style={{ color: 'var(--text-primary)' }}>{writerProfile?.accountName || '—'}</strong>
          {(!writerProfile?.bankAccount) && (
            <span style={{ color: '#DC2626', marginLeft: 8 }}>⚠️ Add bank details in Settings first</span>
          )}
        </div>
        {submitted ? (
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 10, padding: '14px', textAlign: 'center', color: '#16A34A', fontWeight: 700 }}>
            ✅ Withdrawal request sent! Admin will process within 24 hours.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Amount (₦)" min="500"
              style={{ ...s.input, marginBottom: 0, flex: 1, minWidth: 120 }} />
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note (optional)"
              style={{ ...s.input, marginBottom: 0, flex: 2, minWidth: 160 }} />
            <button onClick={requestWithdrawal} disabled={requesting || !amount}
              style={{ ...s.btn('#16A34A'), padding: '10px 20px', opacity: amount ? 1 : 0.6, flexShrink: 0 }}>
              {requesting ? '…' : '💸 Request'}
            </button>
          </div>
        )}
      </div>

      {/* Monthly summary */}
      {months.length > 0 && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>📊 Monthly Summary</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
            <button onClick={() => setActiveMonth('all')}
              style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${activeMonth === 'all' ? '#7C3AED' : 'var(--border)'}`, background: activeMonth === 'all' ? '#7C3AED' : 'transparent', color: activeMonth === 'all' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              All Time
            </button>
            {months.map(([key]) => (
              <button key={key} onClick={() => setActiveMonth(key)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${activeMonth === key ? '#7C3AED' : 'var(--border)'}`, background: activeMonth === key ? '#7C3AED' : 'transparent', color: activeMonth === key ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                {key}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
            {months.slice(0, 6).map(([key, val]) => (
              <div key={key} style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{key}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#16A34A' }}>₦{val.paid.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{val.count} project{val.count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>📜 Withdrawal History</div>
          {withdrawals.map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>₦{Number(w.amount).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.bankName} · {w.createdAt?.toDate?.()?.toLocaleDateString()}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: w.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', color: w.status === 'paid' ? '#16A34A' : '#D97706' }}>
                {w.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Earnings list */}
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>💼 Earnings ({displayEarnings.length})</div>
      {displayEarnings.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💰</div>
          <p style={{ color: 'var(--text-muted)' }}>No earnings yet. Complete projects to get paid.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayEarnings.map(e => (
            <div key={e.id} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {e.splitType === 'referral_only' ? '🔗 Referral commission' : '✍️ Project payment'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: ₦{e.totalAmount?.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.createdAt?.toDate?.()?.toLocaleDateString() || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#16A34A' }}>₦{e.writerAmount?.toLocaleString()}</div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: e.status === 'paid' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', color: e.status === 'paid' ? '#16A34A' : '#D97706' }}>
                  {e.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Performance Tab ───────────────────────────────────────────
function PerformanceTab({ projects, earnings, allWriters, user, s }) {
  const total      = projects.length;
  const completed  = projects.filter(p => p.status === 'completed').length;
  const rejected   = projects.filter(p => p.status === 'rejected').length;
  const onTime     = projects.filter(p => p.status === 'completed' && p.deadline && new Date(p.deadline) >= (p.completedAt?.toDate?.() || new Date())).length;
  const rate       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;

  // Rating from payment splits (admin sets rating)
  const ratings    = earnings.filter(e => e.rating).map(e => e.rating);
  const avgRating  = ratings.length > 0 ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : null;

  // Streak — consecutive completed projects
  const sortedCompleted = projects.filter(p => p.status === 'completed').sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  const streak = sortedCompleted.length;

  const scores = [
    { label: 'Completion Rate', value: `${rate}%`,     color: rate >= 80 ? '#16A34A' : rate >= 50 ? '#D97706' : '#DC2626', icon: '📊' },
    { label: 'Projects Done',   value: completed,       color: '#0D9488', icon: '✅' },
    { label: 'On-Time Rate',    value: `${onTimeRate}%`, color: onTimeRate >= 80 ? '#16A34A' : '#D97706', icon: '⏰' },
    { label: 'Streak',          value: `${streak} 🔥`,  color: '#D97706', icon: '🔥' },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>⭐ My Performance</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Your work quality and delivery record.</p>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 28 }}>
        {scores.map(sc => (
          <div key={sc.label} style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{sc.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: sc.color }}>{sc.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{sc.label}</div>
          </div>
        ))}
      </div>

      {/* Star rating */}
      {avgRating && (
        <div style={{ ...s.card, marginBottom: 24, textAlign: 'center', background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: '#D97706' }}>⭐ {avgRating}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Average rating from {ratings.length} rated project{ratings.length > 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Performance tips */}
      <div style={{ ...s.card, border: '1px solid rgba(13,148,136,0.25)', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--teal)', marginBottom: 14 }}>💡 How to Improve Your Score</div>
        {[
          { tip: 'Submit work before the deadline', impact: '+10% on-time rate', icon: '⏰' },
          { tip: 'Always upload a draft to show progress', impact: 'Admin marks faster', icon: '📤' },
          { tip: 'Refer clients who place orders', impact: '+10% commission per referral', icon: '🔗' },
          { tip: 'Use the AI Writer for faster research', impact: 'More projects completed', icon: '🤖' },
        ].map(t => (
          <div key={t.tip} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{t.tip}</div>
              <div style={{ fontSize: 12, color: 'var(--teal)' }}>{t.impact}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Project history */}
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>📜 Project History</div>
      {projects.slice(0, 10).map(p => {
        const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#333' };
        return (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.serviceTitle || 'Project'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.createdAt?.toDate?.()?.toLocaleDateString()}</div>
            </div>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, flexShrink: 0 }}>{p.status?.replace('_',' ')}</span>
          </div>
        );
      })}

      {/* 🏆 Leaderboard */}
      <div style={{ ...s.card, marginTop: 28, border: '1px solid rgba(201,168,76,0.3)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)', marginBottom: 4 }}>🏆 Writer Leaderboard</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Ranked by completed projects across all writers. You are highlighted.
        </div>
        {[
          // Self entry using live local data
          {
            id:        user?.uid,
            name:      'You',
            completed: projects.filter(p => p.status === 'completed').length,
            earned:    earnings.filter(e => e.status === 'paid').reduce((s, e) => s + (e.writerAmount || 0), 0),
            isMe:      true,
          },
          // Other writers from Firestore (admin stores completedCount + totalEarned on their user doc)
          ...allWriters.map(w => ({
            id:        w.id || w.uid,
            name:      w.name || w.email?.split('@')[0] || 'Writer',
            completed: w.completedCount || 0,
            earned:    w.totalEarned    || 0,
            isMe:      false,
          })),
        ]
          .sort((a, b) => b.completed - a.completed || b.earned - a.earned)
          .map((w, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px',
                borderBottom: '1px solid var(--border)',
                background: w.isMe ? 'rgba(139,92,246,0.07)' : 'transparent',
                borderRadius: w.isMe ? 8 : 0,
                marginBottom: w.isMe ? 2 : 0,
              }}>
                <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                  {medal
                    ? <span style={{ fontSize: 20 }}>{medal}</span>
                    : <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>#{i + 1}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: w.isMe ? 700 : 600, fontSize: 14, color: w.isMe ? '#7C3AED' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {w.name}
                    {w.isMe && <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.15)', color: '#7C3AED', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>You</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{w.completed} completed project{w.completed !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#16A34A' }}>₦{(w.earned || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total earned</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────
function TasksTab({ projects, user, s }) {
  const [notes, setNotes]       = useState({});
  const [newNote, setNewNote]   = useState({});
  const [savingNote, setSavingNote] = useState(null);

  // Load personal notes from localStorage
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(`writer_notes_${user?.uid}`) || '{}'); setNotes(saved); } catch {}
  }, [user]);

  const saveNote = (projectId, text) => {
    const updated = { ...notes, [projectId]: text };
    setNotes(updated);
    localStorage.setItem(`writer_notes_${user?.uid}`, JSON.stringify(updated));
  };

  const activeTasks = projects.filter(p => ['accepted','in_progress','reviewing'].includes(p.status));
  const now = new Date();

  const getUrgency = (p) => {
    if (!p.deadline) return 'normal';
    const days = Math.ceil((new Date(p.deadline) - now) / 86400000);
    if (days <= 0) return 'overdue';
    if (days <= 1) return 'critical';
    if (days <= 3) return 'urgent';
    return 'normal';
  };

  const urgencyConfig = {
    overdue:  { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.3)',  label: '🔴 Overdue'  },
    critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.05)',  border: 'rgba(220,38,38,0.2)',  label: '🚨 Due Today' },
    urgent:   { color: '#D97706', bg: 'rgba(217,119,6,0.06)',  border: 'rgba(217,119,6,0.25)', label: '⚠️ Due Soon'  },
    normal:   { color: '#0D9488', bg: 'rgba(13,148,136,0.05)', border: 'rgba(13,148,136,0.2)', label: '✅ On Track'   },
  };

  const sorted = [...activeTasks].sort((a, b) => {
    const order = { overdue: 0, critical: 1, urgent: 2, normal: 3 };
    return order[getUrgency(a)] - order[getUrgency(b)];
  });

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>✅ Task Manager</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''} — sorted by urgency
      </p>

      {activeTasks.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>All caught up!</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active tasks right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map(p => {
            const urgency = getUrgency(p);
            const cfg     = urgencyConfig[urgency];
            const deadline = p.deadline ? new Date(p.deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - now) / 86400000) : null;

            return (
              <div key={p.id} style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 14, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{p.serviceTitle || p.topicTitle || 'Project'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Client: {p.name}</div>
                    {p.agreedPrice && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>₦{Number(p.agreedPrice).toLocaleString()}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>{cfg.label}</div>
                    {daysLeft !== null && (
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: cfg.color }}>
                        {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d`}
                      </div>
                    )}
                    {deadline && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Due: {deadline.toLocaleDateString()}</div>}
                  </div>
                </div>

                {/* Deadline countdown bar */}
                {deadline && daysLeft !== null && daysLeft > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.max(5, 100 - (daysLeft / 14) * 100))}%`, background: daysLeft <= 1 ? '#DC2626' : daysLeft <= 3 ? '#D97706' : '#16A34A', borderRadius: 20, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )}

                {/* Notes scratch pad */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>📝 My Notes</div>
                  <textarea
                    value={notes[p.id] || ''}
                    onChange={e => saveNote(p.id, e.target.value)}
                    placeholder="Jot down research notes, key points, outline ideas..."
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Upload draft */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                    📤 Upload Draft
                    <input type="file" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 5242880) { alert('File must be under 5MB.'); return; }
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          await updateDoc(doc(db, 'serviceRequests', p.id), {
                            draftFileData: reader.result, draftFileName: file.name,
                            draftUploadedAt: serverTimestamp(), status: 'reviewing', updatedAt: serverTimestamp(),
                          });
                        };
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                  {p.draftFileName && <span style={{ fontSize: 12, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', padding: '7px 10px', borderRadius: 8 }}>📎 {p.draftFileName}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Referral Tab ──────────────────────────────────────────────
function ReferralTab({ referralLink, user, projects, s }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  const referredProjects  = projects.filter(p => p.referredBy === user?.uid);
  const totalReferralEarnings = referredProjects.filter(p => p.status === 'completed').length;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>🔗 Referral Program</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Share your link — earn 10–95% on every order.</p>

      {/* Referral stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Referred Clients', value: referredProjects.length, color: '#7C3AED', icon: '👥' },
          { label: 'Completed Orders', value: totalReferralEarnings,   color: '#16A34A', icon: '✅' },
        ].map(stat => (
          <div key={stat.label} style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div style={{ ...s.card, marginBottom: 24, border: '1px solid rgba(201,168,76,0.3)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 8 }}>🔗 Your Referral Link</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>
            {referralLink}
          </div>
          <button onClick={copy} style={{ ...s.btn(copied ? '#16A34A' : 'var(--gold)', '#000'), flexShrink: 0 }}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Share via WhatsApp, Telegram, or any platform. Clients who register through this link are assigned to you.
        </div>
      </div>

      {/* Commission breakdown */}
      <div style={{ ...s.card, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>💰 Commission Structure</div>
        {[
          { scenario: 'You refer + you write',         you: '95%', other: '—',   admin: '—',  maint: '5%', highlight: true },
          { scenario: 'You refer + push to writer',    you: '10%', other: '85%', admin: '—',  maint: '5%', highlight: false },
          { scenario: 'Admin refers + you write',      you: '95%', other: '—',   admin: '—',  maint: '5%', highlight: false },
        ].map((r, i) => (
          <div key={i} style={{ background: r.highlight ? 'rgba(22,163,74,0.07)' : 'var(--bg-tertiary)', border: `1px solid ${r.highlight ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{r.scenario}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['You', r.you, '#16A34A'], ['Writer', r.other, '#7C3AED'], ['Admin', r.admin, 'var(--teal)'], ['Maint.', r.maint, 'var(--text-muted)']].map(([label, val, color]) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Referred clients list */}
      <div style={{ ...s.card }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>👥 Your Referred Clients ({referredProjects.length})</div>
        {referredProjects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No clients from your link yet. Start sharing!</p>
        ) : (
          referredProjects.map(p => {
            const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#333' };
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.serviceTitle || p.serviceKey}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.name}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>{p.status}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Client Chat Tab ───────────────────────────────────────────
function ClientChatTab({ projects, user, writerProfile, setUnreadChats, s }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages]               = useState([]);
  const [text, setText]                       = useState('');
  const [sending, setSending]                 = useState(false);
  const endRef                                = useRef(null);

  // Only projects where a conversation makes sense
  const chatProjects = projects.filter(p =>
    ['accepted','in_progress','reviewing','completed'].includes(p.status)
  );

  // Live messages for selected project
  useEffect(() => {
    if (!selectedProject) { setMessages([]); return; }
    const q = query(
      collection(db, 'orderChats', selectedProject.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Mark all incoming client messages as read
      snap.docs.forEach(d => {
        const msg = d.data();
        if (msg.senderRole === 'client' && !msg.readByWriter) {
          updateDoc(doc(db, 'orderChats', selectedProject.id, 'messages', d.id), { readByWriter: true }).catch(() => {});
        }
      });
      setUnreadChats(0);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
    return unsub;
  }, [selectedProject]);

  const sendMsg = async () => {
    if (!text.trim() || !selectedProject || sending) return;
    const payload = text.trim();
    setText('');
    setSending(true);
    try {
      await addDoc(collection(db, 'orderChats', selectedProject.id, 'messages'), {
        text:          payload,
        senderId:      user.uid,
        senderName:    writerProfile?.name || user.email,
        senderRole:    'writer',
        readByWriter:  true,
        readByClient:  false,
        createdAt:     serverTimestamp(),
      });
      // Notify client if we have their userId stored on the request
      if (selectedProject.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId:    selectedProject.userId,
          title:     `💬 New message from your writer`,
          body:      `${writerProfile?.name || 'Your writer'}: ${payload.slice(0, 80)}${payload.length > 80 ? '…' : ''}`,
          type:      'chat',
          projectId: selectedProject.id,
          read:      false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) { alert('Send failed: ' + e.message); setText(payload); }
    setSending(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>💬 Client Chat</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Message your clients directly — no WhatsApp needed.</p>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 220px)', minHeight: 420 }}>

        {/* ─ Project list ─ */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', paddingRight: 4 }}>
          {chatProjects.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', lineHeight: 1.6 }}>
              No active projects to chat on yet.
            </div>
          )}
          {chatProjects.map(p => {
            const active = selectedProject?.id === p.id;
            const sc = STATUS_COLORS[p.status] || { bg: '#eee', color: '#888' };
            return (
              <button key={p.id} onClick={() => setSelectedProject(p)}
                style={{ textAlign: 'left', background: active ? 'rgba(139,92,246,0.12)' : 'var(--bg-secondary)', border: `1px solid ${active ? '#7C3AED' : 'var(--border)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.18s', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: active ? '#7C3AED' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                  {p.serviceTitle || p.topicTitle || 'Project'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <span style={{ display: 'inline-block', marginTop: 5, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, borderRadius: 20, padding: '1px 7px' }}>{p.status?.replace('_',' ')}</span>
              </button>
            );
          })}
        </div>

        {/* ─ Chat pane ─ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', minWidth: 0 }}>
          {!selectedProject ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem' }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Select a project to chat</div>
              <div style={{ fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                Direct messaging with clients — keep everything on record inside the app.
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{selectedProject.serviceTitle || 'Project'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Client: {selectedProject.name} · {selectedProject.email}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
                    No messages yet — start the conversation! 👋
                  </div>
                )}
                {messages.map(m => {
                  const isMe = m.senderRole === 'writer';
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        background:   isMe ? '#7C3AED' : 'var(--bg-card)',
                        color:        isMe ? '#fff'    : 'var(--text-primary)',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding:      '10px 14px',
                        boxShadow:    '0 1px 4px rgba(0,0,0,0.08)',
                        border:       isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>{m.senderName}</div>}
                        <div style={{ fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word' }}>{m.text}</div>
                        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 5, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                          {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          {isMe && <span style={{ marginLeft: 3 }}>{m.readByClient ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 24, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}
                />
                <button onClick={sendMsg} disabled={!text.trim() || sending}
                  style={{ width: 42, height: 42, borderRadius: '50%', background: text.trim() ? '#7C3AED' : 'var(--bg-tertiary)', border: 'none', cursor: text.trim() ? 'pointer' : 'default', color: text.trim() ? '#fff' : 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {sending ? '…' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────
function ProfileTab({ user, writerProfile, projects, earnings, s }) {
  const completed = projects.filter(p => p.status === 'completed').length;
  const totalPaid = earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.writerAmount || 0), 0);
  const ratings   = earnings.filter(e => e.rating).map(e => e.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/request?writer=${user?.uid}`;
  const copy = () => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  const specialties = writerProfile?.specialties
    ? writerProfile.specialties.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const initial = (writerProfile?.name || user?.email || 'W').charAt(0).toUpperCase();

  const checks = [
    { done: !!writerProfile?.bio,        label: 'Add a bio in Settings',                  icon: '📝' },
    { done: !!writerProfile?.specialties, label: 'List your academic specialties',          icon: '🎓' },
    { done: !!writerProfile?.phone,      label: 'Add your phone number',                   icon: '📱' },
    { done: completed >= 5,              label: 'Complete 5+ projects to build credibility', icon: '✅' },
    { done: !!avgRating,                 label: 'Get rated by admin on completed projects', icon: '⭐' },
  ];

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>🪪 My Profile</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Your public writer card — share it so clients can request you directly.
      </p>

      {/* Profile card */}
      <div style={{ ...s.card, marginBottom: 20, padding: 0, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 16 }}>
        {/* Banner */}
        <div style={{ height: 76, background: 'linear-gradient(90deg, #172554 0%, #1E3A8A 55%, #0F766E 100%)', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: -26, left: 22,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            border: '3px solid var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}>
            {initial}
          </div>
        </div>

        <div style={{ padding: '36px 22px 22px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            {writerProfile?.name || user?.email}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            ✍️ Academic Writer · Elite Mobile Cafe
          </div>

          {/* Bio */}
          {writerProfile?.bio && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-tertiary)', borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
              {writerProfile.bio}
            </div>
          )}

          {/* Specialties pills */}
          {specialties.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>Specialties</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {specialties.map(sp => (
                  <span key={sp} style={{ background: 'rgba(13,148,136,0.12)', color: '#0D9488', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{sp}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '14px 0' }}>
            {[
              { label: 'Projects Done', value: completed,                                icon: '✅', color: '#16A34A' },
              { label: 'Avg Rating',    value: avgRating ? `${avgRating} ⭐` : 'New',   icon: '⭐', color: '#D97706' },
              { label: 'Total Earned',  value: `₦${totalPaid.toLocaleString()}`,         icon: '💰', color: '#7C3AED' },
            ].map((st, i) => (
              <div key={st.label} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: st.color }}>{st.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
            {user?.email   && <span>📧 {user.email}</span>}
            {writerProfile?.phone && <span>📱 {writerProfile.phone}</span>}
          </div>
        </div>
      </div>

      {/* Share link */}
      <div style={{ ...s.card, marginBottom: 20, border: '1px solid rgba(201,168,76,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 6 }}>🔗 Share Your Profile</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          When clients click this link, their request form will automatically tag you as the preferred writer.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>
            {profileUrl}
          </div>
          <button onClick={copy} style={{ ...s.btn(copied ? '#16A34A' : 'var(--gold)', '#000'), flexShrink: 0 }}>
            {copied ? '✅ Copied!' : '📋 Copy Link'}
          </button>
        </div>
      </div>

      {/* Profile strength checklist */}
      <div style={{ ...s.card, border: '1px solid rgba(13,148,136,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal)', marginBottom: 14 }}>💪 Profile Strength</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{c.done ? '✅' : c.icon}</span>
              <span style={{ fontSize: 13, flex: 1, color: c.done ? '#16A34A' : 'var(--text-primary)', textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.75 : 1 }}>{c.label}</span>
              {c.done && <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, flexShrink: 0 }}>Done</span>}
            </div>
          ))}
        </div>
        {/* Strength bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
            <span>Profile Strength</span>
            <span>{Math.round((checks.filter(c => c.done).length / checks.length) * 100)}%</span>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 20, height: 7, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(checks.filter(c => c.done).length / checks.length) * 100}%`,
              background: 'linear-gradient(90deg, #7C3AED, #0D9488)',
              borderRadius: 20,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────
function SettingsTab({ user, writerProfile, setWriterProfile, s }) {
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { if (writerProfile) setForm({ ...writerProfile }); }, [writerProfile]);

  const save = async () => {
    if (!user || !form) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name || '', phone: form.phone || '', bio: form.bio || '',
        bankName: form.bankName || '', bankAccount: form.bankAccount || '',
        accountName: form.accountName || '', specialties: form.specialties || '',
        updatedAt: serverTimestamp(),
      });
      setWriterProfile(f => ({ ...f, ...form }));
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!form) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>⚙️ Settings</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your profile, specialties and payment details.</p>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>👤 Personal Info</h3>
        {[{ key: 'name', label: 'Full Name', placeholder: 'Your full name' }, { key: 'phone', label: 'Phone Number', placeholder: '+234 ...' }].map(f => (
          <div key={f.key}>
            <label style={s.lbl}>{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={s.input} />
          </div>
        ))}
        <label style={s.lbl}>Bio / About You</label>
        <textarea rows={3} value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell clients and admin about yourself..." style={{ ...s.input, resize: 'vertical' }} />
        <label style={s.lbl}>Specialties (departments)</label>
        <input value={form.specialties || ''} onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))} placeholder="e.g. Nursing Science, Public Health, Mental Health" style={s.input} />
      </div>

      <div style={{ ...s.card, marginBottom: 20, border: '1px solid rgba(22,163,74,0.3)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>🏦 Payment Details</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Your withdrawal requests will be sent to this account.</p>
        {[
          { key: 'bankName',    label: 'Bank Name',      placeholder: 'e.g. GTBank, Access, Zenith, Opay' },
          { key: 'accountName', label: 'Account Name',   placeholder: 'Name on your bank account' },
          { key: 'bankAccount', label: 'Account Number', placeholder: '10-digit account number' },
        ].map(f => (
          <div key={f.key}>
            <label style={s.lbl}>{f.label}</label>
            <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={s.input} />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} style={{ ...s.btn('#16A34A'), padding: '12px 28px', fontSize: 14, width: '100%' }}>
        {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Settings'}
      </button>
    </div>
  );
}
