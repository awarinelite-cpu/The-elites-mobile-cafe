// src/pages/HomePage.jsx — EliteCafe landing page (matches design mockup)
import { Link } from 'react-router-dom';
import {
  Sun, Moon, ChevronDown, ArrowRight, Users, ShieldCheck, Zap,
  FileSearch, BarChart3, Cpu, UserRound, ClipboardCheck, PencilLine,
  CheckCircle2, ClipboardList, Headset, PackageCheck, Facebook, Twitter,
  MessageCircle, Youtube, Star, ShieldCheck as Shield,
} from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';
import { useAuth } from '../context/AuthContext';

const SERVICES = [
  { icon: FileSearch,     title: 'Research Projects & Proposals', desc: 'Well-researched projects and proposals.', to: '/services/research-projects' },
  { icon: BarChart3,      title: 'Data Analysis',                 desc: 'Expert analysis and professional reports.', to: '/services/data-analysis' },
  { icon: Cpu,            title: 'AI Research Writer',            desc: 'Generate chapter-by-chapter drafts instantly.', to: '/ai-writer' },
  { icon: UserRound,      title: 'Nursing / Client Care Plans',   desc: 'Professional care plans and nursing assignments.', to: '/services/client-care' },
  { icon: ClipboardCheck, title: 'NMCN CBT Preparation',          desc: 'Prepare for your NMCN CBT with ease.', to: '/services' },
  { icon: PencilLine,     title: 'Academic Editing & Support',    desc: 'Polish your work to perfection.', to: '/services/proofreading' },
];

const WHY = ['Expert & Qualified Writers', 'Affordable & Transparent Pricing', 'On-Time Delivery', '100% Original Work', '24/7 Client Support'];

const STEPS = [
  { icon: ClipboardList, title: 'Place Your Order', desc: 'Tell us what you need' },
  { icon: Headset,       title: 'Get Expert Support', desc: 'Our writers get to work' },
  { icon: PackageCheck,  title: 'Receive & Download', desc: 'On time, always' },
];

const REVIEWS = [
  { img: 'sarah',   text: 'EliteCafe delivered my research project on time. Highly recommended!', name: 'Sarah O.' },
  { img: 'chinedu', text: "Professional, reliable and affordable. I'm impressed!",               name: 'Chinedu M.' },
  { img: 'amaka',   text: 'The best academic support platform in Nigeria!',                       name: 'Amaka E.' },
];

const Logo = ({ light }) => (
  <Link to="/" className="lp-logo">
    <img src="/landing/logo.png" alt="" width="52" height="52" />
    <span>
      <b>Elite<i>Cafe</i></b>
      <small>Research • Learn • Excel</small>
    </span>
  </Link>
);

export default function HomePage() {
  const { dark, toggle } = useDarkMode();
  const { profile } = useAuth();
  const dash = profile?.isAdmin ? '/admin' : profile?.isWriter ? '/writer' : '/dashboard';
  const start = profile ? dash : '/register';

  return (
    <div className="lp">
      {/* HEADER */}
      <header className="lp-header">
        <div className="lp-header-in">
          <Logo />
          <nav className="lp-nav">
            <a href="#top" className="active">Home</a>
            <Link to="/services">Services <ChevronDown size={13} /></Link>
            <a href="#why">About</a>
            <a href="#how">How It Works</a>
            <a href="#testimonials">FAQs</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-actions">
            <button className="lp-toggle" onClick={toggle} aria-label="Toggle theme">
              <Sun size={15} className="sun" />
              <span className="track"><span className={`thumb ${dark ? 'on' : ''}`}><Moon size={10} /></span></span>
            </button>
            <Link to={profile ? dash : '/login'} className="lp-btn lp-btn-outline">{profile ? 'Dashboard' : 'Sign In'}</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero" id="top">
        <div className="lp-hero-text">
          <span className="lp-chip">Your One-Stop Academic Partner</span>
          <h1>Get Your Research<br />Done <em>Right &amp;<br />On Time</em></h1>
          <p>Connect with expert Nigerian writers for projects, data analysis, and more. From research proposals to NMCN CBT preparation — we've got you covered!</p>
          <div className="lp-hero-cta">
            <Link to="/topics" className="lp-btn lp-btn-gold lp-btn-lg">Browse Research Topics <ArrowRight size={16} /></Link>
          </div>
          <div className="lp-stats">
            <div><Users size={34} /><span><b>10K+</b>Happy Clients</span></div>
            <div><ShieldCheck size={34} /><span><b>98%</b>Success Rate</span></div>
            <div><Zap size={34} /><span><b>24/7</b>Support</span></div>
          </div>
        </div>
        <div className="lp-hero-img"><img src="/landing/hero.png" alt="Smiling student studying with a laptop" /></div>
      </section>

      {/* SERVICES */}
      <section className="lp-sec" id="services">
        <h2 className="lp-h2"><span className="bar" />Our Premium <em>Services</em></h2>
        <p className="lp-lead">Professional, reliable and affordable academic support.</p>
        <div className="lp-services">
          {SERVICES.map(s => (
            <div key={s.title} className="lp-service">
              <span className="ico"><s.icon size={34} strokeWidth={1.7} /></span>
              <span className="txt"><b>{s.title}</b><small>{s.desc}</small></span>
              <span className="go"><ArrowRight size={14} /></span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY + HOW */}
      <section className="lp-duo" id="why">
        <div className="lp-why">
          <h3>Why Choose <em>EliteCafe?</em></h3>
          <ul>{WHY.map(w => <li key={w}><CheckCircle2 size={24} fill="#F5B82E" color="#0B3D33" />{w}</li>)}</ul>
          <img src="/landing/cap-books.png" alt="" />
        </div>
        <div className="lp-how" id="how">
          <h3><span />How It Works<span /></h3>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.title}>
                <span className="n">{i + 1}</span>
                <span className="ic"><s.icon size={34} strokeWidth={1.6} /></span>
                <b>{s.title}</b><small>{s.desc}</small>
                {i < 2 && <ArrowRight className="arr" size={18} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section className="lp-portals">
        <div className="portal">
          <img src="/landing/laptop-client.png" alt="Client portal dashboard" />
          <div>
            <h4>Client Portal</h4>
            <ul>{['Track Orders & Progress', 'Make Payments', 'Download Final Files'].map(t => <li key={t}><CheckCircle2 size={17} fill="#0F5C4D" color="#fff" />{t}</li>)}</ul>
            <Link to={profile ? dash : '/login'} className="lp-btn lp-btn-gold lp-btn-sm">Access Portal <ArrowRight size={13} /></Link>
          </div>
        </div>
        <div className="portal">
          <img src="/landing/laptop-writer.png" alt="Writer workspace" />
          <div>
            <h4>Writer Workspace</h4>
            <ul>{['View Assigned Projects', 'Manage Wallet & Earnings', 'Communicate with Clients'].map(t => <li key={t}><CheckCircle2 size={17} fill="#0F5C4D" color="#fff" />{t}</li>)}</ul>
            <Link to={profile ? dash : '/login'} className="lp-btn lp-btn-gold lp-btn-sm">Start Working <ArrowRight size={13} /></Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-sec lp-tsec" id="testimonials">
        <h2 className="lp-h3"><span />What Our Clients Say<span /></h2>
        <div className="lp-reviews">
          {REVIEWS.map(r => (
            <figure key={r.name} className="review">
              <img src={`/landing/${r.img}.png`} alt={r.name} />
              <div>
                <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={15} fill="#F5B82E" color="#F5B82E" />)}</div>
                <blockquote>“{r.text}”</blockquote>
                <figcaption>— {r.name}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="lp-cta">
        <img src="/landing/cap-scroll.png" alt="" />
        <div>
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of students and researchers who trust EliteCafe.</p>
        </div>
        <Link to={start} className="lp-btn lp-btn-gold lp-btn-lg">Get Started Now <ArrowRight size={16} /></Link>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer" id="contact">
        <div className="lp-footer-in">
          <Logo />
          <nav>
            <a href="#top">Home</a><i />
            <Link to="/services">Services</Link><i />
            <a href="#why">About</a><i />
            <a href="#testimonials">FAQs</a><i />
            <a href="#contact">Contact</a>
          </nav>
          <div className="follow">
            <span>Follow Us:</span>
            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
            <a href="#" aria-label="X"><Twitter size={20} /></a>
            <a href="https://wa.me/2347054641287" aria-label="WhatsApp"><MessageCircle size={20} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
          </div>
        </div>
        <div className="lp-footer-base">
          <hr /><p>© {new Date().getFullYear()} EliteCafe. All rights reserved.</p><hr />
          <span className="secure"><Shield size={15} fill="#2BB673" color="#2BB673" /> Secure Payments Powered by Monnify</span>
        </div>
      </footer>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
.lp, .lp * { font-family: 'Poppins', system-ui, sans-serif !important; font-weight: 400; }
.lp b, .lp h1, .lp h2, .lp h3, .lp h4, .lp strong { font-weight: 700; }
.lp {
  --g900:#06342C; --g800:#0A4A3E; --g700:#0F5C4D; --g500:#16836D; --gold:#F5B82E; --gold2:#E9A60F;
  --ink:#10332C; --bg:#F6FAF8; --card:#fff; --line:#DCEBE6; --muted:#46635B;
  background: var(--bg); color: var(--ink); overflow-x: hidden;
}
[data-theme="dark"] .lp { --bg:#07130F; --card:#0E211B; --line:#1B3B31; --ink:#E6F5EF; --muted:#9CC2B6; }
.lp a { text-decoration: none; color: inherit; }
.lp em { font-style: normal; color: var(--gold); }
.lp img { display: block; max-width: 100%; }

/* buttons */
.lp-btn { display:inline-flex; align-items:center; gap:7px; border-radius:999px; font-weight:600; font-size:.85rem; padding:10px 20px; border:2px solid transparent; transition:.2s; cursor:pointer; white-space:nowrap; }
.lp-btn, .lp-btn * { font-weight:600 !important; }
.lp-btn-gold { background: linear-gradient(180deg,#FFC93C,#F0A810); color:#1B2B14; box-shadow:0 4px 12px rgba(240,168,16,.35); }
.lp-btn-gold:hover { transform:translateY(-1px); filter:brightness(1.05); }
.lp-btn-outline { background:transparent; border-color:var(--g800); color:var(--g800); }
[data-theme="dark"] .lp-btn-outline { border-color:#7FD1BA; color:#7FD1BA; }
.lp-btn-dark { background:rgba(4,40,32,.78); color:#fff; border-color:rgba(255,255,255,.55); }
.lp-btn-lg { padding:14px 26px; font-size:.98rem; }
.lp-btn-sm { padding:7px 16px; font-size:.78rem; }
.play { width:26px; height:26px; border-radius:50%; background:#fff; color:var(--g800); display:inline-flex; align-items:center; justify-content:center; }

/* header */
.lp-header { position:sticky; top:0; z-index:50; background:var(--card); border-bottom-left-radius:50% 22px; border-bottom-right-radius:50% 22px; box-shadow:0 6px 20px rgba(6,52,44,.10); }
.lp-header-in { max-width:1280px; margin:0 auto; padding:8px 26px 14px; display:flex; align-items:center; gap:22px; }
.lp-logo { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.lp-logo img { border-radius:8px; }
.lp-logo span { display:flex; flex-direction:column; line-height:1.05; }
.lp-logo b { font-size:1.75rem; font-weight:700; color:var(--g700); letter-spacing:-.5px; }
.lp-logo b i { font-style:normal; color:#13A58B; }
.lp-logo small { font-size:.62rem; color:var(--ink); letter-spacing:.3px; margin-top:2px; }
.lp-nav { display:flex; align-items:center; gap:6px; margin-left:8px; }
.lp-nav a { display:inline-flex; align-items:center; gap:3px; padding:8px 13px; border-radius:999px; font-size:.82rem; font-weight:500; color:var(--ink); }
.lp-nav a.active { background:var(--g700); color:#fff; padding:10px 20px; }
.lp-nav a:hover:not(.active) { color:var(--g500); }
.lp-actions { margin-left:auto; display:flex; align-items:center; gap:12px; }
.lp-toggle { display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--gold2); cursor:pointer; }
.lp-toggle .track { width:42px; height:22px; border-radius:999px; background:var(--g900); position:relative; display:block; }
.lp-toggle .thumb { position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; color:var(--g900); display:flex; align-items:center; justify-content:center; transition:.2s; }
.lp-toggle .thumb.on { left:22px; }
.lp-burger { display:none; background:none; border:none; color:var(--g800); cursor:pointer; }

/* hero */
.lp-hero { position:relative; margin-top:-30px; padding:96px 0 0; min-height:450px; color:#fff; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,520px); align-items:end;
  background: radial-gradient(120% 140% at 80% 40%, #0F6B58 0%, #0A4A3E 45%, #06342C 100%);
  border-bottom-left-radius:50% 60px; border-bottom-right-radius:50% 60px; overflow:hidden; }
.lp-hero-text { padding:0 0 46px max(26px, calc((100vw - 1280px)/2 + 26px)); position:relative; z-index:2; }
.lp-chip { display:inline-block; background:#52E0B5; color:#06342C; font-weight:600; font-size:.88rem; padding:6px 16px; border-radius:999px; margin-bottom:12px; }
.lp-hero h1 { font-size:clamp(2.2rem,4.6vw,3.35rem); line-height:1.05; font-weight:800; letter-spacing:-1px; margin-bottom:14px; }
.lp-hero h1 { color:#fff; }
.lp-hero h1, .lp-hero h1 em { font-weight:800; }
.lp-hero h1 em { color:var(--gold); }
.lp-hero p { max-width:380px; font-size:.95rem; line-height:1.4; margin-bottom:20px; color:#fff; }
.lp-hero-cta { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:26px; }
.lp-stats { display:flex; align-items:center; gap:0; flex-wrap:wrap; }
.lp-stats > div { display:flex; align-items:center; gap:9px; padding:0 22px; border-left:1px solid rgba(255,255,255,.28); color:var(--gold); }
.lp-stats > div:first-child { padding-left:0; border-left:0; color:#52E0B5; }
.lp-stats > div:nth-child(2) { color:#52E0B5; }
.lp-stats span { display:flex; flex-direction:column; color:#fff; font-size:.78rem; line-height:1.1; }
.lp-stats b { font-size:1.15rem; }
.lp-hero-img { position:relative; align-self:end; height:100%; }
.lp-hero-img img { height:100%; width:100%; object-fit:cover; object-position:left bottom; -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 22%); mask-image:linear-gradient(90deg,transparent 0,#000 22%); }

/* sections */
.lp-sec { max-width:1100px; margin:0 auto; padding:34px 18px 8px; text-align:center; }
.lp-h2 { font-size:1.95rem; font-weight:700; color:var(--g800); position:relative; padding-top:18px; letter-spacing:-.3px; }
[data-theme="dark"] .lp-h2 { color:#fff; }
.lp-h2 .bar { position:absolute; top:0; left:50%; width:64px; height:5px; margin-left:-32px; background:var(--g800); border-radius:3px; }
.lp-h2 em { color:#13A58B; }
.lp-lead { color:var(--ink); font-size:.98rem; margin:2px 0 12px; }
.lp-services { display:grid; grid-template-columns:repeat(3,1fr); gap:10px 14px; max-width:1000px; margin:0 auto; padding:0 6px; text-align:left; }
.lp-service { display:flex; align-items:center; gap:12px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 14px; box-shadow:0 3px 10px rgba(15,92,77,.08); transition:.2s; min-height:84px; cursor:default; pointer-events:none; user-select:none; }
.lp-service .ico { color:var(--g700); flex-shrink:0; width:56px; display:flex; justify-content:center; }
.lp-service .txt { flex:1; display:flex; flex-direction:column; line-height:1.2; }
.lp-service b { font-size:.9rem; color:var(--ink); }
.lp-service small { font-size:.75rem; color:var(--muted); margin-top:3px; }
.lp-service .go { width:26px; height:26px; border-radius:50%; background:var(--line); color:var(--g700); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* why + how */
.lp-duo { max-width:1000px; margin:22px auto 0; padding:0 8px; display:grid; grid-template-columns:1.12fr 1fr; gap:18px; }
.lp-why { position:relative; background:linear-gradient(135deg,#0A4A3E,#06342C); border-radius:18px; padding:26px 24px 22px; color:#fff; overflow:hidden; min-height:206px; }
.lp-why h3 { font-size:1.65rem; font-weight:700; margin-bottom:10px; }
.lp-why ul { list-style:none; display:flex; flex-direction:column; gap:7px; position:relative; z-index:2; }
.lp-why li { display:flex; align-items:center; gap:10px; font-size:.95rem; }
.lp-why img { position:absolute; right:-6px; bottom:0; width:240px; height:auto; z-index:1; mix-blend-mode:lighten; }
.lp-how { background:linear-gradient(180deg,#E3F5EF,#D3EFE6); border:1px solid #C5E6DB; border-radius:18px; padding:16px 12px; text-align:center; }
[data-theme="dark"] .lp-how { background:linear-gradient(180deg,#10302A,#0C241F); border-color:var(--line); }
.lp-how h3, .lp-h3 { display:flex; align-items:center; justify-content:center; gap:12px; font-size:1.55rem; font-weight:700; color:var(--g800); }
[data-theme="dark"] .lp-how h3, [data-theme="dark"] .lp-h3 { color:#fff; }
.lp-how h3 span, .lp-h3 span { width:46px; height:2px; background:var(--gold); display:block; }
.lp-how .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:12px; }
.step { position:relative; background:rgba(255,255,255,.7); border-radius:60px 60px 14px 14px; padding:10px 6px 12px; display:flex; flex-direction:column; align-items:center; gap:2px; }
[data-theme="dark"] .step { background:rgba(255,255,255,.05); }
.step .n { width:26px; height:26px; border-radius:50%; background:var(--g800); color:#fff; font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; border:2px solid #fff; }
.step .ic { color:var(--g700); margin:4px 0 2px; }
.step b { font-size:.8rem; line-height:1.15; color:var(--ink); }
.step small { font-size:.7rem; color:var(--muted); }
.step .arr { position:absolute; right:-14px; top:46%; color:var(--g500); z-index:2; }

/* portals */
.lp-portals { max-width:1000px; margin:18px auto 0; padding:0 8px; display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.portal { display:flex; align-items:center; gap:14px; background:linear-gradient(135deg,#E8F4F0,#DCEEE8); border:1px solid #CFE6DE; border-radius:16px; padding:12px 14px 12px 8px; }
[data-theme="dark"] .portal { background:linear-gradient(135deg,#10302A,#0C241F); border-color:var(--line); }
.portal img { width:48%; flex-shrink:0; border-radius:8px; }
.portal h4 { display:inline-block; background:var(--g800); color:#fff; font-size:1.05rem; padding:6px 22px; border-radius:12px 12px 0 0; margin:-12px 0 8px; }
.portal ul { list-style:none; display:flex; flex-direction:column; gap:5px; margin-bottom:10px; }
.portal li { display:flex; align-items:center; gap:7px; font-size:.82rem; color:var(--ink); }

/* testimonials */
.lp-tsec { padding-top:26px; }
.lp-reviews { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:12px; text-align:left; }
.review { display:flex; align-items:center; gap:12px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 14px; box-shadow:0 3px 10px rgba(15,92,77,.08); }
.review img { width:66px; height:66px; border-radius:50%; flex-shrink:0; }
.review .stars { display:flex; gap:2px; margin-bottom:3px; }
.review blockquote { font-size:.8rem; line-height:1.3; color:var(--ink); }
.review figcaption { font-size:.8rem; font-weight:600; color:var(--ink); margin-top:4px; }

/* CTA band */
.lp-cta { position:relative; margin-top:28px; background:linear-gradient(100deg,#06342C,#0A5546 60%,#0B6A57); display:flex; align-items:center; gap:24px; padding:34px max(26px, calc((100vw - 1100px)/2)) 40px; color:#fff; border-top-left-radius:50% 22px; border-top-right-radius:50% 22px; overflow:hidden; }
.lp-cta::after { content:''; position:absolute; left:-5%; right:-5%; bottom:-30px; height:60px; border-top:4px solid var(--gold); border-radius:50%; opacity:.9; }
.lp-cta img { width:170px; flex-shrink:0; mix-blend-mode:lighten; }
.lp-cta div { flex:1; }
.lp-cta h2 { font-size:1.7rem; font-weight:700; }
.lp-cta p { font-size:.98rem; }
.lp-cta .lp-btn { z-index:2; }

/* footer */
.lp-footer { background:linear-gradient(180deg,#0A4A3E,#06342C); color:#fff; padding:20px 26px 14px; }
.lp-footer-in { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.lp-footer .lp-logo b { color:#fff; } .lp-footer .lp-logo b i { color:#2FD2B0; } .lp-footer .lp-logo small { color:#fff; }
.lp-footer nav { display:flex; align-items:center; gap:14px; font-size:.82rem; font-weight:500; }
.lp-footer nav i { width:1px; height:14px; background:rgba(255,255,255,.4); }
.lp-footer .follow { display:flex; align-items:center; gap:10px; font-size:.82rem; }
.lp-footer .follow a { width:32px; height:32px; border-radius:50%; background:#fff; color:var(--g800); display:flex; align-items:center; justify-content:center; }
.lp-footer-base { max-width:1200px; margin:12px auto 0; display:flex; align-items:center; gap:14px; font-size:.8rem; position:relative; }
.lp-footer-base hr { flex:1; border:0; height:1px; background:rgba(255,255,255,.25); }
.lp-footer-base .secure { position:absolute; right:0; top:22px; display:flex; align-items:center; gap:5px; font-size:.72rem; }

@media (max-width: 960px) {
  .lp-nav { display:none; position:absolute; top:100%; left:0; right:0; background:var(--card); flex-direction:column; align-items:stretch; padding:10px 20px 16px; margin:0; box-shadow:0 12px 24px rgba(0,0,0,.12); }
  .lp-nav.open { display:flex; }
  .lp-burger { display:block; }
  .lp-toggle { display:none; }
  .lp-hero { grid-template-columns:1fr; padding-top:80px; }
  .lp-hero-text { padding:0 20px 20px; }
  .lp-hero-img { height:340px; }
  .lp-services, .lp-reviews { grid-template-columns:1fr; }
  .lp-duo, .lp-portals { grid-template-columns:1fr; }
  .lp-cta { flex-direction:column; text-align:center; }
  .lp-footer-in { justify-content:center; }
  .lp-footer-base .secure { position:static; }
  .lp-footer-base { flex-wrap:wrap; justify-content:center; }
}
@media (max-width: 520px) {
  .portal { flex-direction:column; align-items:flex-start; }
  .portal img { width:100%; }
  .lp-stats { flex-wrap:nowrap; }
  .lp-stats > div { padding:0 8px; gap:6px; }
  .lp-stats > div svg { width:24px; height:24px; }
  .lp-stats b { font-size:1rem; }
  .lp-stats span { font-size:.68rem; }
  .lp-logo b { font-size:1.4rem; }
  .lp-header-in { padding:8px 14px 14px; gap:10px; }
  .lp-actions .lp-btn-gold { padding:8px 14px; }
}
`;
