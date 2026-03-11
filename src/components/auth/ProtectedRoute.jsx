// src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '2px solid var(--border-gold)',
          borderTop: '2px solid var(--gold)', borderRadius: '50%',
          animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: 1 }}>Loading…</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
