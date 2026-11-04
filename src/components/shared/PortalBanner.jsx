// src/components/shared/PortalBanner.jsx — compact green banner for dashboard-style pages
import { BookOpen } from 'lucide-react';

export default function PortalBanner({ eyebrow, title, subtitle }) {
  return (
    <div className="pb">
      <div className="pb-img"><img src="/landing/topics-hero.png" alt="" /></div>
      <div className="pb-in">
        <div className="pb-eyebrow"><BookOpen size={18} strokeWidth={1.8} /><span>{eyebrow}</span><i /></div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <style>{`
        .pb { position:relative; overflow:hidden; margin-bottom:22px; padding:22px 22px 24px; border-radius:22px 22px 44px 44px / 22px 22px 28px 28px; background:radial-gradient(120% 140% at 70% 10%,#0F6B58 0%,#0A4A3E 50%,#06342C 100%); color:#fff; box-shadow:0 10px 26px rgba(6,52,44,.18); }
        .pb-img { position:absolute; right:0; top:0; bottom:0; width:min(48%,320px); pointer-events:none; }
        .pb-img img { width:100%; height:100%; object-fit:cover; object-position:left center; opacity:.8; -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 35%); mask-image:linear-gradient(90deg,transparent 0,#000 35%); }
        .pb-in { position:relative; z-index:2; }
        .pb-eyebrow { display:flex; align-items:center; gap:8px; color:#F5B82E; }
        .pb-eyebrow span { font-family:var(--font-display); font-weight:700; font-size:.78rem; letter-spacing:2.5px; text-transform:uppercase; }
        .pb-eyebrow i { flex:0 0 46px; height:2px; background:#F5B82E; }
        .pb h1 { font-family:var(--font-display); font-weight:700; font-size:clamp(1.5rem,5vw,2.2rem); line-height:1.12; color:#fff; margin:6px 0 0; }
        .pb p { max-width:340px; margin:6px 0 0; font-size:.9rem; line-height:1.4; color:rgba(255,255,255,.9); font-weight:400; }
      `}</style>
    </div>
  );
}
