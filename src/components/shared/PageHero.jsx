// src/components/shared/PageHero.jsx — green hero banner shared by every public page
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function PageHero({ eyebrow = 'EliteCafe', title, accent, subtitle, back = true, Icon = BookOpen, image = true, children }) {
  const navigate = useNavigate();
  return (
    <section className="ph">
      {image && <div className="ph-img"><img src="/landing/topics-hero.png" alt="" /></div>}
      <div className="ph-in">
        {back && <button type="button" className="ph-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>}
        <div className="ph-eyebrow"><Icon size={24} strokeWidth={1.6} /><span>{eyebrow}</span><i /></div>
        <h1>{title}{accent && <> <em>{accent}</em></>}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
      <style>{`
        .ph { position:relative; padding:34px 0 56px; background:radial-gradient(120% 120% at 70% 20%,#0F6B58 0%,#0A4A3E 50%,#06342C 100%); border-bottom-left-radius:50% 36px; border-bottom-right-radius:50% 36px; overflow:hidden; color:#fff; margin-top:-26px; padding-top:60px; }
        .ph-img { position:absolute; right:0; top:0; bottom:0; width:min(52%,440px); pointer-events:none; }
        .ph-img img { width:100%; height:100%; object-fit:cover; object-position:left center; opacity:.85; -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%); mask-image:linear-gradient(90deg,transparent 0,#000 30%); }
        .ph-in { position:relative; z-index:2; max-width:1060px; margin:0 auto; padding:0 24px; }
        .ph-back { display:inline-flex; align-items:center; gap:8px; background:#E3F5EF; color:#0A4A3E; border:0; border-radius:999px; padding:8px 18px; font-size:.95rem; font-weight:700; cursor:pointer; margin-bottom:18px; font-family:inherit; }
        .ph-eyebrow { display:flex; align-items:center; gap:10px; color:#F5B82E; margin-bottom:2px; }
        .ph-eyebrow span { font-family:var(--font-display); font-weight:700; font-size:1rem; letter-spacing:3px; text-transform:uppercase; }
        .ph-eyebrow i { flex:0 0 70px; height:2px; background:#F5B82E; }
        .ph h1 { font-family:var(--font-display); font-weight:700; font-size:clamp(2.2rem,8vw,3.6rem); line-height:1.08; color:#fff; margin:0; }
        .ph h1 em { font-style:normal; color:#F5B82E; }
        .ph p { max-width:420px; font-size:1.08rem; line-height:1.4; margin:12px 0 0; color:#fff; font-weight:400; }
      `}</style>
    </section>
  );
}
