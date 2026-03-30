// src/pages/ServicesPage.jsx
import { useState } from 'react';
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
  const writerUid = searchParams.get('writer') || searchParams.get('ref') || null;

  // Form state
  const [selectedService, setSelectedService] = useState(null);
  const [description, setDescription]         = useState('');
  const [deadline, setDeadline]               = useState('');
  const [submitted, setSubmitted]             = useState(false);

  const handleServiceClick = (svc) => {
    setSelectedService(svc);
    setDescription('');
    setDeadline('');
    // Smooth scroll to form
    setTimeout(() => {
      document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedService || !description.trim()) return;

    // Save draft to localStorage so RegisterPage can pick it up after sign-up
    const draft = {
      serviceLabel: selectedService.label,
      servicePath:  selectedService.path,
      description:  description.trim(),
      deadline:     deadline || null,
      referredBy:   writerUid || null,
      createdAt:    new Date().toISOString(),
    };
    localStorage.setItem('pendingServiceRequest', JSON.stringify(draft));

    setSubmitted(true);

    // Redirect to register after a short pause so user sees confirmation
    setTimeout(() => {
      navigate(writerUid ? `/register?ref=${writerUid}` : '/register');
    }, 1800);
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
          <h1 style={styles.title}>OUR SERVICES</h1>
          <div style={styles.titleUnderline} />
          <p style={styles.subtitle}>
            Choose a service below, describe what you need, then create a free account — your request goes straight to admin.
          </p>
        </div>

        {/* Services Grid */}
        <div style={styles.card}>
          <div style={styles.grid}>
            {SERVICES.map((svc, i) => (
              <ServiceCard
                key={svc.path}
                svc={svc}
                index={i}
                selected={selectedService?.path === svc.path}
                onClick={() => handleServiceClick(svc)}
              />
            ))}
          </div>
        </div>

        {/* Request Form — appears after a service is selected */}
        {selectedService && !submitted && (
          <div id="request-form" style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {selectedService.icon} {selectedService.label}
            </h2>
            <p style={styles.formSubtitle}>
              Tell us what you need — admin will review and send you a price quote.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Describe your request *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={`e.g. I need a 5-chapter research project on hypertension management for my final year nursing project...`}
                  required
                  rows={5}
                  style={styles.textarea}
                  onFocus={e => e.target.style.borderColor = '#0D9488'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Deadline (optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#0D9488'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                />
              </div>

              <div style={styles.formButtons}>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  style={styles.cancelBtn}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
                >
                  Submit Request →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success message before redirect */}
        {submitted && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <h3 style={styles.successTitle}>Request saved!</h3>
            <p style={styles.successText}>
              Creating your account now — your request will be sent to admin automatically once you sign up.
            </p>
            <div style={styles.spinner} />
          </div>
        )}

        {/* CTA Buttons (shown when no service selected) */}
        {!selectedService && !submitted && (
          <>
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
              🔒 Select a service above to fill your request, or sign in if you have an account
            </p>
          </>
        )}

      </div>
    </div>
  );
}

/* ── Service Card ──────────────────────────────────────────── */
function ServiceCard({ svc, index, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.serviceCard,
        animationDelay: `${index * 60}ms`,
        background: selected ? 'rgba(13,148,136,0.35)' : 'rgba(255,255,255,0.08)',
        borderColor: selected ? '#0D9488' : 'rgba(255,255,255,0.2)',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: selected ? '0 0 0 2px #0D9488' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }
      }}
    >
      <span style={styles.serviceIcon}>{svc.icon}</span>
      <span style={styles.serviceLabel}>{svc.label.toUpperCase()}</span>
      <span style={styles.arrow}>{selected ? '✓' : '→'}</span>
    </button>
  );
}

/* ── Styles ────────────────────────────────────────────────── */
const styles = {
  page:         { minHeight: '100vh', background: 'linear-gradient(160deg, #0D4F4A 0%, #0D9488 40%, #0F766E 70%, #134E4A 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px 80px', fontFamily: "'Times New Roman', Georgia, serif", position: 'relative', overflow: 'hidden' },
  bgPattern:    { position: 'absolute', inset: 0, pointerEvents: 'none', background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" },
  container:    { position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100 },
  writerBanner: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, padding: '10px 18px', color: '#FFFFFF', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 20 },
  header:       { textAlign: 'center', marginBottom: 32 },
  eyebrow:      { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' },
  title:        { color: '#FFFFFF', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 12px' },
  titleUnderline: { width: 70, height: 3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)', margin: '0 auto 16px', borderRadius: 2 },
  subtitle:     { color: 'rgba(255,255,255,0.75)', fontSize: 14, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 },
  card:         { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '28px 20px', backdropFilter: 'blur(8px)', marginBottom: 28 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  serviceCard:  { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%', animation: 'fadeInUp 0.4s ease both' },
  serviceIcon:  { fontSize: 22, flexShrink: 0 },
  serviceLabel: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1.4, fontFamily: "'Times New Roman', Georgia, serif" },
  arrow:        { color: 'rgba(255,255,255,0.6)', fontSize: 16, flexShrink: 0 },

  // Request form
  formCard:     { background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 16, padding: '32px 28px', backdropFilter: 'blur(12px)', marginBottom: 28, animation: 'fadeInUp 0.3s ease both' },
  formTitle:    { color: '#FFFFFF', fontSize: 20, fontWeight: 700, marginBottom: 6 },
  formSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 },
  form:         { display: 'flex', flexDirection: 'column', gap: 20 },
  fieldGroup:   { display: 'flex', flexDirection: 'column', gap: 8 },
  label:        { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' },
  textarea:     { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '14px 16px', color: '#FFFFFF', fontSize: 14, fontFamily: "'Times New Roman', Georgia, serif", outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', lineHeight: 1.6 },
  input:        { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 16px', color: '#FFFFFF', fontSize: 14, fontFamily: "'Times New Roman', Georgia, serif", outline: 'none', transition: 'border-color 0.2s', colorScheme: 'dark' },
  formButtons:  { display: 'flex', gap: 14, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 4 },
  cancelBtn:    { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s' },
  submitBtn:    { background: '#FFFBEB', color: '#0D9488', border: 'none', borderRadius: 10, padding: '12px 36px', fontSize: 14, fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },

  // Success
  successBox:   { background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(13,148,136,0.5)', borderRadius: 16, padding: '40px 28px', textAlign: 'center', marginBottom: 28 },
  successIcon:  { fontSize: 48, marginBottom: 16 },
  successTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 700, marginBottom: 10 },
  successText:  { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' },
  spinner:      { width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#0D9488', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' },

  // CTA
  ctaRow:       { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 },
  ctaPrimary:   { background: '#FFFBEB', color: '#0D9488', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 200 },
  ctaSecondary: { background: 'transparent', color: '#FFFFFF', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", cursor: 'pointer', transition: 'all 0.2s ease', minWidth: 200 },
  trustNote:    { textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 },
};

/* ── Keyframes ─────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('svc-page-keyframes')) {
  const style = document.createElement('style');
  style.id = 'svc-page-keyframes';
  style.textContent = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
