// src/pages/AdminCaseStudies.jsx
// Admin page for uploading and managing Case / Care Study topics.
// Mirrors the Research Topics admin tab (same look, same tools) but stores
// everything in the separate `caseStudyTopics` Firestore collection.
import { useState, useEffect } from 'react';
import {
  Search, BookOpen, GraduationCap, FileText, ChevronRight, FolderUp,
  ClipboardList, Plus, Trash2, Star, LayoutGrid,
} from 'lucide-react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { CATEGORIES } from './adminConstants';

const COLL = 'caseStudyTopics';
const BADGES = ['Popular', 'New', 'Hidden'];

const s = {
  card:  { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: 20, marginBottom: 16 },
  btn:   (bg, color = '#fff') => ({ background: bg, color, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }),
  input: { width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
  lbl:   { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
};

const blank = () => ({ title: '', category: 'Nursing Science', pages: '', price: '', description: '', badge: '' });

// ── Parse one pasted / uploaded line into a topic ────────────────────────
function parseLine(rawLine) {
  const line = rawLine.trim();
  if (!line) return null;
  let parts = null;
  if (line.includes('\t')) parts = line.split('\t');
  else if (line.includes('|')) parts = line.split('|');
  else {
    const c = line.split(',').map(p => p.trim());
    // CSV only when it clearly looks like Title, Category, Pages, Price ...
    if (c.length >= 4 && /^\d{1,3}$/.test(c[2]) && /^(₦|N)?\s?[\d,]+$/i.test(c[3].replace(/^"|"$/g, '')) && !/pages?/i.test(line)) parts = c;
  }
  if (parts) {
    const c = parts.map(p => p.trim().replace(/^"|"$/g, ''));
    if (!c[0]) return null;
    return {
      title: c[0], category: c[1] || 'Nursing Science', pages: c[2] || '',
      price: c[3] || '', description: c[4] || '', badge: BADGES.includes(c[5]) ? c[5] : '',
    };
  }
  // Freeform: pull price, pages, category, badge out of the sentence
  let text = line.replace(/^\s*(\d+[.)]|[-•*])\s+/, '');
  let price = '', pages = '', category = '', badge = '';
  const pm = text.match(/(₦|N)\s?([\d,]{3,})/i);
  if (pm) { price = '₦' + pm[2]; text = text.replace(pm[0], ' '); }
  const gm = text.match(/(\d{1,3})\s*pages?/i);
  if (gm) { pages = gm[1]; text = text.replace(gm[0], ' '); }
  const lower = text.toLowerCase();
  const found = [...CATEGORIES].sort((a, b) => b.length - a.length).find(c => c !== 'Other' && lower.includes(c.toLowerCase()) && /[—–,(|-]/.test(text));
  if (found) {
    category = found;
    text = text.replace(new RegExp('[—–,(|-]?\\s*' + found.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&') + '\\s*\\)?', 'i'), ' ');
  }
  const title = text.replace(/[\s,;—–-]+$/g, '').replace(/\s{2,}/g, ' ').replace(/[(),]+\s*$/, '').trim();
  if (!title) return null;
  return { title, category: category || 'Nursing Science', pages, price, description: '', badge };
}

export default function AdminCaseStudies() {
  const [items, setItems]           = useState([]);
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('all');
  const [selected, setSelected]     = useState(new Set());
  const [form, setForm]             = useState(null);
  const [bulkMode, setBulkMode]     = useState(false);
  const [pasteMode, setPasteMode]   = useState(false);
  const [pasteText, setPasteText]   = useState('');
  const [parsed, setParsed]         = useState([]);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const q = query(collection(db, COLL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => showToast('❌ ' + err.message));
  }, []);

  // ── CRUD ────────────────────────────────────────────────
  const save = async (data) => {
    if (!String(data.title || '').trim()) { showToast('⚠️ Please enter a title'); return; }
    setSaving(true);
    try {
      if (data.id) {
        const { id, createdAt, ...rest } = data;
        await updateDoc(doc(db, COLL, id), { ...rest, updatedAt: serverTimestamp() });
        showToast('✅ Case study updated');
      } else {
        await addDoc(collection(db, COLL), { ...data, createdAt: serverTimestamp() });
        showToast('✅ Case study added');
      }
      setForm(null);
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  const removeMany = async (ids) => {
    setSaving(true);
    try {
      for (let i = 0; i < ids.length; i += 400) {
        const batch = writeBatch(db);
        ids.slice(i, i + 400).forEach(id => batch.delete(doc(db, COLL, id)));
        await batch.commit();
      }
      showToast(`🗑️ Deleted ${ids.length} case stud${ids.length === 1 ? 'y' : 'ies'}`);
      setSelected(new Set());
    } catch (e) { showToast('❌ ' + e.message); }
    setSaving(false);
  };

  const deleteSelected = () => {
    if (selected.size && window.confirm(`Delete ${selected.size} selected case stud${selected.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) removeMany([...selected]);
  };
  const deleteAll = () => {
    if (window.confirm(`Delete ALL ${items.length} case studies? This cannot be undone.`)) removeMany(items.map(t => t.id));
  };

  const uploadParsed = async () => {
    const rows = parsed.filter(r => String(r.title || '').trim());
    if (!rows.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < rows.length; i += 400) {
        const batch = writeBatch(db);
        rows.slice(i, i + 400).forEach(r => batch.set(doc(collection(db, COLL)), { ...r, createdAt: serverTimestamp() }));
        await batch.commit();
      }
      showToast(`✅ ${rows.length} case studies uploaded`);
      setParsed([]); setPasteText(''); setPasteMode(false); setBulkMode(false);
    } catch (e) { showToast('❌ ' + e.message); }
    setUploading(false);
  };

  // ── Bulk file / paste parsing ───────────────────────────
  const parseText = (raw) => {
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    if (lines.length && /title|topic/.test(lines[0].toLowerCase()) && /(category|price|pages)/.test(lines[0].toLowerCase())) lines.shift();
    const rows = lines.map(parseLine).filter(Boolean);
    setParsed(rows);
    showToast(rows.length ? `✅ Parsed ${rows.length} case studies. Review and upload.` : '⚠️ No case studies found. One per line please.');
  };

  const parseFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt'].includes(ext)) { showToast('⚠️ Please upload a .csv or .txt file.'); return; }
    parseText(await file.text());
  };

  const downloadTemplate = () => {
    const csv = [
      'Title,Category,Pages,Price,Description,Badge',
      '"Nursing care of a patient with severe malaria: a case study","Nursing Science",35,10000,"Case study covering assessment, diagnosis, care plan and evaluation.","Popular"',
      '"Care study of a pregnant woman with pre-eclampsia","Midwifery",30,10000,"Antenatal care study with nursing process.",""',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'case-studies-template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const patchRow = (i, patch) => setParsed(p => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // ── Derived list ────────────────────────────────────────
  const q = search.trim().toLowerCase();
  let list = items.filter(t => !q || [t.title, t.category, t.description].some(v => String(v || '').toLowerCase().includes(q)));
  if (view === 'popular') list = list.filter(t => t.badge === 'Popular');
  if (view === 'pages') list = [...list].sort((x, y) => (parseInt(y.pages) || 0) - (parseInt(x.pages) || 0));
  if (view === 'category') list = [...list].sort((x, y) => String(x.category || '').localeCompare(String(y.category || '')));
  const toggle = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const tabs = [
    { k: 'all', label: `All Case Studies (${items.length})`, icon: <FileText size={20} /> },
    { k: 'popular', label: 'Popular', icon: <Star size={20} fill="#F5B82E" color="#F5B82E" /> },
    { k: 'category', label: 'By Category', icon: <LayoutGrid size={20} /> },
    { k: 'pages', label: 'By Pages', icon: <FileText size={20} /> },
  ];
  let lastCat = null;

  return (
    <div>
      <style>{`
        .tp-search { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--border); border-radius:18px; padding:6px 6px 6px 16px; box-shadow:0 4px 14px rgba(6,52,44,.08); margin-bottom:16px; }
        .tp-search input { flex:1; min-width:0; border:none; outline:none; background:transparent; font-size:.95rem; color:var(--text-primary); font-family:var(--font-body); }
        .tp-search button { display:flex; align-items:center; gap:8px; border:none; cursor:pointer; color:#fff; font-weight:700; font-size:.95rem; padding:11px 20px; border-radius:14px; background:linear-gradient(135deg,#0F6B58,#06342C); font-family:var(--font-body); }
        .tp-actions { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; }
        .tp-act { display:flex; align-items:center; gap:12px; text-align:left; border:none; cursor:pointer; padding:14px 16px; border-radius:18px; font-family:var(--font-body); box-shadow:0 6px 16px rgba(6,52,44,.14); min-width:0; }
        .tp-act b { display:block; font-size:1.02rem; font-weight:800; line-height:1.15; }
        .tp-act small { display:block; font-size:.78rem; opacity:.9; margin-top:2px; }
        .tp-act:disabled { opacity:.6; cursor:not-allowed; }
        .tp-act.bulk { background:linear-gradient(135deg,#0F5C4D,#06342C); color:#fff; }
        .tp-act.paste { background:linear-gradient(135deg,#8B5CF6,#4F46E5); color:#fff; }
        .tp-act.add { background:#C9F0DE; color:#06342C; }
        .tp-act.del { background:linear-gradient(135deg,#F87171,#DC2626); color:#fff; }
        .tp-ico { flex:0 0 auto; width:38px; height:38px; display:flex; align-items:center; justify-content:center; }
        .tp-ico.circ { border-radius:50%; background:#06342C; color:#fff; width:34px; height:34px; }
        .tp-card { background:#fff; border:1px solid var(--border); border-radius:22px; box-shadow:0 6px 20px rgba(6,52,44,.08); overflow:hidden; }
        .tp-tabs { display:flex; overflow-x:auto; border-bottom:1px solid var(--border); scrollbar-width:none; }
        .tp-tabs::-webkit-scrollbar { display:none; }
        .tp-tab { flex:1 0 auto; display:flex; align-items:center; justify-content:center; gap:7px; padding:15px 14px; border:none; background:none; cursor:pointer; font-weight:600; font-size:.92rem; color:var(--text-secondary); white-space:nowrap; border-bottom:3px solid transparent; font-family:var(--font-body); }
        .tp-tab.on { color:#06342C; font-weight:800; border-bottom-color:#0F5C4D; }
        .tp-row { display:flex; align-items:center; gap:12px; padding:14px 14px; border-bottom:1px solid var(--border); }
        .tp-row:last-child { border-bottom:none; }
        .tp-row.sel { background:rgba(239,68,68,.06); }
        .tp-row.hid { opacity:.5; }
        .tp-chk { width:20px; height:20px; flex:0 0 auto; cursor:pointer; accent-color:#EF4444; }
        .tp-book { flex:0 0 auto; width:54px; height:54px; border-radius:50%; background:#D5F2E4; color:#0F5C4D; display:flex; align-items:center; justify-content:center; }
        .tp-mid { flex:1; min-width:0; }
        .tp-title { font-weight:800; font-size:1rem; line-height:1.25; color:#06342C; word-break:break-word; }
        .tp-chip { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:3px 10px; border-radius:999px; background:#E3F4EC; color:#0F5C4D; font-size:.74rem; font-weight:700; }
        .tp-badge { margin-left:6px; font-size:.7rem; font-weight:800; padding:2px 8px; border-radius:999px; background:#FEF3C7; color:#92400E; }
        .tp-pages { flex:0 0 auto; display:flex; align-items:center; gap:7px; background:#D5F2E4; color:#0F5C4D; border-radius:14px; padding:8px 12px; }
        .tp-pages small { display:block; font-size:.74rem; font-weight:600; line-height:1; }
        .tp-pages b { display:block; font-size:1.2rem; font-weight:800; line-height:1.1; }
        .tp-go { flex:0 0 auto; width:38px; height:38px; border-radius:50%; border:none; background:#D5F2E4; color:#06342C; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .tp-group { padding:8px 16px; font-size:.72rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#0F5C4D; background:#F1F8F5; }
        .tp-empty { text-align:center; padding:40px 16px; color:var(--text-muted); }
        .cs-toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:#06342C; color:#fff; padding:11px 20px; border-radius:999px; font-size:.88rem; font-weight:600; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,.25); max-width:90vw; }
        @media (max-width:420px) { .tp-pages small { display:none; } .tp-book { width:44px; height:44px; } .tp-act b { font-size:.92rem; } }
      `}</style>

      {toast && <div className="cs-toast">{toast}</div>}

      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{selected.size} selected</span>
          <button style={s.btn('#EF4444')} onClick={deleteSelected} disabled={saving}>🗑️ Delete Selected ({selected.size})</button>
          <button style={s.btn('#6B7280')} onClick={() => setSelected(new Set())}>✕ Clear</button>
        </div>
      )}

      <div className="tp-search">
        <Search size={20} color="#06342C" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a case study, category or keyword…" />
        <button type="button" onClick={() => {}}><Search size={18} /> Search</button>
      </div>

      <div className="tp-actions">
        <button className="tp-act bulk" onClick={() => { setBulkMode(true); setPasteMode(false); setForm(null); setParsed([]); }}>
          <span className="tp-ico"><FolderUp size={32} color="#F5B82E" /></span>
          <span><b>Bulk Upload</b><small>Upload multiple case studies</small></span>
        </button>
        <button className="tp-act paste" onClick={() => { setPasteMode(p => !p); setBulkMode(false); setForm(null); setParsed([]); }}>
          <span className="tp-ico"><ClipboardList size={32} /></span>
          <span><b>Paste Topics</b><small>Paste from text</small></span>
        </button>
        <button className="tp-act add" onClick={() => { setForm(blank()); setBulkMode(false); setPasteMode(false); setParsed([]); }}>
          <span className="tp-ico circ"><Plus size={20} /></span>
          <span><b>Add New Case Study</b><small>Create a new topic</small></span>
        </button>
        {items.length > 0 && (
          <button className="tp-act del" onClick={deleteAll} disabled={saving}>
            <span className="tp-ico"><Trash2 size={30} /></span>
            <span><b>Delete All ({items.length})</b><small>Remove all case studies</small></span>
          </button>
        )}
      </div>

      {/* ── Paste panel ── */}
      {pasteMode && parsed.length === 0 && (
        <div style={{ ...s.card, border: '2px solid #7C3AED' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#7C3AED', margin: 0 }}>📋 Paste Case Study Topics</h3>
            <button style={s.btn('#94A3B8')} onClick={() => { setPasteMode(false); setPasteText(''); }}>✕ Close</button>
          </div>
          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            One case study per line. Use <strong>Title | Category | Pages | Price | Description | Badge</strong> (pipe, tab or comma separated), or just type freely
            such as <em>"Care study of a patient with stroke, Nursing Science, 30 pages, ₦10,000"</em> and the category, pages and price are picked out automatically.
          </div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={12}
            placeholder={'Nursing care of a patient with severe malaria | Nursing Science | 35 | ₦10,000 | | Popular\nCare study of a pregnant woman with pre-eclampsia | Midwifery | 30 | ₦10,000\n1. Case study on diabetic foot ulcer, Nursing Science, 28 pages, ₦8,000'}
            style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => parseText(pasteText)} disabled={!pasteText.trim()}
              style={{ ...s.btn('#7C3AED'), flex: 1, padding: 11, fontSize: 14, opacity: pasteText.trim() ? 1 : 0.5 }}>⚡ Parse Topics</button>
            <button onClick={() => setPasteText('')} style={{ ...s.btn('var(--bg-tertiary)', 'var(--text-muted)'), border: '1px solid var(--border)', padding: '11px 18px' }}>Clear</button>
          </div>
        </div>
      )}

      {/* ── Bulk file panel ── */}
      {bulkMode && parsed.length === 0 && (
        <div style={{ ...s.card, border: '2px solid var(--teal)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)', margin: 0 }}>📤 Bulk Upload Case Studies</h3>
            <button style={s.btn('#94A3B8')} onClick={() => setBulkMode(false)}>✕ Close</button>
          </div>
          <button onClick={downloadTemplate} style={{ ...s.btn('#16836D'), width: '100%', marginBottom: 16, padding: 10 }}>⬇️ Download CSV Template</button>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px', cursor: 'pointer', background: 'var(--bg-secondary)', gap: 8 }}>
            <span style={{ fontSize: '2.5rem' }}>📁</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>Tap to choose a file</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>.csv or .txt</span>
            <input type="file" accept=".csv,.txt" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]); e.target.value = ''; }} />
          </label>
        </div>
      )}

      {/* ── Review parsed rows (shared by paste and bulk) ── */}
      {parsed.length > 0 && (
        <div style={{ ...s.card, border: '2px solid #7C3AED' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{parsed.length} case studies ready to upload</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...s.btn('var(--bg-tertiary)', 'var(--text-muted)'), border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12 }} onClick={() => setParsed([])}>← Back</button>
              <button style={{ ...s.btn('#EF4444'), padding: '6px 12px', fontSize: 12 }} onClick={() => { if (window.confirm('Remove all parsed rows?')) { setParsed([]); } }}>🗑️ Clear</button>
            </div>
          </div>
          <div style={{ maxHeight: 380, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
              <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                <tr>{['#', 'Title', 'Category', 'Pages', 'Price', 'Badge', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                    <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px', minWidth: 220 }}>
                      <input value={r.title} onChange={e => patchRow(i, { title: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, width: '100%', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }} />
                    </td>
                    <td style={{ padding: '6px 10px', minWidth: 140 }}>
                      <select value={r.category} onChange={e => patchRow(i, { category: e.target.value })}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px', width: '100%' }}>
                        {(CATEGORIES.includes(r.category) ? CATEGORIES : [r.category, ...CATEGORIES]).map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px', width: 70 }}>
                      <input value={r.pages} onChange={e => patchRow(i, { pages: e.target.value })} placeholder="30"
                        style={{ background: 'transparent', border: 'none', width: 50, fontSize: 12, outline: 'none', color: 'var(--text-secondary)' }} />
                    </td>
                    <td style={{ padding: '6px 10px', width: 90 }}>
                      <input value={r.price} onChange={e => patchRow(i, { price: e.target.value })} placeholder="₦10,000"
                        style={{ background: 'transparent', border: 'none', width: 78, fontSize: 12, outline: 'none', color: 'var(--gold)', fontWeight: 700 }} />
                    </td>
                    <td style={{ padding: '6px 10px', width: 110 }}>
                      <select value={r.badge} onChange={e => patchRow(i, { badge: e.target.value })}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, borderRadius: 4, padding: '3px 6px' }}>
                        <option value="">None</option><option value="Popular">🔥 Popular</option><option value="New">✨ New</option><option value="Hidden">🚫 Hidden</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px', width: 36 }}>
                      <button onClick={() => setParsed(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={uploadParsed} disabled={uploading}
            style={{ ...s.btn('var(--teal)'), width: '100%', marginTop: 14, padding: 12, fontSize: 14 }}>
            {uploading ? `Uploading... (${parsed.length})` : `🚀 Upload All ${parsed.length} Case Studies`}
          </button>
        </div>
      )}

      {/* ── Add / edit form ── */}
      {form && (
        <div style={{ ...s.card, border: '2px solid var(--teal)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, color: 'var(--teal)' }}>
            {form.id ? '✏️ Edit Case Study' : '➕ Add New Case Study'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.lbl}>Title</label>
              <input type="text" placeholder="Case study title" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={s.input} />
            </div>
            <div>
              <label style={s.lbl}>Price (₦)</label>
              <input type="text" placeholder="e.g. ₦10,000" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={s.input} />
            </div>
            <div>
              <label style={s.lbl}>Pages</label>
              <input type="text" placeholder="e.g. 30" value={form.pages || ''} onChange={e => setForm(p => ({ ...p, pages: e.target.value }))} style={s.input} />
            </div>
            <div>
              <label style={s.lbl}>Category</label>
              <select value={form.category || 'Nursing Science'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={s.input}>
                {(CATEGORIES.includes(form.category) || !form.category ? CATEGORIES : [form.category, ...CATEGORIES]).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={s.lbl}>Badge</label>
              <select value={form.badge || ''} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={s.input}>
                <option value="">None</option><option value="Popular">🔥 Popular</option><option value="New">✨ New</option><option value="Hidden">🚫 Hidden</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.lbl}>Description</label>
              <textarea rows={3} placeholder="Brief description..." value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...s.input, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button style={{ ...s.btn('var(--teal)'), flex: 1 }} disabled={saving} onClick={() => save(form)}>
              {saving ? 'Saving...' : form.id ? '💾 Update' : '➕ Add Case Study'}
            </button>
            {form.id && <button style={s.btn('#EF4444')} disabled={saving} onClick={async () => { if (window.confirm('Delete this case study?')) { await removeMany([form.id]); setForm(null); } }}>🗑️ Delete</button>}
            <button style={s.btn('#94A3B8')} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      <div className="tp-card">
        <div className="tp-tabs">
          {tabs.map(x => (
            <button key={x.k} className={`tp-tab${view === x.k ? ' on' : ''}`} onClick={() => setView(x.k)}>{x.icon}{x.label}</button>
          ))}
        </div>
        {list.length === 0 && <div className="tp-empty">{items.length === 0 ? 'No case studies yet. Add one, paste a list, or bulk upload.' : 'No case studies match.'}</div>}
        {list.map(t => {
          const head = view === 'category' && t.category !== lastCat ? (lastCat = t.category, <div key={'g' + t.id} className="tp-group">{t.category}</div>) : null;
          return (
            <div key={t.id}>
              {head}
              <div className={`tp-row${selected.has(t.id) ? ' sel' : ''}${t.badge === 'Hidden' ? ' hid' : ''}`}>
                <input type="checkbox" className="tp-chk" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                <div className="tp-book"><BookOpen size={30} strokeWidth={1.8} /></div>
                <div className="tp-mid">
                  <div className="tp-title">{t.title}</div>
                  <span className="tp-chip"><GraduationCap size={14} />{t.category}</span>
                  {t.badge && <span className="tp-badge">{t.badge}</span>}
                </div>
                <div className="tp-pages">
                  <FileText size={22} strokeWidth={1.6} />
                  <div><small>Pages</small><b>{t.pages || '—'}</b></div>
                </div>
                <button className="tp-go" title="Edit case study" onClick={() => { setForm({ ...t }); setBulkMode(false); setPasteMode(false); setParsed([]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
