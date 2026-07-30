// src/components/layout/Navbar.jsx

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, GraduationCap, ChevronDown, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useDarkMode from '../../hooks/useDarkMode';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Topics', to: '/topics' },
  { label: 'Services', to: '/services' },
  { label: 'AI Writer', to: '/ai-writer' },
];

export default function Navbar({ user, onLogout }) {
  const { dark, toggle } = useDarkMode();
  const { profile, logout: authLogout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const location = useLocation();
  const avatarRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const doLogout = onLogout || authLogout;

  useEffect(() => { setMenuOpen(false); setAvatarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Swipe gesture for mobile sidebar
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e) => { startX = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX < 50 && endX > 100) setMenuOpen(true);
      if (startX > 200 && endX < 100) setMenuOpen(false);
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const dashboardHref = profile?.isAdmin ? '/admin' : profile?.isWriter ? '/writer' : '/dashboard';
  const initial = (profile?.name || profile?.email || 'U').trim()[0]?.toUpperCase() || 'U';

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-mark"><GraduationCap size={20} /></span>
          <span className="brand-word">Elite<span>Cafe</span></span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-links">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className={isActive(l.to) ? 'active' : ''}>{l.label}</Link>
            </li>
          ))}
        </ul>

        {/* Right controls */}
        <div className="nav-right">
          {profile && <NotificationBell />}

          <button className="dark-toggle" onClick={toggle} aria-label="Toggle theme">
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            {dark ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {profile ? (
            <div className="avatar-wrap" ref={avatarRef}>
              <button className="avatar-btn" onClick={() => setAvatarOpen(v => !v)}>
                <span className="avatar-circle">{initial}</span>
                <span className="avatar-name">{(profile.name || profile.email || '').split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {avatarOpen && (
                <div className="avatar-dropdown">
                  <Link to={dashboardHref} onClick={() => setAvatarOpen(false)}>
                    <LayoutDashboard size={15} /> My Dashboard
                  </Link>
                  {profile.isAdmin && (
                    <Link to="/admin" onClick={() => setAvatarOpen(false)}>
                      <ShieldCheck size={15} /> Admin Panel
                    </Link>
                  )}
                  <button className="dropdown-logout" onClick={() => { setAvatarOpen(false); doLogout?.(); }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="guest-actions">
              <Link to="/login" className="guest-login">Log In</Link>
              <Link to="/register" className="guest-cta">Get Started</Link>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenuOpen((o) => !o)} className="mobile-menu-btn" aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* OVERLAY */}
      <div onClick={() => setMenuOpen(false)} className={`overlay ${menuOpen ? 'show' : ''}`} />

      {/* SIDEBAR */}
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark"><GraduationCap size={18} /></span>
          <span className="brand-word">Elite<span>Cafe</span></span>
        </div>

        {NAV_LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className={isActive(l.to) ? 'active' : ''}>
            {l.label}
          </Link>
        ))}

        <div className="sidebar-divider" />

        {profile ? (
          <>
            <Link to={dashboardHref} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            {profile.isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            <button className="logout-mobile" onClick={() => { setMenuOpen(false); doLogout?.(); }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Log In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="sidebar-cta">Get Started</Link>
          </>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .navbar {
          background: rgba(22,35,63,0.94);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(15,118,110,0.35);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          gap: 16px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .brand-mark {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: var(--teal);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .brand-word {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.15rem;
          color: #fff;
          letter-spacing: 0.2px;
        }
        .brand-word span { color: var(--teal-light); }

        .navbar-links {
          display: flex;
          gap: 4px;
          list-style: none;
          margin: 0; padding: 0;
        }

        .navbar-links a {
          display: block;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.92rem;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }

        .navbar-links a:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .navbar-links a.active { color: #fff; background: var(--teal-glow); }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dark-toggle {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .toggle-track { width: 30px; height: 16px; border-radius: 999px; background: rgba(255,255,255,0.18); position: relative; }
        .toggle-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--teal-light); position: absolute; top: 2px; left: 2px; transition: var(--transition); }

        .avatar-wrap { position: relative; }
        .avatar-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 5px 12px 5px 5px;
          color: #fff; cursor: pointer;
          font-family: var(--font-body);
        }
        .avatar-circle {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--gold);
          color: #fff; font-weight: 700; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .avatar-name { font-size: 0.85rem; font-weight: 500; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .avatar-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 190px;
          padding: 6px;
          z-index: 1200;
        }
        .avatar-dropdown a, .dropdown-logout {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 10px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 500;
          background: none; border: none; width: 100%; text-align: left; cursor: pointer;
        }
        .avatar-dropdown a:hover { background: var(--bg-secondary); }
        .dropdown-logout { color: var(--terracotta); }
        .dropdown-logout:hover { background: var(--terracotta-glow); }

        .guest-actions { display: flex; align-items: center; gap: 8px; }
        .guest-login {
          color: rgba(255,255,255,0.85);
          text-decoration: none; font-size: 0.88rem; font-weight: 500;
          font-family: var(--font-body);
          padding: 8px 10px;
        }
        .guest-cta {
          background: var(--gold);
          color: #fff; text-decoration: none;
          font-family: var(--font-body);
          font-weight: 600; font-size: 0.86rem;
          padding: 9px 18px; border-radius: 999px;
          transition: var(--transition);
        }
        .guest-cta:hover { background: var(--gold-dark); }

        .mobile-menu-btn {
          display: none;
          background: none; border: none;
          color: #fff; cursor: pointer;
        }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(9,14,24,0.55);
          opacity: 0; pointer-events: none;
          transition: 0.25s; z-index: 1400;
        }
        .overlay.show { opacity: 1; pointer-events: auto; }

        .sidebar {
          position: fixed; top: 0; left: 0;
          width: 270px; height: 100%;
          background: var(--blue-deep);
          padding: 22px 18px;
          display: flex; flex-direction: column; gap: 4px;
          transform: translateX(-100%);
          transition: 0.28s cubic-bezier(0.4,0,0.2,1);
          z-index: 1500;
          overflow-y: auto;
        }
        .sidebar.open { transform: translateX(0); }

        .sidebar-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px;
        }

        .sidebar a {
          color: rgba(255,255,255,0.82);
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: 500; font-size: 0.95rem;
          padding: 12px 12px;
          border-radius: var(--radius-sm);
        }
        .sidebar a.active { background: var(--teal-glow); color: #fff; }
        .sidebar a:hover { background: rgba(255,255,255,0.06); }

        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.12); margin: 10px 0; }

        .sidebar-cta {
          background: var(--gold) !important;
          color: #fff !important;
          text-align: center;
          margin-top: 4px;
        }

        .logout-mobile {
          margin-top: 6px;
          padding: 12px;
          background: var(--terracotta-glow);
          color: #F5A98A;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        @media (max-width: 860px) {
          .navbar-links, .nav-right .avatar-name, .guest-login { display: none; }
          .nav-right .dark-toggle { display: none; }
          .mobile-menu-btn { display: block; }
          .avatar-wrap { display: none; }
        }
      `}</style>
    </nav>
  );
}
