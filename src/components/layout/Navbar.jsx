// src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/authService';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const dashPath = profile?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,10,8,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-gold)' : '1px solid transparent',
      transition: 'all 0.4s ease',
      padding: '0 clamp(16px, 4vw, 60px)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1.5px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gold-glow)',
          }}>
            <BookOpen size={16} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.1, letterSpacing: 0.5 }}>
              The Elites
            </div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Mobile Cafe
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          <NavLink to="/topics" label="Browse Topics" current={location.pathname} />
          <NavLink to="/request" label="Request Writer" current={location.pathname} />
          <NavLink to="/about" label="About" current={location.pathname} />
        </div>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <button onClick={() => navigate(dashPath)} style={{
                background: 'transparent', border: '1px solid var(--border-gold)',
                color: 'var(--gold)', borderRadius: 'var(--radius)',
                padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button onClick={handleLogout} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                fontFamily: 'var(--font-body)', transition: 'var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none',
                fontFamily: 'var(--font-body)', transition: 'var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Sign In
              </Link>
              <Link to="/register" style={{
                background: 'var(--gold)', color: 'var(--dark)',
                padding: '9px 22px', borderRadius: 'var(--radius)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                fontFamily: 'var(--font-body)', letterSpacing: 0.5,
                transition: 'var(--transition)', display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)',
            cursor: 'pointer', display: 'none', padding: 4,
          }} className="hamburger">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10,10,8,0.98)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-gold)',
          padding: '20px clamp(16px, 4vw, 60px)',
          display: 'flex', flexDirection: 'column', gap: 16,
          animation: 'fadeIn 0.2s ease',
        }}>
          {['/', '/topics', '/request', '/about'].map((path, i) => (
            <Link key={path} to={path}
              onClick={() => setMenuOpen(false)}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 15, fontFamily: 'var(--font-body)' }}>
              {['Home', 'Browse Topics', 'Request Writer', 'About'][i]}
            </Link>
          ))}
          {!user && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: 14 }}>Get Started →</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, label, current }) {
  const active = current === to;
  return (
    <Link to={to} style={{
      color: active ? 'var(--gold)' : 'var(--text-secondary)',
      textDecoration: 'none', fontSize: 13, letterSpacing: 0.5,
      fontFamily: 'var(--font-body)', fontWeight: 400,
      transition: 'var(--transition)',
      borderBottom: active ? '1px solid var(--gold)' : '1px solid transparent',
      paddingBottom: 2,
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >{label}</Link>
  );
}
