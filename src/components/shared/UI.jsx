// src/components/shared/UI.jsx
import { X, AlertCircle, CheckCircle, Clock, FileText, Loader } from 'lucide-react';

// ── STATUS BADGE ────────────────────────────────────────
const STATUS_MAP = {
  pending:       { label: 'Pending',        color: '#E8C97A', bg: 'rgba(232,201,122,0.12)' },
  quoted:        { label: 'Quote Sent',     color: '#4A90D9', bg: 'rgba(74,144,217,0.12)' },
  advance_paid:  { label: 'Advance Paid',   color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' },
  in_progress:   { label: 'In Progress',    color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
  preview_ready: { label: 'Preview Ready',  color: '#E67E22', bg: 'rgba(230,126,34,0.12)' },
  final_paid:    { label: 'Complete ✓',     color: '#2ECC71', bg: 'rgba(46,204,113,0.15)' },
  cancelled:     { label: 'Cancelled',      color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: '#888', bg: 'rgba(136,136,136,0.1)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}44`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
      fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ── MODAL ───────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--dark-card)', border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
        width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeUp 0.25s ease',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── EMPTY STATE ─────────────────────────────────────────
export function EmptyState({ icon: Icon = FileText, title, desc, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gold-glow)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={22} color="var(--gold)" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: action ? 20 : 0, maxWidth: 300, margin: '0 auto' }}>{desc}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ── SPINNER ─────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--gold)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin-slow 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

// ── CARD ────────────────────────────────────────────────
export function Card({ children, style = {}, hover = true, onClick }) {
  const base = {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    transition: 'var(--transition)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };
  return (
    <div style={base} onClick={onClick}
      onMouseEnter={e => { if (hover) { e.currentTarget.style.borderColor = 'var(--border-gold)'; if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { if (hover) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; } }}
    >{children}</div>
  );
}

// ── BUTTON ──────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', disabled, loading, size = 'md', style: extra = {}, type = 'button' }) {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 32px' : '10px 20px';
  const fs = size === 'sm' ? 12 : size === 'lg' ? 14 : 13;

  const variants = {
    primary: { background: disabled ? 'var(--gold-dark)' : 'var(--gold)', color: 'var(--dark)', border: 'none' },
    outline: { background: 'transparent', color: 'var(--gold)', border: '1px solid var(--border-gold)' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:  { background: 'transparent', color: 'var(--red)', border: '1px solid rgba(231,76,60,0.4)' },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{
      ...variants[variant],
      padding: pad, borderRadius: 'var(--radius)',
      fontSize: fs, fontWeight: 500, fontFamily: 'var(--font-body)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'var(--transition)', letterSpacing: 0.3,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.6 : 1,
      ...extra,
    }}
      onMouseEnter={e => { if (!disabled && !loading && variant === 'primary') e.currentTarget.style.background = 'var(--gold-light)'; }}
      onMouseLeave={e => { if (!disabled && !loading && variant === 'primary') e.currentTarget.style.background = 'var(--gold)'; }}
    >
      {loading ? <Spinner size={14} color={variant === 'primary' ? 'var(--dark)' : 'var(--gold)'} /> : children}
    </button>
  );
}

// ── FIELD ───────────────────────────────────────────────
export function Field({ label, error, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: 0.5 }}>{label}</label>}
      {children}
      {hint && !error && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{hint}</span>}
      {error && <span style={{ color: 'var(--red)', fontSize: 11 }}>{error}</span>}
    </div>
  );
}

export const inputStyle = {
  background: 'var(--dark-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '11px 14px',
  color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', width: '100%',
  transition: 'border-color 0.2s',
};

export const textareaStyle = {
  ...inputStyle,
  resize: 'vertical', minHeight: 100, lineHeight: 1.6,
};

// ── SECTION HEADER ───────────────────────────────────────
export function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {eyebrow && <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>{eyebrow}</div>}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 600, lineHeight: 1.15, marginBottom: desc ? 12 : 0 }}>{title}</h2>
      {desc && <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 560 }}>{desc}</p>}
    </div>
  );
}
