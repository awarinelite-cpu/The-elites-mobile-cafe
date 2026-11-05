// src/pages/TopicsPage.jsx — Browse Topics (matches design mockup)
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowLeft, ArrowRight, ChevronDown, LayoutGrid, Star, RotateCcw, Filter,
  FileText, Users, Eye, BookOpen, Menu, X, Stethoscope, ClipboardPlus, FlaskConical,
  HeartPulse, Baby, Brain, Pill, Microscope, Scale, GraduationCap, Cpu, Briefcase, Copy, Check,
} from 'lucide-react';
import { subscribeToTopics, subscribeToCaseStudies, createOrder } from '../firebase/orderService';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState } from '../components/shared/UI';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'All', 'Nursing Science', 'Public Health Nursing', 'Community Health Nursing', 'Midwifery',
  'Mental Health / Psychiatric Nursing', 'Medical Surgical Nursing', 'Maternal and Child Health',
  'Perioperative Nursing', 'Pediatric Nursing', 'Health Sciences', 'Public Health',
  'Medicine & Surgery', 'Pharmacology', 'Medical Laboratory Science', 'Nutrition & Dietetics',
  'Environmental Health', 'Technology', 'Business', 'Economics', 'Sociology', 'Psychology',
  'Education', 'Law', 'Other',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'a-z', label: 'A - Z' },
];

// accent = left border + badge colours, per category family
const THEMES = {
  gold:   { bar: '#0F8A6D', bg: '#FFE7A3', fg: '#5B3F00' },
  blue:   { bar: '#2E9BFF', bg: '#D6EBFF', fg: '#0B3C73' },
  purple: { bar: '#A58BFF', bg: '#E6DEFF', fg: '#3B1F8C' },
  green:  { bar: '#0F8A6D', bg: '#D3F3E8', fg: '#0B4A3C' },
  rose:   { bar: '#F07C9B', bg: '#FFE0E8', fg: '#7A1634' },
};
function styleFor(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('nursing') && !c.includes('public') && !c.includes('community')) return { t: THEMES.gold, Icon: Stethoscope };
  if (c.includes('public') || c.includes('community') || c.includes('environment')) return { t: THEMES.blue, Icon: ClipboardPlus };
  if (c.includes('patho') || c.includes('lab') || c.includes('medicine') || c.includes('health sci')) return { t: THEMES.purple, Icon: FlaskConical };
  if (c.includes('midwi') || c.includes('maternal') || c.includes('pediatric')) return { t: THEMES.rose, Icon: Baby };
  if (c.includes('mental') || c.includes('psych')) return { t: THEMES.purple, Icon: Brain };
  if (c.includes('pharma') || c.includes('nutri')) return { t: THEMES.green, Icon: Pill };
  if (c.includes('law') || c.includes('socio')) return { t: THEMES.blue, Icon: Scale };
  if (c.includes('tech')) return { t: THEMES.blue, Icon: Cpu };
  if (c.includes('business') || c.includes('econ')) return { t: THEMES.gold, Icon: Briefcase };
  if (c.includes('educ')) return { t: THEMES.green, Icon: GraduationCap };
  return { t: THEMES.green, Icon: HeartPulse };
}
const fmtViews = (n) => { n = Number(n); if (!n) return null; return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n); };

const VARIANTS = {
  research: {
    subscribe: subscribeToTopics,
    eyebrow: 'RESEARCH LIBRARY',
    title: 'Topics',
    sub: 'Choose from our curated collection of pre-researched topics.',
    noun: 'topics',
    search: 'Search by topic title, keywords, or department...',
    projectType: 'research',
    orderLabel: 'Order This Topic',
  },
  case: {
    subscribe: subscribeToCaseStudies,
    eyebrow: 'CASE STUDY LIBRARY',
    title: 'Case Study Topics',
    sub: 'Browse case study and care study topics ready for your next assignment.',
    noun: 'case studies',
    search: 'Search case study topics, keywords, or department...',
    projectType: 'case',
    orderLabel: 'Order This Case Study',
  },
};

export default function TopicsPage({ variant = 'research' }) {
  const V = VARIANTS[variant] || VARIANTS.research;
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const dash = profile?.isAdmin ? '/admin' : profile?.isWriter ? '/writer' : '/dashboard';

  useEffect(() => {
    setLoading(true);
    const unsub = V.subscribe(data => {
      setTopics(data.filter(t => t.available !== false && t.badge !== 'Hidden'));
      setLoading(false);
    });
    return unsub;
  }, [variant]);

  const filteredTopics = useMemo(() => {
    let result = [...topics];
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term));
    }
    if (department !== 'All') result = result.filter(t => t.category === department);
    switch (sortBy) {
      case 'a-z':        result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      default:           result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    return result;
  }, [topics, search, department, sortBy]);

  const handleOrder = async (topic) => {
    if (!user) { navigate('/register'); return; }
    try {
      await createOrder({
        clientId: user.uid,
        clientName: profile?.name || user.displayName,
        clientEmail: user.email,
        topicId: topic.id,
        topicTitle: topic.title,
        details: topic.description || '',
        pages: topic.pages || '',
        referredBy: profile?.referredBy || null,
        projectType: V.projectType,
      });
      toast.success('Order placed successfully! Awaiting quote from our team.');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  const reset = () => { setSearch(''); setDepartment('All'); setSortBy('newest'); };

  return (
    <div className="tp">
      {/* TOP BAR */}
      <header className="tp-bar">
        <Link to="/" className="tp-brand">
          <img src="/landing/cup-logo.png" alt="" width="46" height="46" />
          <span className="serif">Elite<i>Cafe</i></span>
        </Link>
        <div className="tp-bar-r">
          {profile && <Link to={dash} className="tp-gold">Dashboard</Link>}
          <button className="tp-burger" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={26} /></button>
        </div>
      </header>
      <div className={`tp-over ${menu ? 'show' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`tp-drawer ${menu ? 'open' : ''}`}>
        <button className="tp-x" onClick={() => setMenu(false)} aria-label="Close"><X size={22} /></button>
        <Link to="/" onClick={() => setMenu(false)}>Home</Link>
        <Link to="/topics" onClick={() => setMenu(false)}>Research Topics</Link>
        <Link to="/case-studies" onClick={() => setMenu(false)}>Case Study Topics</Link>
        <Link to="/services" onClick={() => setMenu(false)}>Services</Link>
        <Link to="/request" onClick={() => setMenu(false)}>Custom Request</Link>
        {profile ? <Link to={dash} onClick={() => setMenu(false)}>Dashboard</Link>
                 : <><Link to="/login" onClick={() => setMenu(false)}>Log In</Link><Link to="/register" onClick={() => setMenu(false)}>Get Started</Link></>}
      </aside>

      {/* HERO */}
      <section className="tp-hero">
        <div className="tp-hero-img"><img src="/landing/topics-hero.png" alt="" /></div>
        <div className="tp-hero-in">
          <button className="tp-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /> Back</button>
          <div className="tp-eyebrow"><BookOpen size={30} strokeWidth={1.6} /><span className="serif">{V.eyebrow}</span><i /></div>
          <h1 className="serif">Browse <em>{V.title}</em></h1>
          <p>{V.sub}</p>
        </div>
      </section>

      {/* SEARCH */}
      <form className="tp-search" onSubmit={e => e.preventDefault()}>
        <Search size={24} className="si" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={V.search} aria-label="Search topics" />
        <button type="submit"><Search size={22} /> Search</button>
      </form>

      {/* FILTERS */}
      <div className="tp-filters">
        <span className="lbl"><Filter size={24} fill="currentColor" /> Filter By:</span>
        <label className="sel">
          <LayoutGrid size={20} fill="currentColor" className="l" />
          <select value={department} onChange={e => setDepartment(e.target.value)} aria-label="Category">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Categories' : d}</option>)}
          </select>
          <ChevronDown size={20} className="r" />
        </label>
        <label className="sel">
          <Star size={20} fill="#F5B82E" color="#F5B82E" className="l" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={20} className="r" />
        </label>
        <button className="reset" onClick={reset}><RotateCcw size={18} /> Reset</button>
      </div>

      <div className="tp-count"><FileText size={20} />Showing {filteredTopics.length} of {topics.length} {V.noun}</div>

      {/* LIST */}
      <main className="tp-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, gridColumn: '1/-1' }}><Spinner size={40} /></div>
        ) : filteredTopics.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <EmptyState title={`No ${V.noun} found`} desc={search || department !== 'All' ? `No results for "${search || department}"` : `No ${V.noun} available yet.`} />
          </div>
        ) : filteredTopics.map(t => <TopicCard key={t.id} topic={t} onView={() => setSelected(t)} />)}
      </main>

      <section className="tp-custom">
        <div>
          <h3 className="serif">Don't see your perfect topic?</h3>
          <p>Submit a custom request — we'll research and write it specifically for you.</p>
        </div>
        <button onClick={() => navigate('/request')}>Request Custom Topic <ArrowRight size={16} /></button>
      </section>

      {/* FOOTER STRIP */}
      <footer className="tp-foot">
        <span className="ln" /><BookOpen size={34} color="#F5B82E" strokeWidth={1.6} />
        <em className="serif">Trusted Research Resources for Academic Excellence</em><span className="ln" />
      </footer>

      {/* DETAIL MODAL */}
      {selected && (
        <div className="tp-modal" onClick={() => setSelected(null)}>
          <div className="box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="tp-x dark" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>
            {selected.category && <span className="badge" style={{ background: styleFor(selected.category).t.bg, color: styleFor(selected.category).t.fg }}>{selected.category}</span>}
            <h3 className="serif">{selected.title}</h3>
            {selected.description && <p>{selected.description}</p>}
            {selected.pages && <div className="meta-line">{selected.pages} pages</div>}
            <button className="order" onClick={() => { const t = selected; setSelected(null); handleOrder(t); }}>
              {user ? V.orderLabel : 'Sign Up to Order'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function TopicCard({ topic, onView }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    await copyText(topic.title || '');
    setCopied(true);
    toast.success('Topic copied');
    setTimeout(() => setCopied(false), 1500);
  };
  const { t, Icon } = styleFor(topic.category);
  const views = fmtViews(topic.views);
  const rating = Number(topic.rating);
  return (
    <article className="card" style={{ '--bar': t.bar }}>
      <div className="ico"><Icon size={52} strokeWidth={1.7} /></div>
      <div className="body">
        {topic.category && <span className="badge" style={{ background: t.bg, color: t.fg }}>{topic.category}</span>}
        <h3 className="serif">{topic.title}</h3>
        <div className="meta">
          {topic.popular && <span><Users size={18} fill="currentColor" /> Popular</span>}
          {topic.popular && views && <i />}
          {views && <span><Eye size={18} /> {views} views</span>}
          {!topic.popular && !views && topic.pages && <span><FileText size={16} /> {topic.pages} pages</span>}
          <button type="button" className="copy-btn" onClick={handleCopy} aria-label="Copy research topic" title="Copy topic">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <div className="side">
        {rating > 0 && <span className="rate"><Star size={18} fill="#F5B82E" color="#F5B82E" /> {rating.toFixed(1)}</span>}
        <button onClick={onView}>View Topic <ArrowRight size={16} /></button>
      </div>
    </article>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Lato:wght@400;700&display=swap');
.tp, .tp * { font-family:'Lato',system-ui,sans-serif !important; font-weight:400; }
.tp .serif, .tp .serif * { font-family:'Playfair Display',Georgia,serif !important; font-weight:700; }
.tp b, .tp strong, .tp button, .tp .badge, .tp .lbl { font-weight:700; }
.tp { --g900:#06342C; --g800:#0A4A3E; --g700:#0F5C4D; --gold:#F5B82E; --bg:#F6FAF8; --card:#fff; --ink:#10332C; --line:#DCEBE6; --muted:#46635B; --panel:#DDF3EC;
  background:var(--bg); color:var(--ink); min-height:100vh; overflow-x:hidden; }
[data-theme="dark"] .tp { --bg:#07130F; --card:#0E211B; --ink:#E6F5EF; --line:#1B3B31; --muted:#9CC2B6; --panel:#10302A; }
.tp a { text-decoration:none; color:inherit; } .tp img { display:block; max-width:100%; }

.tp-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; background:linear-gradient(180deg,#0A4A3E,#06342C); border-bottom-left-radius:26px; border-bottom-right-radius:26px; position:relative; z-index:5; box-shadow:0 6px 18px rgba(0,0,0,.2); }
.tp-brand { display:flex; align-items:center; gap:14px; }
.tp-brand img { border-radius:50%; }
.tp-brand span { font-size:2rem; color:#fff; letter-spacing:-.3px; } .tp-brand i { font-style:normal; color:var(--gold); }
.tp-bar-r { display:flex; align-items:center; gap:18px; }
.tp-gold { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(180deg,#FFC93C,#F0A810); color:#1B2B14; font-weight:700; font-size:1.05rem; padding:12px 24px; border-radius:999px; box-shadow:0 4px 12px rgba(240,168,16,.4); }
.tp-burger { background:none; border:0; color:#fff; cursor:pointer; padding:4px; }
.tp-over { position:fixed; inset:0; background:rgba(5,15,12,.55); opacity:0; pointer-events:none; transition:.25s; z-index:40; }
.tp-over.show { opacity:1; pointer-events:auto; }
.tp-drawer { position:fixed; top:0; right:0; width:260px; height:100%; background:var(--g900); padding:64px 20px 20px; display:flex; flex-direction:column; gap:4px; transform:translateX(100%); transition:.28s; z-index:50; }
.tp-drawer.open { transform:none; }
.tp-drawer a { color:#fff; padding:12px; border-radius:10px; font-size:1rem; font-weight:600; }
.tp-drawer a:hover { background:rgba(255,255,255,.08); }
.tp-x { position:absolute; top:16px; right:16px; background:none; border:0; color:#fff; cursor:pointer; }
.tp-x.dark { color:var(--ink); }

.tp-hero { position:relative; margin-top:-26px; padding:62px 0 44px; background:radial-gradient(120% 120% at 70% 20%,#0F6B58 0%,#0A4A3E 50%,#06342C 100%); border-bottom-left-radius:50% 40px; border-bottom-right-radius:50% 40px; overflow:hidden; color:#fff; }
.tp-hero-img { position:absolute; right:0; top:0; bottom:0; width:min(56%,520px); }
.tp-hero-img img { width:100%; height:100%; object-fit:cover; object-position:left center; -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 28%); mask-image:linear-gradient(90deg,transparent 0,#000 28%); }
.tp-hero-in { position:relative; z-index:2; max-width:1100px; margin:0 auto; padding:0 24px; }
.tp-back { display:inline-flex; align-items:center; gap:10px; background:#E3F5EF; color:var(--g800); border:0; border-radius:999px; padding:10px 22px; font-size:1.05rem; font-weight:700; cursor:pointer; margin-bottom:26px; }
.tp-eyebrow { display:flex; align-items:center; gap:12px; color:var(--gold); margin-bottom:2px; }
.tp-eyebrow span { font-size:1.15rem; letter-spacing:3px; }
.tp-eyebrow i { flex:0 0 90px; height:2px; background:var(--gold); }
.tp-hero h1 { font-size:clamp(2.6rem,9vw,4.2rem); line-height:1.05; color:#fff; font-weight:700; }
.tp-hero h1 em { font-style:normal; color:var(--gold); }
.tp-hero p { max-width:330px; font-size:1.25rem; line-height:1.3; margin-top:12px; color:#fff; }

.tp-search { position:relative; z-index:3; display:flex; align-items:center; gap:10px; max-width:1060px; margin:-34px auto 0; width:calc(100% - 32px); background:var(--card); border:3px solid #CDEBE2; border-radius:999px; padding:7px 7px 7px 20px; box-shadow:0 10px 26px rgba(15,92,77,.18); }
.tp-search .si { color:var(--g800); flex-shrink:0; }
.tp-search input { flex:1; min-width:0; border:0; outline:0; background:transparent; font-size:1.05rem; color:var(--ink); padding:12px 4px; }
.tp-search input::placeholder { color:#6D8179; }
.tp-search button { display:inline-flex; align-items:center; gap:10px; background:var(--g800); color:#fff; border:0; border-radius:999px; padding:15px 28px; font-size:1.15rem; cursor:pointer; }

.tp-filters { max-width:1060px; margin:20px auto 0; width:calc(100% - 32px); background:var(--panel); border:1px solid #C9E8DE; border-radius:20px; padding:12px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.tp-filters .lbl { display:flex; align-items:center; gap:10px; color:var(--g800); font-size:1.15rem; }
[data-theme="dark"] .tp-filters .lbl { color:#7FD1BA; }
.tp-filters .sel { position:relative; display:flex; align-items:center; background:var(--card); border:1.5px solid #BFE2D6; border-radius:999px; flex:1 1 180px; color:var(--g800); }
.tp-filters .sel select { appearance:none; -webkit-appearance:none; width:100%; background:transparent; border:0; outline:0; color:var(--ink); font-size:1.05rem; font-weight:700; padding:12px 40px 12px 46px; cursor:pointer; text-overflow:ellipsis; }
.tp-filters .sel .l { position:absolute; left:16px; pointer-events:none; } .tp-filters .sel .r { position:absolute; right:14px; pointer-events:none; }
.tp-filters .reset { display:inline-flex; align-items:center; gap:8px; background:transparent; border:1.5px solid var(--g800); color:var(--g800); border-radius:999px; padding:11px 22px; font-size:1.05rem; cursor:pointer; }
[data-theme="dark"] .tp-filters .reset { color:#7FD1BA; border-color:#7FD1BA; }

.tp-count { display:inline-flex; align-items:center; gap:10px; background:var(--g800); color:#fff; border-radius:999px; padding:12px 24px; font-size:1.05rem; font-weight:700; margin:18px 0 0 max(16px,calc((100% - 1060px)/2)); }

.tp-list { max-width:1060px; margin:14px auto 0; padding:0 16px; display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,460px),1fr)); gap:16px; }
.card { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:16px; align-items:center; background:var(--card); border:1px solid var(--line); border-left:6px solid var(--bar); border-radius:16px; padding:16px 16px 16px 14px; box-shadow:0 4px 14px rgba(15,92,77,.10); }
.card .ico { width:92px; height:92px; border-radius:16px; background:#CFF1E6; color:var(--g800); display:flex; align-items:center; justify-content:center; }
.badge { display:inline-block; font-size:.78rem; font-weight:700; text-transform:uppercase; padding:4px 11px; border-radius:8px; margin-bottom:4px; }
.card h3 { font-size:1.12rem; line-height:1.22; color:var(--ink); }
.card .meta { display:flex; align-items:center; gap:10px; margin-top:8px; font-size:.9rem; font-weight:700; color:#33504A; flex-wrap:wrap; }
.card .meta span { display:inline-flex; align-items:center; gap:6px; } .card .meta i { width:1px; height:16px; background:#9AB5AC; }
.card .side { align-self:stretch; display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; gap:10px; }
.card .meta .copy-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; padding:0; margin-left:4px; background:#DDF3EC; color:var(--g800); border:1px solid #BFE2D6; border-radius:8px; cursor:pointer; box-shadow:none; }
.card .meta .copy-btn:hover { background:#CFF1E6; }
[data-theme="dark"] .card .meta .copy-btn { background:#10302A; color:#7FD1BA; border-color:var(--line); }
.card .rate { display:inline-flex; align-items:center; gap:6px; background:#DDF3EC; color:var(--g800); font-weight:700; padding:6px 14px; border-radius:999px; }
.card .side button { display:inline-flex; align-items:center; gap:8px; margin-top:auto; background:var(--g800); color:#fff; border:0; border-radius:999px; padding:12px 20px; font-size:1rem; cursor:pointer; box-shadow:0 4px 10px rgba(6,52,44,.3); white-space:nowrap; }
.card .side button:hover { background:var(--g700); }

.tp-custom { max-width:1060px; margin:28px auto 0; width:calc(100% - 32px); background:linear-gradient(135deg,#E3F5EF,#D3EFE6); border:1px solid #C5E6DB; border-radius:18px; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
[data-theme="dark"] .tp-custom { background:#10302A; border-color:var(--line); }
.tp-custom h3 { font-size:1.2rem; color:var(--ink); } .tp-custom p { font-size:.95rem; color:var(--muted); margin-top:4px; }
.tp-custom button { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(180deg,#FFC93C,#F0A810); color:#1B2B14; border:0; border-radius:999px; padding:12px 24px; font-size:.95rem; cursor:pointer; }

.tp-foot { margin-top:34px; display:flex; align-items:center; gap:14px; padding:34px 20px 30px; background:linear-gradient(180deg,#0A4A3E,#06342C); border-top-left-radius:50% 28px; border-top-right-radius:50% 28px; border-top:4px solid #16836D; color:#fff; justify-content:center; }
.tp-foot .ln { flex:1; max-width:110px; height:2px; background:var(--gold); }
.tp-foot em { font-style:italic; font-size:1.2rem; font-weight:400; text-align:center; }

.tp-modal { position:fixed; inset:0; background:rgba(5,15,12,.6); z-index:60; display:flex; align-items:center; justify-content:center; padding:16px; }
.tp-modal .box { position:relative; background:var(--card); color:var(--ink); border-radius:20px; max-width:520px; width:100%; max-height:86vh; overflow:auto; padding:28px 24px 24px; }
.tp-modal h3 { font-size:1.4rem; line-height:1.25; margin:6px 0 10px; }
.tp-modal p { line-height:1.65; color:var(--muted); margin-bottom:10px; }
.tp-modal .meta-line { font-weight:700; margin-bottom:14px; }
.tp-modal .order { display:inline-flex; align-items:center; gap:8px; background:var(--g800); color:#fff; border:0; border-radius:999px; padding:13px 26px; font-size:1rem; cursor:pointer; }

@media (max-width:520px) {
  .tp-brand span { font-size:1.7rem; } .tp-brand img { width:40px; height:40px; }
  .tp-gold { padding:10px 18px; font-size:.95rem; }
  .card { grid-template-columns:auto minmax(0,1fr); }
  .card .ico { width:68px; height:68px; } .card .ico svg { width:38px; height:38px; }
  .card .side { grid-column:1 / -1; flex-direction:row; align-items:center; justify-content:space-between; }
  .card .side button { margin-top:0; margin-left:auto; }
  .tp-hero-img { width:62%; opacity:.9; }
  .tp-search button { padding:13px 18px; } .tp-search button svg { display:none; }
}
`;
