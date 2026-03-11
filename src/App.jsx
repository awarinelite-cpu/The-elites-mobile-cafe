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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 60%, #1D4ED8 100%)',
        textAlign: 'center',
        padding: '100px 16px',
        fontFamily: "'Times New Roman', Georgia, serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Large 404 watermark */}
        <div
          style={{
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: 'clamp(80px, 18vw, 140px)',
            fontWeight: 700,
            color: '#FFFFFF',
            opacity: 0.07,
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: '-0.04em',
            userSelect: 'none',
          }}
        >
          404
        </div>

        {/* Decorative rule */}
        <div
          style={{
            width: 60,
            height: 3,
            background: '#DBEAFE',
            borderRadius: 2,
            margin: '0 auto 24px',
            opacity: 0.7,
          }}
        />

        <h2
          style={{
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          Page Not Found
        </h2>

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.72)',
            marginBottom: 36,
            fontSize: 16,
            maxWidth: 380,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFFFFF',
            color: '#1E3A8A',
            fontFamily: "'Times New Roman', Georgia, serif",
            fontWeight: 700,
            fontSize: 15,
            padding: '12px 30px',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#DBEAFE';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
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

        {/* Toast notifications — styled for deep blue theme */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1.5px solid #D1D5DB',
              borderLeft: '4px solid #1E3A8A',
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: 14,
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(30, 58, 138, 0.12)',
              padding: '12px 16px',
              maxWidth: 380,
            },
            success: {
              style: {
                borderLeftColor: '#16A34A',
              },
              iconTheme: {
                primary: '#16A34A',
                secondary: '#FFFFFF',
              },
            },
            error: {
              style: {
                borderLeftColor: '#DC2626',
              },
              iconTheme: {
                primary: '#DC2626',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
