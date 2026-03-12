// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';

const SERVICES = [
  { icon: '🔬', title: 'Research Projects',        path: '/services/research-projects' },
  { icon: '📊', title: 'Data Analysis',             path: '/services/data-analysis' },
  { icon: '🤝', title: 'Client Care Support',       path: '/services/client-care' },
  { icon: '📝', title: 'Academic Assignments',      path: '/services/academic-assignments' },
  { icon: '🖥️', title: 'Online Registration',       path: '/services/online-registration' },
  { icon: '📑', title: 'PowerPoint Presentation',   path: '/services/powerpoint' },
  { icon: '✏️', title: 'Proofreading & Editing',    path: '/services/proofreading' },
  { icon: '📋', title: 'Survey Design & Analysis',  path: '/services/survey-design' },
  { icon: '🎫', title: 'WAEC / NECO Scratch Cards', path: '/services/waec-neco' },
];

const WHY_US = [
  { icon: '⚡', title: 'Fast Turnaround',      desc: 'We work around your deadline. Most requests are reviewed within hours.' },
  { icon: '🎯', title: 'Tailored Solutions',   desc: 'Every service is customised to your specific needs, level, and goals.' },
  { icon: '💬', title: 'Friendly Client Care', desc: 'We communicate every step of the way — no ghosting, no surprises.' },
  { icon: '💰', title: 'Affordable Rates',     desc: 'Quality work at prices that make sense for students and professionals.' },
];

export default function HomePage() {
  return (
    <div style={{ background: '#F8FAFC', fontFamily: "'Times New Roman', Georgia, serif" }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>

        {/* Student photo background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }} />

        {/* Gradient overlay — deep blue top, teal bottom like the flier */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(23,37,84,0.60) 0%, rgba(23,37,84,0.25) 40%, rgba(13,148,136,0.80) 78%, rgba(13,148,136,0.95) 100%)',
        }} />

        {/* Brand badge at top */}
        <div style={{
          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 14, padding: '14px 28px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
          zIndex: 2,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid #1E3A8A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, background: '#EFF6FF', flexShrink: 0,
          }}>📚</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1E3A8A', lineHeight: 1.15, letterSpacing: 0.5 }}>ELITE MOBILE CAFE</div>
            <div style={{ fontSize: 11, color: '#0D9488', fontStyle: 'italic', marginTop: 2 }}>Your One Stop Shop for Research, Data & Academic Excellence</div>
          </div>
        </div>

        {/* "Our Services" pill at bottom */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: '#0D9488',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 'clamp(17px, 2.5vw, 24px)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '16px 52px',
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 -4px 20px rgba(13,148,136,0.30)',
          }}>
            Our Services Includes
          </div>
        </div>
      </section>

      {/* ── SERVICES GRID ── */}
      <section style={{ background: '#0D9488', padding: '0 16px 52px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 1,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
            {SERVICES.map((s, i) => (
              <Link
                key={i}
                to={s.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '17px 22px',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700, fontSize: 14,
                  letterSpacing: 0.5, textTransform: 'uppercase',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ flex: 1 }}>{s.title}</span>
                <span style={{ opacity: 0.55, fontSize: 14 }}>→</span>
              </Link>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              background: '#FFFFFF', color: '#0D9488',
              fontWeight: 700, fontSize: 15,
              padding: '13px 36px', borderRadius: 8,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.20)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
            >
              Create Free Account
            </Link>
            <Link to="/login" style={{
              background: 'transparent', color: '#FFFFFF',
              fontWeight: 700, fontSize: 15,
              padding: '13px 36px', borderRadius: 8,
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.55)',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FFFFFF'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section style={{ background: '#FFFFFF', padding: '68px 16px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Gold border box — exactly like the flier */}
          <div style={{
            border: '3px solid #F59E0B',
            borderRadius: 12,
            padding: 'clamp(24px, 5vw, 48px)',
          }}>
            <h2 style={{
              fontWeight: 700,
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              color: '#1F2937',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 20,
            }}>Why Choose Us</h2>

            <p style={{
              textAlign: 'center',
              color: '#374151',
              fontSize: 17,
              lineHeight: 1.85,
              maxWidth: 620,
              margin: '0 auto 40px',
            }}>
              At Elite Mobile Cafe, we pride ourselves on delivering professional and timely services,
              offering tailored solutions for both students and professionals, supported by friendly
              client care, all at affordable rates.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 20,
            }}>
              {WHY_US.map((w, i) => (
                <div key={i} style={{
                  textAlign: 'center', padding: '22px 14px',
                  borderRadius: 10, background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{w.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1E3A8A', marginBottom: 8 }}>{w.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT & LOCATION — matches flier footer ── */}
      <section style={{
        background: '#172554',
        padding: '48px 16px 32px',
        borderTop: '3px solid #0D9488',
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', justifyContent: 'center',
          gap: 'clamp(20px, 8vw, 80px)',
          flexWrap: 'wrap',
        }}>
          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: '#0D9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>📞</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Contact Us</div>
              <a href="tel:07054641287" style={{
                color: '#FFFFFF', fontWeight: 700, fontSize: 19, textDecoration: 'none',
              }}>07054641287</a>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: '#0D9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>📍</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Our Location</div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 19 }}>Yaba, Lagos</div>
            </div>
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 32,
          color: 'rgba(255,255,255,0.35)',
          fontSize: 12, fontStyle: 'italic',
        }}>
          © {new Date().getFullYear()} Elite Mobile Cafe · Your One Stop Shop for Research, Data & Academic Excellence
        </p>
      </section>

    </div>
  );
}
