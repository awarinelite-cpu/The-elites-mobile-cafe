// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TopicsPage from './pages/TopicsPage';
import RequestPage from './pages/RequestPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

/* ─── Layout wrapper ───────────────────────────────────────── */
function Layout() {
  const loc = useLocation();
  const isAuthPage = ['/login', '/register'].includes(loc.pathname);
  const isDash = loc.pathname.startsWith('/dashboard') || loc.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/topics"          element={<TopicsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request"         element={<RequestPage />} />
          <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin"           element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="*"                element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && !isDash && <Footer />}
    </div>
  );
}

/* ─── 404 Page ─────────────────────────────────────────────── */
function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020B18',
      textAlign: 'center',
      padding: '100px 16px',
      fontFamily: "'Times New Roman', Georgia, serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Grid lines background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Cyan radial glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* 404 watermark */}
        <div style={{
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: 'clamp(80px, 20vw, 150px)',
          fontWeight: 700,
          color: '#06B6D4',
          opacity: 0.06,
          lineHeight: 1,
          marginBottom: 4,
          letterSpacing: '-0.05em',
          userSelect: 'none',
        }}>
          404
        </div>

        {/* Cyan glow line */}
        <div style={{
          width: 60, height: 2,
          background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)',
          margin: '0 auto 24px',
          borderRadius: 2,
        }} />

        <h2 style={{
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: 14,
          letterSpacing: '-0.01em',
        }}>
          Page Not Found
        </h2>

        <p style={{
          color: '#94A3B8',
          fontSize: 16,
          lineHeight: 1.75,
          maxWidth: 360,
          margin: '0 auto 36px',
        }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#06B6D4',
            color: '#020B18',
            fontFamily: "'Times New Roman', Georgia, serif",
            fontWeight: 700,
            fontSize: 15,
            padding: '12px 32px',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(6,182,212,0.30)',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#22D3EE';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#06B6D4';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Return Home
        </a>
      </div>
    </div>
  );
}

/* ─── App root ─────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />

        {/* Toast notifications — navy + cyan theme */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0D2040',
              color: '#E8F4FD',
              border: '1px solid #112952',
              borderLeft: '4px solid #06B6D4',
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: 14,
              borderRadius: 8,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 20px rgba(6,182,212,0.08)',
              padding: '12px 16px',
              maxWidth: 380,
            },
            success: {
              style: { borderLeftColor: '#10B981' },
              iconTheme: { primary: '#10B981', secondary: '#0D2040' },
            },
            error: {
              style: { borderLeftColor: '#EF4444' },
              iconTheme: { primary: '#EF4444', secondary: '#0D2040' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
