// src/pages/HomePage.jsx
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Star, FileText, PenTool, CreditCard, Download } from 'lucide-react';

const STEPS = [
  { icon: FileText, num: '01', title: 'Browse or Request', desc: 'Pick from our curated research topics or submit your own custom topic with full details.' },
  { icon: PenTool, num: '02', title: 'Receive Your Quote', desc: 'Our team reviews your request and sends you a tailored price quote within 24 hours.' },
  { icon: CreditCard, num: '03', title: 'Secure Advance Payment', desc: 'Confirm the price and pay 50% to kick off your project. Safe, fast, and encrypted.' },
  { icon: Download, num: '04', title: 'Download on Completion', desc: 'Review a preview, pay the final balance, and your full document unlocks instantly.' },
];

const TOPICS = [
  { title: 'Impact of AI on Modern Healthcare Systems', category: 'Technology', pages: '15–20', price: '₦12,000', badge: 'Popular' },
  { title: 'Climate Change Policy in Sub-Saharan Africa', category: 'Environmental Science', pages: '10–15', price: '₦9,500', badge: 'New' },
  { title: 'Financial Inclusion and Mobile Banking Growth', category: 'Economics', pages: '12–18', price: '₦11,000', badge: null },
  { title: 'Youth Unemployment and Social Mobility', category: 'Sociology', pages: '10–15', price: '₦8,500', badge: 'Popular' },
  { title: 'Blockchain in Supply Chain Management', category: 'Business', pages: '15–20', price: '₦13,000', badge: null },
  { title: 'Mental Health Awareness in Higher Education', category: 'Psychology', pages: '12–16', price: '₦10,000', badge: 'New' },
];

const TESTIMONIALS = [
  { name: 'Adaeze O.', role: 'Graduate Student', text: 'The quality was exceptional. Delivered ahead of schedule and the research depth was exactly what I needed for my thesis.', stars: 5 },
  { name: 'Emeka T.', role: 'Business Analyst', text: "Professional, thorough, and worth every kobo. I've used The Elites Cafe three times now and won't go anywhere else.", stars: 5 },
  { name: 'Fatima H.', role: 'Postgrad Researcher', text: 'The payment system is transparent and secure. I loved being able to preview the work before final payment.', stars: 5 },
];

export default function HomePage() {
  const heroRef = useRef(null);

  useEffect(() => {
    // Parallax on hero background
    const handleScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', position: 'relative', display: 'flex',
        alignItems: 'center', overflow: 'hidden',
      }}>
        {/* Background layers */}
        <div ref={heroRef} style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 60% 40%, rgba(201,168,76,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(201,168,76,0.04) 0%, transparent 60%)
          `,
        }} />

        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.03,
          backgroundImage: `linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        {/* Decorative ring */}
        <div style={{
          position: 'absolute', right: '-10%', top: '10%',
          width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
          border: '1px solid rgba(201,168,76,0.08)', borderRadius: '50%', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', right: '-6%', top: '14%',
          width: '45vw', height: '45vw', maxWidth: 580, maxHeight: 580,
          border: '1px solid rgba(201,168,76,0.12)', borderRadius: '50%', zIndex: 0,
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px clamp(16px, 4vw, 60px) 80px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 680 }}>

            <div className="animate-fade-up delay-1" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid var(--border-gold)', borderRadius: 30,
              padding: '6px 14px', marginBottom: 28,
            }}>
              <ShieldCheck size={13} color="var(--gold)" />
              <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                Trusted Research Writing Services
              </span>
            </div>

            <h1 className="animate-fade-up delay-2" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 6vw, 78px)',
              fontWeight: 600, lineHeight: 1.1,
              letterSpacing: -0.5, marginBottom: 24,
            }}>
              Research That{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>Speaks</em>
              <br />for Itself
            </h1>

            <p className="animate-fade-up delay-3" style={{
              color: 'var(--text-secondary)', fontSize: 'clamp(15px, 1.8vw, 18px)',
              lineHeight: 1.75, marginBottom: 40, maxWidth: 520, fontWeight: 300,
            }}>
              Premium academic and business research, written by expert writers. Browse ready topics or request custom work — delivered on time, every time.
            </p>

            <div className="animate-fade-up delay-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/topics" style={{
                background: 'var(--gold)', color: 'var(--dark)',
                padding: '14px 32px', borderRadius: 'var(--radius)',
                textDecoration: 'none', fontWeight: 600, fontSize: 14,
                fontFamily: 'var(--font-body)', letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'var(--transition)',
                boxShadow: '0 0 30px rgba(201,168,76,0.3)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-light)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(201,168,76,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 30px rgba(201,168,76,0.3)'; }}
              >
                Browse Topics <ArrowRight size={15} />
              </Link>
              <Link to="/request" style={{
                background: 'transparent', color: 'var(--text-primary)',
                padding: '14px 32px', borderRadius: 'var(--radius)',
                textDecoration: 'none', fontWeight: 400, fontSize: 14,
                fontFamily: 'var(--font-body)', letterSpacing: 0.5,
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                Request Custom Work
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-5" style={{ display: 'flex', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
              {[['500+', 'Projects Delivered'], ['98%', 'Client Satisfaction'], ['24hr', 'Average Turnaround']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)', fontWeight: 600, lineHeight: 1 }}>{n}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, letterSpacing: 0.5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px clamp(16px, 4vw, 60px)', background: 'var(--dark-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Simple Process</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600, lineHeight: 1.15 }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED TOPICS ── */}
      <section style={{ padding: '100px clamp(16px, 4vw, 60px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Ready to Order</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600 }}>Featured Topics</h2>
            </div>
            <Link to="/topics" style={{
              color: 'var(--gold)', textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5,
              borderBottom: '1px solid var(--border-gold)', paddingBottom: 2,
            }}>
              View all topics <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {TOPICS.map((topic, i) => (
              <TopicCard key={i} topic={topic} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '100px clamp(16px, 4vw, 60px)', background: 'var(--dark-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Client Stories</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600 }}>What Our Clients Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} data={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '80px clamp(16px, 4vw, 60px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            background: `linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)`,
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(40px, 5vw, 72px)',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `radial-gradient(circle at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 60%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Get Started Today</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 600, marginBottom: 16 }}>
              Ready to Elevate Your Research?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px', fontSize: 15 }}>
              Join hundreds of satisfied clients. Create your free account and place your first order in minutes.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                background: 'var(--gold)', color: 'var(--dark)',
                padding: '14px 36px', borderRadius: 'var(--radius)',
                textDecoration: 'none', fontWeight: 600, fontSize: 14,
                fontFamily: 'var(--font-body)', letterSpacing: 0.5,
                transition: 'var(--transition)',
                boxShadow: '0 0 30px rgba(201,168,76,0.3)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-light)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'none'; }}
              >
                Create Free Account
              </Link>
              <Link to="/topics" style={{
                background: 'transparent', color: 'var(--text-primary)',
                padding: '14px 32px', borderRadius: 'var(--radius)',
                textDecoration: 'none', fontSize: 14,
                fontFamily: 'var(--font-body)',
                border: '1px solid var(--border)',
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                Browse Topics First
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({ step, index }) {
  const Icon = step.icon;
  return (
    <div style={{
      background: 'var(--dark-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 28px',
      position: 'relative', overflow: 'hidden',
      transition: 'var(--transition)',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{
        position: 'absolute', top: 20, right: 24,
        fontFamily: 'var(--font-display)', fontSize: 48,
        color: 'rgba(201,168,76,0.06)', fontWeight: 700, lineHeight: 1,
      }}>{step.num}</div>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius)',
        background: 'var(--gold-glow)', border: '1px solid var(--border-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Icon size={20} color="var(--gold)" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>{step.title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
    </div>
  );
}

function TopicCard({ topic }) {
  return (
    <div style={{
      background: 'var(--dark-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      transition: 'var(--transition)',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {topic.badge && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: topic.badge === 'Popular' ? 'rgba(201,168,76,0.15)' : 'rgba(46,204,113,0.12)',
          border: `1px solid ${topic.badge === 'Popular' ? 'rgba(201,168,76,0.4)' : 'rgba(46,204,113,0.3)'}`,
          color: topic.badge === 'Popular' ? 'var(--gold)' : 'var(--green)',
          fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 20,
        }}>{topic.badge}</div>
      )}
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{topic.category}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)', paddingRight: topic.badge ? 60 : 0 }}>{topic.title}</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{topic.pages} pages</span>
        <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{topic.price}</span>
      </div>
      <Link to="/register" style={{
        display: 'block', textAlign: 'center',
        background: 'transparent', border: '1px solid var(--border-gold)',
        color: 'var(--gold)', borderRadius: 'var(--radius)',
        padding: '10px', textDecoration: 'none',
        fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500,
        transition: 'var(--transition)', marginTop: 4,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-glow)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        Order Now
      </Link>
    </div>
  );
}

function TestimonialCard({ data }) {
  return (
    <div style={{
      background: 'var(--dark-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px',
      transition: 'var(--transition)',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
        {Array.from({ length: data.stars }).map((_, i) => (
          <Star key={i} size={13} fill="var(--gold)" color="var(--gold)" />
        ))}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: 16 }}>
        "{data.text}"
      </p>
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>{data.name}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{data.role}</div>
      </div>
    </div>
  );
}
