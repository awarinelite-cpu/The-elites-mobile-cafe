// src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--teal)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: 1, fontFamily: 'var(--font-body)' }}>
          Loading…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  // ✅ Check BOTH isAdmin (boolean) and role === 'Admin' or 'admin'
  if (adminOnly) {
    const isAdmin =
      profile?.isAdmin === true ||
      profile?.role === 'Admin' ||
      profile?.role === 'admin';

    if (!isAdmin) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
