// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginUser } from '../firebase/authService';
import { getUserProfile } from '../firebase/authService';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const user = await loginUser(data);
      const profile = await getUserProfile(user.uid);
      toast.success(`Welcome back, ${user.displayName?.split(' ')[0] || 'there'}!`);
      navigate(profile?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message;
      toast.error(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: '32px 16px 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 52, height: 52,
              boxShadow: '0 0 30px rgba(15,118,110,0.25)',
              borderRadius: '50%',
            }}>
              <BrandMark size={52} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)', fontWeight: 600, letterSpacing: 0.5 }}>
              The Elites Mobile Cafe
            </div>
          </Link>
        </div>

        {/* ── Browse Services Banner ── */}
        <Link
          to="/services"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(13,148,136,0.15)',
            border: '1px solid rgba(13,148,136,0.4)',
            borderRadius: 12, padding: '14px 20px',
            marginBottom: 20, textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,148,136,0.25)'; e.currentTarget.style.borderColor = 'rgba(13,148,136,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13,148,136,0.15)'; e.currentTarget.style.borderColor = 'rgba(13,148,136,0.4)'; }}
        >
          <div>
            <p style={{ color: '#5EEAD4', fontSize: 13, fontWeight: 700, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>
              📋 New here? Browse our services first
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
              Submit your request, then create a free account
            </p>
          </div>
          <span style={{ color: '#5EEAD4', fontSize: 18 }}>→</span>
        </Link>

        {/* Card */}
        <div style={{
          background: 'var(--dark-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Email address" error={errors.email?.message}>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                type="email" placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.email ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'} placeholder="Your password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = errors.password ? 'var(--red)' : 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -10 }}>
              <Link to="/forgot-password" style={{ color: 'var(--gold)', fontSize: 12, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} style={{
              background: isSubmitting ? 'var(--gold-dark)' : 'var(--gold)',
              color: 'var(--dark)', border: 'none',
              padding: '14px', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: 0.5,
            }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold-light)'; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold)'; }}
            >
              {isSubmitting ? 'Signing in…' : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: 0.5 }}>{label}</label>
      {children}
      {error && <span style={{ color: 'var(--red)', fontSize: 11 }}>{error}</span>}
    </div>
  );
}

const inputStyle = {
  background: 'var(--dark-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '12px 14px',
  color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'var(--font-body)',
  outline: 'none', width: '100%',
  transition: 'var(--transition)',
};
