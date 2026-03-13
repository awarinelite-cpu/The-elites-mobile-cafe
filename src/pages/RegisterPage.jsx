// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BookOpen, ArrowRight } from 'lucide-react';
import { registerUser } from '../firebase/authService';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode      = searchParams.get('ref') || null; // referral param e.g. ?ref=writerId

  const onSubmit = async (data) => {
    try {
      await registerUser({
        name:       data.name,
        email:      data.email,
        password:   data.password,
        role:       'client',
        referredBy: refCode || null,
      });
      toast.success(`Welcome, ${data.name.split(' ')[0]}! Your account is ready.`);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        err.code === 'auth/weak-password'        ? 'Password must be at least 6 characters.' :
        err.message;
      toast.error(msg);
    }
  };

  const password = watch('password');

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: '100px 16px 40px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
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
              width: 48, height: 48, borderRadius: '50%',
              border: '1.5px solid var(--gold)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--gold-glow)',
              boxShadow: '0 0 30px rgba(201,168,76,0.2)',
            }}>
              <BookOpen size={20} color="var(--gold)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)', fontWeight: 600, letterSpacing: 0.5 }}>
              The Elites Mobile Cafe
            </div>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--dark-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
            {refCode ? '🔗 You were invited — join for free.' : 'Sign up free and get started today.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Field label="Full Name" error={errors.name?.message}>
              <input
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
                type="text" placeholder="e.g. Emeka Johnson"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.name ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

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

            <Field label="Phone Number" error={errors.phone?.message}>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^[0-9+\s\-()]{7,15}$/, message: 'Enter a valid phone number' },
                })}
                type="tel" placeholder="e.g. 08012345678"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.phone ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type={showPass ? 'text' : 'password'} placeholder="At least 6 characters"
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

            <Field label="Confirm Password" error={errors.confirmPassword?.message}>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: val => val === password || 'Passwords do not match',
                  })}
                  type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = errors.confirmPassword ? 'var(--red)' : 'var(--border)'}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={isSubmitting} style={{
              background: isSubmitting ? 'var(--gold-dark)' : 'var(--gold)',
              color: 'var(--dark)', border: 'none',
              padding: '14px', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: 0.5, marginTop: 4,
            }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold-light)'; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold)'; }}
            >
              {isSubmitting ? 'Creating account…' : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
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
