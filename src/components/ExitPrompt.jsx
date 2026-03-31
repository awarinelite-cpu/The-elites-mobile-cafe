// src/components/ExitPrompt.jsx
// Toast-style banner shown when the user presses back on a home/root page.
// Tells them "press back again to exit". Auto-dismisses after 3 s.

import { useEffect, useState } from 'react';

export default function ExitPrompt({ visible, onDismiss }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes emc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={{
        position:    'fixed',
        bottom:      40,
        left:        '50%',
        transform:   'translateX(-50%)',
        background:  'rgba(2,11,24,0.97)',
        border:      '1px solid rgba(201,168,76,0.45)',
        borderRadius: 12,
        padding:     '14px 26px',
        color:       '#F1F5F9',
        fontSize:    14,
        fontFamily:  "var(--font-body, 'Times New Roman', Georgia, serif)",
        fontWeight:  600,
        zIndex:      99999,
        boxShadow:   '0 8px 32px rgba(0,0,0,0.55)',
        whiteSpace:  'nowrap',
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        animation:   'emc-slideUp 0.25s ease',
        userSelect:  'none',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        Press back again to exit
      </div>
    </>
  );
}
