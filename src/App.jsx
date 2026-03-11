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

function Layout() {
  const loc = useLocation();
  const isAuthPage = ['/login', '/register'].includes(loc.pathname);
  const isDash = loc.pathname.startsWith('/dashboard') || loc.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && !isDash && <Footer />}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', textAlign: 'center', padding: '100px 16px' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 100, color: 'var(--gold)', opacity: 0.15, lineHeight: 1, marginBottom: 8 }}>404</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 10 }}>Page not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>The page you're looking for doesn't exist.</p>
        <a href="/" style={{ color: 'var(--gold)', textDecoration: 'none', border: '1px solid var(--border-gold)', padding: '10px 24px', borderRadius: 'var(--radius)', fontSize: 13 }}>← Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--dark-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              borderRadius: 'var(--radius)',
            },
            success: { iconTheme: { primary: 'var(--gold)', secondary: 'var(--dark)' } },
            error:   { iconTheme: { primary: 'var(--red)',  secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
