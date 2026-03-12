// src/components/Navbar.jsx
// Drop-in Navbar with dark mode toggle.
// Usage: <Navbar user={user} onLogout={handleLogout} />

import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useDarkMode from '../../hooks/useDarkMode';

export default function Navbar({ user, onLogout }) {
  const { dark, toggle } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const links = [
    { to: '/', label: 'Home' },
    { to: '/topics', label: 'Research Topics' },
    { to: '/services', label: 'Services' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span style={{ fontSize: '1.4rem' }}>📚</span>
          Elite Mobile <span>Cafe</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-links" style={{ display: 'flex' }}>
          {links.map(l => (
            <li key={l.to}>
              <Link to={l.to} className={isActive(l.to)}>{l.label}</Link>
            </li>
          ))}
          {user ? (
            <>
              <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
              {user.isAdmin && (
                <li><Link to="/admin" className={isActive('/admin')}>Admin</Link></li>
              )}
              <li>
                <button onClick={onLogout} style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  transition: 'var(--transition)',
                }}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className={isActive('/login')}>Login</Link></li>
              <li>
                <Link to="/register" className="btn btn-teal btn-sm" style={{ marginLeft: 4 }}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Dark Mode Toggle */}
          <button
            className="dark-toggle"
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            {dark ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'none',
              padding: 6,
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div style={{
          background: 'var(--nav-bg)',
          borderTop: '1px solid var(--border)',
          padding: '12px 20px 20px',
        }}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '11px 0',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 500,
                fontSize: 15,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '11px 0', color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
                Dashboard
              </Link>
              <button onClick={() => { onLogout(); setMenuOpen(false); }}
                style={{ marginTop: 12, width: '100%', padding: '10px', background: 'rgba(239,68,68,0.15)',
                  color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-teal btn-sm" style={{ flex: 1 }}>Register</Link>
            </div>
          )}
        </div>
      )}

      {/* Mobile menu CSS */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
