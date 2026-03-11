// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../firebase/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      toast.error(e.code === 'auth/user-not-found' ? 'No account found with this email.' : e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: '100px 16px 40px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,168,76,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-glow)' }}>
              <BookOpen size={18} color="var(--gold)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold)', fontWeight: 600 }}>The Elites Mobile Cafe</div>
          </Link>
        </div>

        <div style={{ background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 10 }}>Check your email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>We've sent a password reset link. Check your inbox and follow the instructions.</p>
              <Link to="/login" style={{ display: 'inline-block', marginTop: 24, color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>← Back to Sign In</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Reset Password</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 6 }}>Email address</label>
                  <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} type="email" placeholder="you@example.com"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', width: '100%' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {errors.email && <span style={{ color: 'var(--red)', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
                </div>
                <button type="submit" disabled={isSubmitting} style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '13px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}><ArrowLeft size={13} /> Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
