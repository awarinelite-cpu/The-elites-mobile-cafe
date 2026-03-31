import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import useDarkMode from '../../hooks/useDarkMode';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

export default function Navbar({ user, onLogout }) {
  const { dark, toggle } = useDarkMode();
  const { user: authUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // ✅ Swipe gesture
  useEffect(() => {
    let startX = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;

      if (startX < 50 && endX > 100) setMenuOpen(true);   // open
      if (startX > 200 && endX < 100) setMenuOpen(false); // close
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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
                }}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className={isActive('/login')}>Login</Link></li>
              <li>
                <Link to="/register" className="btn btn-teal btn-sm">Register</Link>
              </li>
            </>
          )}
        </ul>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {authUser && <NotificationBell />}

          {/* Dark Mode */}
          <button className="dark-toggle" onClick={toggle}>
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            {dark ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ✅ OVERLAY */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 998,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* ✅ SIDEBAR */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: 260,
        background: '#0F172A',
        padding: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)',

        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease'
      }}>

        <h2 style={{ color: '#fff' }}>Menu</h2>

        <Link to="/" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
          🏠 Overview
        </Link>

        <Link to="/services" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
          📦 Services
        </Link>

        <Link to="/topics" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
          📚 Topics
        </Link>

        {authUser ? (
          <>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
              📊 Dashboard
            </Link>

            {authUser.isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
                ⚙️ Admin
              </Link>
            )}

            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              style={{
                marginTop: 20,
                padding: 10,
                background: '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
              🔑 Login
            </Link>

            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}>
              📝 Register
            </Link>
          </>
        )}
      </div>

      {/* Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
