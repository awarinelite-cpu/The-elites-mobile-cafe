// src/pages/ServicesPage.jsx
import { useNavigate, useSearchParams } from 'react-router-dom';

const SERVICES = [
  { icon: '🔬', label: 'Research Projects',        path: '/services/research-projects'    },
  { icon: '📊', label: 'Data Analysis',             path: '/services/data-analysis'        },
  { icon: '🤝', label: 'Client Care Support',       path: '/services/client-care'          },
  { icon: '📝', label: 'Academic Assignments',      path: '/services/academic-assignments' },
  { icon: '🖥️', label: 'Online Registration',       path: '/services/online-registration'  },
  { icon: '📑', label: 'PowerPoint Presentation',   path: '/services/powerpoint'           },
  { icon: '✏️', label: 'Proofreading & Editing',    path: '/services/proofreading'         },
  { icon: '📋', label: 'Survey Design & Analysis',  path: '/services/survey-design'        },
  { icon: '🎓', label: 'WAEC / NECO Scratch Cards', path: '/services/waec-neco'            },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capture writer UID from URL: /services?writer=UID  OR  /services?ref=UID
  const writerUid = searchParams.get('writer') || searchParams.get('ref') || null;

  const handleServiceClick = (servicePath) => {
    // Carry the writer param into the destination so ServiceRequestPage can read it
    const destination = writerUid
      ? `${servicePath}?writer=${writerUid}`
      : servicePath;

    // Not logged in → send to login, which redirects to destination after auth
    navigate('/login', { state: { from: destination } });
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgPattern} />
      <div style={styles.container}>

        {/* Writer attribution banner */}
        {writerUid && (
          <div style={styles.writerBanner}>
            ✍️ You were referred by a writer — your order will go directly to them.
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.eyebrow}>What can we help you with?</p>
          <h1 style={styles.title}>OUR SERVICES INCLUDES</h1>
          <div style={styles.titleUnderline} />
        </div>

        {/* Services Grid */}
        <div style={styles.card}>
          <div style={styles.grid}>
            {SERVICES.map((svc, i) => (
              <ServiceCard
                key={svc.path}
                svc={svc}
                index={i}
                onClick={() => handleServiceClick(svc.path)}
              />
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={styles.ctaRow}>
          <button
            style={styles.ctaPrimary}
            onClick={() => navigate(writerUid ? `/register?ref=${writerUid}` : '/register')}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0D9488'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.color = '#0D9488'; }}
          >
            Create Free Account
          </button>
          <button
            style={styles.ctaSecondary}
            onClick={() => navigate('/login')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Sign In
          </button>
        </div>

        <p style={styles.trustNote}>
          🔒 Login or create a free account to place your order securely
        </p>
      </div>
    </div>
  );
}

/* ── Service Card ──────────────────────────────────────────── */
function ServiceCard({ svc, index, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
      style={{ ...styles.serviceCard, animationDelay: `${index * 60}ms` }}
    >
      <span style={styles.serviceIcon}>{svc.icon}</span>
      <span style={styles.serviceLabel}>{svc.label.toUpperCase()}</span>
      <span style={styles.arrow}>→</span>
    </button>
  );
}

/* ── Styles ────────────────────────────────────────────────── */
const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0D4F4A 0%, #0D9488 40%, #0F766E 70%, #134E4A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', fontFamily: "'Times New Roman', Georgia, serif", position: 'relative', overflow: 'hidden' },
  bgPattern: { position: 'absolute', inset: 0, pointerEvents: 'none', background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" },
  container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100 },
  writerBanner: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, padding: '10px 18px', color: '#FFFFFF', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 20 },
  header: { textAlign: 'center', marginBottom: 32 },
  eyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 12px' },
  titleUnderline: { width: 70, height: 3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)', margin: '0 auto', borderRadius: 2 },
  card: { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '28px 20px', backdropFilter: 'blur(8px)', marginBottom: 36 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  serviceCard: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%', animation: 'fadeInUp 0.4s ease both' },
  serviceIcon: { fontSize: 22, flexShrink: 0 },
  serviceLabel: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1.4, fontFamily: "'Times New Roman', Georgia, serif" },
  arrow: { color: 'rgba(255,255,255,0.6)', fontSize: 16, flexShrink: 0 },
  ctaRow: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 },
  ctaPrimary: { background: '#FFFBEB', color: '#0D9488', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 200 },
  ctaSecondary: { background: 'transparent', color: '#FFFFFF', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s ease', minWidth: 200 },
  trustNote: { textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 },
};

if (typeof document !== 'undefined' && !document.getElementById('svc-page-keyframes')) {
  const style = document.createElement('style');
  style.id = 'svc-page-keyframes';
  style.textContent = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`;
  document.head.appendChild(style);
}
