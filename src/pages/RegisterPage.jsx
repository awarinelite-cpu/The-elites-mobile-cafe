// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { registerUser } from '../firebase/authService';
import toast from 'react-hot-toast';

const PERKS = [
  'Browse & order from 100+ research topics',
  'Request fully custom research work',
  'Track orders in real-time',
  'Secure Paystack-powered payments',
];

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('client');
  const navigate = useNavigate();
  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password, role });
      toast.success('Account created! Welcome to The Elites Mobile Cafe.');
      navigate(role === 'writer' ? '/writer' : '/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try signing in.'
        : err.message;
      toast.error(msg);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'stretch',
      background: 'var(--dark)', paddingTop: 70,
    }}>
      {/* Left panel – decorative */}
      <div style={{
        flex: '0 0 42%', background: 'var(--dark-card)',
        borderRight: '1px solid var(--border-gold)',
        padding: '60px clamp(24px, 4vw, 60px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }} className="register-panel">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 30% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: `linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-glow)' }}>
              <BookOpen size={17} color="var(--gold)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)', fontWeight: 600 }}>The Elites Mobile Cafe</div>
          </Link>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 600, lineHeight: 1.2, marginBottom: 16 }}>
            Start your research journey today
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.75, marginBottom: 40 }}>
            Join hundreds of students, researchers, and professionals who trust us with their most important work.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px clamp(16px, 4vw, 60px)',
      }}>
        <div className="animate-fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Free to join. No hidden fees.</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <Field label="Full Name" error={errors.name?.message}>
              <input
                {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                type="text" placeholder="Jane Doe"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.name ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                type="email" placeholder="jane@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.email ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                  type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
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

            <Field label="Confirm Password" error={errors.confirm?.message}>
              <input
                {...register('confirm', { required: 'Please confirm your password', validate: v => v === password || 'Passwords do not match' })}
                type="password" placeholder="Repeat your password"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = errors.confirm ? 'var(--red)' : 'var(--border)'}
              />
            </Field>

            {/* Role selector */}
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>I am joining as a</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { value: 'client', emoji: '🎓', label: 'Client', desc: 'I need research work done' },
                  { value: 'writer', emoji: '✍️', label: 'Writer', desc: 'I want to write & earn' },
                ].map(opt => (
                  <div key={opt.value} onClick={() => setRole(opt.value)} style={{
                    border: `2px solid ${role === opt.value ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '14px 12px', cursor: 'pointer',
                    background: role === opt.value ? 'var(--gold-glow)' : 'var(--dark-elevated)',
                    transition: 'all 0.2s', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: role === opt.value ? 'var(--gold)' : 'var(--text-primary)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.6, marginTop: -6 }}>
              By creating an account you agree to our{' '}
              <Link to="/" style={{ color: 'var(--gold)' }}>Terms of Service</Link> and{' '}
              <Link to="/" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isSubmitting} style={{
              background: isSubmitting ? 'var(--gold-dark)' : 'var(--gold)',
              color: 'var(--dark)', border: 'none',
              padding: '14px', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: 0.5, marginTop: 4,
              boxShadow: '0 0 20px rgba(201,168,76,0.25)',
            }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold-light)'; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gold)'; }}
            >
              {isSubmitting ? 'Creating Account…' : <>Create Free Account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-panel { display: none !important; }
        }
      `}</style>
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
