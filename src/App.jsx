// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PWAWrapper from './components/PWAWrapper';

// Core pages
import HomePage           from './pages/HomePage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import TopicsPage         from './pages/TopicsPage';
import RequestPage        from './pages/RequestPage';
import DashboardPage      from './pages/DashboardPage';
import AdminPage          from './pages/AdminPage';
import WriterPage         from './pages/WriterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AIResearchWriterPage from './pages/AIResearchWriterPage';
import ServicesPage       from './pages/ServicesPage';

// Service pages
import ResearchProjectsPage    from './pages/services/ResearchProjectsPage';
import DataAnalysisPage        from './pages/services/DataAnalysisPage';
import ClientCarePage          from './pages/services/ClientCarePage';
import AcademicAssignmentsPage from './pages/services/AcademicAssignmentsPage';
import OnlineRegistrationPage  from './pages/services/OnlineRegistrationPage';
import PowerPointPage          from './pages/services/PowerPointPage';
import ProofreadingPage        from './pages/services/ProofreadingPage';
import SurveyDesignPage        from './pages/services/SurveyDesignPage';
import WaecNecoPage            from './pages/services/WaecNecoPage';

/* ─── Layout ───────────────────────────────────────────────── */
function Layout() {
  const loc = useLocation();
  const navigate = useNavigate();

  // Handle 404 redirect from 404.html
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      navigate(decodeURIComponent(redirect), { replace: true });
    }
  }, []);

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(loc.pathname);
  const isDash = loc.pathname.startsWith('/dashboard') || loc.pathname.startsWith('/admin') || loc.pathname.startsWith('/writer');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Core */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/topics"          element={<TopicsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request"         element={<RequestPage />} />

          {/* Public Services Selection Page */}
          <Route path="/services"        element={<ServicesPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin"     element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/writer"    element={<ProtectedRoute><WriterPage /></ProtectedRoute>} />
          <Route path="/ai-writer" element={<ProtectedRoute><AIResearchWriterPage /></ProtectedRoute>} />

          {/* Service sub-pages (protected) */}
          <Route path="/services/research-projects"
            element={<ProtectedRoute><ResearchProjectsPage /></ProtectedRoute>} />
          <Route path="/services/data-analysis"
            element={<ProtectedRoute><DataAnalysisPage /></ProtectedRoute>} />
          <Route path="/services/client-care"
            element={<ProtectedRoute><ClientCarePage /></ProtectedRoute>} />
          <Route path="/services/academic-assignments"
            element={<ProtectedRoute><AcademicAssignmentsPage /></ProtectedRoute>} />
          <Route path="/services/online-registration"
            element={<ProtectedRoute><OnlineRegistrationPage /></ProtectedRoute>} />
          <Route path="/services/powerpoint"
            element={<ProtectedRoute><PowerPointPage /></ProtectedRoute>} />
          <Route path="/services/proofreading"
            element={<ProtectedRoute><ProofreadingPage /></ProtectedRoute>} />
          <Route path="/services/survey-design"
            element={<ProtectedRoute><SurveyDesignPage /></ProtectedRoute>} />
          <Route path="/services/waec-neco"
            element={<ProtectedRoute><WaecNecoPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && !isDash && <Footer />}
    </div>
  );
}

/* ─── 404 ──────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 55%, #0F766E 100%)',
      textAlign: 'center', padding: '100px 16px',
      fontFamily: "'Times New Roman', Georgia, serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 'clamp(80px,18vw,140px)', fontWeight: 700, color: '#0D9488', opacity: 0.10, lineHeight: 1, marginBottom: 4, userSelect: 'none' }}>404</div>
        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,transparent,#0D9488,transparent)', margin: '0 auto 24px', borderRadius: 2 }} />
        <h2 style={{ color: '#FFFFFF', fontSize: 'clamp(20px,4vw,28px)', marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 15, maxWidth: 360, margin: '0 auto 36px', lineHeight: 1.75 }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <a href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0D9488', color: '#FFFFFF', fontFamily: "'Times New Roman',serif", fontWeight: 700, fontSize: 15, padding: '12px 32px', borderRadius: 8, textDecoration: 'none', boxShadow: '0 4px 20px rgba(13,148,136,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background='#0F766E'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#0D9488'; e.currentTarget.style.transform='translateY(0)'; }}
        >← Return Home</a>
      </div>
    </div>
  );
}

/* ─── Root ─────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PWAWrapper>
          <Layout />
        </PWAWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4500,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #E2E8F0',
              borderLeft: '4px solid #0D9488',
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: 14,
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              padding: '12px 16px',
              maxWidth: 400,
            },
            success: {
              style: { borderLeftColor: '#16A34A' },
              iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
            },
            error: {
              style: { borderLeftColor: '#DC2626' },
              iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
