// src/components/Navbar.jsx

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

  const isActive = (path) =>
    location.pathname === path ? 'active' : '';

  // ✅ Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
        <ul className="navbar-links">
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className={isActive('/dashboard')}>
                  Dashboard
                </Link>
              </li>

              {user.isAdmin && (
                <li>
                  <Link to="/admin" className={isActive('/admin')}>
                    Admin
                  </Link>
                </li>
              )}

              <li>
                <button onClick={onLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={isActive('/login')}>
                  Login
                </Link>
              </li>

              <li>
                <Link to="/register" className="btn btn-teal btn-sm">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right controls */}
        <div className="nav-right">
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
            onClick={() => setMenuOpen((o) => !o)}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* OVERLAY */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`overlay ${menuOpen ? 'show' : ''}`}
      />

      {/* SIDEBAR */}
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <h2>Menu</h2>

        <Link to="/" onClick={() => setMenuOpen(false)}>
          🏠 Overview
        </Link>

        <Link to="/services" onClick={() => setMenuOpen(false)}>
          📦 Services
        </Link>

        <Link to="/topics" onClick={() => setMenuOpen(false)}>
          📚 Topics
        </Link>

        {authUser ? (
          <>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
              📊 Dashboard
            </Link>

            {authUser.isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}>
                ⚙️ Admin
              </Link>
            )}

            <button
              onClick={() => {
                onLogout();
                setMenuOpen(false);
              }}
              className="logout-mobile"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              🔑 Login
            </Link>

            <Link to="/register" onClick={() => setMenuOpen(false)}>
              📝 Register
            </Link>
          </>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .navbar {
          background: #0F172A;
          color: white;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
        }

        .navbar-brand {
          color: white;
          font-weight: bold;
          text-decoration: none;
        }

        .navbar-links {
          display: flex;
          gap: 20px;
          list-style: none;
        }

        .navbar-links a {
          color: white;
          text-decoration: none;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dark-toggle {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }

        .logout-btn {
          background: rgba(239,68,68,0.15);
          color: #FCA5A5;
          border: 1px solid rgba(239,68,68,0.3);
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Overlay */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          opacity: 0;
          pointer-events: none;
          transition: 0.3s;
          z-index: 998;
        }

        .overlay.show {
          opacity: 1;
          pointer-events: auto;
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          height: 100%;
          background: #0F172A;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transform: translateX(-100%);
          transition: 0.3s;
          z-index: 999;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar a {
          color: white;
          text-decoration: none;
        }

        .logout-mobile {
          margin-top: 20px;
          padding: 10px;
          background: #DC2626;
          color: white;
          border: none;
          border-radius: 6px;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
}
