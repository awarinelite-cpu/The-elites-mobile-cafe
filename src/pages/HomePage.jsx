// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical, BarChart3, HeartHandshake, FileText, MonitorSmartphone,
  Presentation, PenLine, ClipboardList, Ticket, Sparkles, Users, Clock,
  ShieldCheck, CheckCircle2, ArrowRight, GraduationCap,
} from 'lucide-react';

const SERVICES = [
  { icon: FlaskConical,      title: 'Research Projects',        path: '/services/research-projects' },
  { icon: BarChart3,         title: 'Data Analysis',             path: '/services/data-analysis' },
  { icon: HeartHandshake,    title: 'Client Care Support',       path: '/services/client-care' },
  { icon: FileText,          title: 'Academic Assignments',      path: '/services/academic-assignments' },
  { icon: MonitorSmartphone, title: 'Online Registration',       path: '/services/online-registration' },
  { icon: Presentation,      title: 'PowerPoint Presentation',   path: '/services/powerpoint' },
  { icon: PenLine,           title: 'Proofreading & Editing',    path: '/services/proofreading' },
  { icon: ClipboardList,     title: 'Survey Design & Analysis',  path: '/services/survey-design' },
  { icon: Ticket,            title: 'WAEC / NECO Scratch Cards', path: '/services/waec-neco' },
];

const FEATURES = [
  { icon: Sparkles,     title: 'AI Research Writer',  desc: 'Chapter-by-chapter AI assistance for Introduction through Discussion, tailored to your project type.', adminOnly: true },
  { icon: Users,        title: 'Expert Writers',      desc: 'Skilled Nigerian academic writers matched to your subject area.' },
  { icon: Clock,        title: 'Fast Turnaround',     desc: "We work around your deadline, most requests are reviewed within hours." },
  { icon: ShieldCheck,  title: 'Secure Payments',     desc: 'Pay only 50% upfront via Monnify, the balance is due on delivery.' },
  { icon: CheckCircle2, title: 'Preview Before Pay',  desc: 'Review a watermarked draft before you pay the remaining balance.' },
  { icon: HeartHandshake, title: 'Friendly Client Care', desc: 'We communicate every step of the way, no ghosting, no surprises.' },
];

const STEPS = [
  { n: '1', title: 'Submit a Request',  desc: 'Pick a topic or service and describe exactly what you need.' },
  { n: '2', title: 'Receive a Quote',   desc: 'Admin reviews your request and sends a fair price quote.' },
  { n: '3', title: 'Pay 50% Upfront',   desc: 'A secure advance payment via Monnify gets the work started.' },
  { n: '4', title: 'Get Your Delivery', desc: 'Review the draft, pay the balance, download the final document.' },
];

export default function HomePage() {
  const { profile } = useAuth();
  const dashboardHref = profile?.isAdmin ? '/admin' : profile?.isWriter ? '/writer' : '/dashboard';

  return (
    <div className="ec-home">

      {/* ── HERO ── */}
      <section className="ec-hero">
        <div className="ec-hero-inner">
          <div className="ec-badge">
            <GraduationCap size={15} /> Your One Stop Shop for Research, Data &amp; Academic Excellence
          </div>
          <h1 className="ec-h1">
            Get Your Research Done <span>Right &amp; On Time</span>
          </h1>
          <p className="ec-sub">
            Connect with expert Nigerian writers for projects, data analysis, and more.
            Or use our AI Research Writer for an instant chapter-by-chapter draft.
          </p>
          <div className="ec-cta-row">
            <Link to={profile ? dashboardHref : '/login'} className="ec-btn ec-btn-primary">
              Sign In <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="ec-btn ec-btn-ghost">Browse Services</Link>
          </div>
        </div>
      </section>

      {/* ── SERVICE PILLS ── */}
      <section className="ec-pills-wrap">
        <div className="ec-pills">
          {SERVICES.map((s) => (
            <Link key={s.path} to={s.path} className="ec-pill">
              <s.icon size={15} /> {s.title}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="ec-section">
        <div className="ec-section-head">
          <h2>Everything You Need to Succeed</h2>
          <p>From AI-powered writing to expert human support</p>
        </div>
        <div className="ec-feature-grid">
          {FEATURES.filter(f => !f.adminOnly || profile?.isAdmin).map((f) => (
            <div key={f.title} className="ec-feature-card">
              <div className="ec-feature-icon"><f.icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="ec-section ec-steps-section">
        <div className="ec-section-head">
          <h2>How It Works</h2>
          <p>Simple, transparent, and secure</p>
        </div>
        <div className="ec-steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="ec-step">
              <div className="ec-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ec-section">
        <div className="ec-cta-block">
          <h2>Ready to Get Started?</h2>
          <p>Join students across Nigeria who trust Elite Mobile Cafe for their academic success.</p>
          <Link to={profile ? '/request' : '/login'} className="ec-btn ec-btn-light">
            {profile ? 'Submit a Request Now' : 'Sign In to Submit Request'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── CONTACT FOOTER ── */}
      <section className="ec-contact">
        <div className="ec-contact-inner">
          <div className="ec-contact-item">
            <div className="ec-contact-icon">📞</div>
            <div>
              <div className="ec-contact-label">Contact Us</div>
              <a href="tel:07054641287">07054641287</a>
            </div>
          </div>
          <div className="ec-contact-item">
            <div className="ec-contact-icon">📍</div>
            <div>
              <div className="ec-contact-label">Our Location</div>
              <div className="ec-contact-value">Yaba, Lagos</div>
            </div>
          </div>
        </div>
        <p className="ec-contact-copy">
          © {new Date().getFullYear()} Elite Mobile Cafe · Your One Stop Shop for Research, Data &amp; Academic Excellence
        </p>
      </section>

      <style>{`
        .ec-home { font-family: var(--font-body); background: var(--bg-primary); }

        .ec-hero {
          background:
            radial-gradient(circle at 15% 20%, var(--teal-glow), transparent 45%),
            radial-gradient(circle at 85% 0%, var(--gold-glow), transparent 40%),
            linear-gradient(180deg, rgba(22,35,63,0.93) 0%, rgba(27,44,79,0.90) 55%, rgba(11,93,84,0.93) 100%),
            url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&q=80') center 30% / cover no-repeat;
          padding: 74px 20px 60px;
          text-align: center;
        }
        .ec-hero-inner { max-width: 720px; margin: 0 auto; }

        .ec-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          font-size: 0.82rem; font-weight: 500;
          padding: 8px 16px; border-radius: 999px;
          margin-bottom: 26px;
        }

        .ec-h1 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(2.1rem, 5vw, 3.2rem);
          line-height: 1.15;
          color: #fff;
          margin-bottom: 18px;
          letter-spacing: -0.5px;
        }
        .ec-h1 span { color: var(--gold-light); }

        .ec-sub {
          color: rgba(255,255,255,0.78);
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto 32px;
        }

        .ec-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        .ec-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-body); font-weight: 600; font-size: 0.95rem;
          padding: 13px 28px; border-radius: var(--radius-md);
          text-decoration: none; transition: var(--transition);
          border: none; cursor: pointer;
        }
        .ec-btn-primary { background: var(--gold); color: #fff; box-shadow: var(--shadow-gold); }
        .ec-btn-primary:hover { background: var(--gold-dark); transform: translateY(-1px); }
        .ec-btn-ghost { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.30); }
        .ec-btn-ghost:hover { background: rgba(255,255,255,0.14); }
        .ec-btn-light { background: #fff; color: var(--teal-dark); }
        .ec-btn-light:hover { background: var(--bg-secondary); transform: translateY(-1px); }

        .ec-pills-wrap { background: var(--teal-dark); padding: 22px 16px; }
        .ec-pills {
          max-width: 1000px; margin: 0 auto;
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
        }
        .ec-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff; text-decoration: none;
          font-size: 0.84rem; font-weight: 500;
          padding: 9px 15px; border-radius: 999px;
          transition: var(--transition);
        }
        .ec-pill:hover { background: rgba(255,255,255,0.20); }

        .ec-section { max-width: 1100px; margin: 0 auto; padding: 64px 20px; }
        .ec-section-head { text-align: center; margin-bottom: 40px; }
        .ec-section-head h2 {
          font-family: var(--font-display); font-weight: 600;
          font-size: clamp(1.5rem, 3vw, 2rem);
          color: var(--text-primary); margin-bottom: 8px;
        }
        .ec-section-head p { color: var(--text-muted); font-size: 1rem; }

        .ec-feature-grid {
          display: grid; gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }
        .ec-feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 26px 22px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .ec-feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .ec-feature-icon {
          width: 42px; height: 42px; border-radius: var(--radius-md);
          background: var(--teal-glow); color: var(--teal-dark);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .ec-feature-card h3 { font-size: 1.02rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
        .ec-feature-card p { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; }

        .ec-steps-section { background: var(--bg-secondary); border-radius: var(--radius-xl); }
        .ec-steps-grid {
          display: grid; gap: 24px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .ec-step { text-align: center; }
        .ec-step-num {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--blue-deep); color: #fff;
          font-family: var(--font-display); font-weight: 600; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .ec-step h3 { font-size: 0.98rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
        .ec-step p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }

        .ec-cta-block {
          background: linear-gradient(135deg, var(--teal-dark), var(--blue-deep));
          border-radius: var(--radius-xl);
          padding: 56px 32px;
          text-align: center;
        }
        .ec-cta-block h2 {
          font-family: var(--font-display); font-weight: 600;
          font-size: clamp(1.5rem, 3vw, 2.1rem);
          color: #fff; margin-bottom: 12px;
        }
        .ec-cta-block p { color: rgba(255,255,255,0.80); font-size: 1rem; max-width: 460px; margin: 0 auto 26px; }

        .ec-contact { background: var(--blue-deep); padding: 48px 16px 30px; border-top: 3px solid var(--teal); }
        .ec-contact-inner {
          max-width: 700px; margin: 0 auto;
          display: flex; justify-content: center; gap: clamp(24px, 8vw, 80px); flex-wrap: wrap;
        }
        .ec-contact-item { display: flex; align-items: center; gap: 14px; }
        .ec-contact-icon {
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .ec-contact-label { color: rgba(255,255,255,0.55); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
        .ec-contact-item a, .ec-contact-value { color: #fff; font-weight: 700; font-size: 17px; text-decoration: none; }
        .ec-contact-copy { text-align: center; margin-top: 30px; color: rgba(255,255,255,0.35); font-size: 12px; }
      `}</style>
    </div>
  );
}
