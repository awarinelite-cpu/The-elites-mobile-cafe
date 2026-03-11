// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--dark-card)',
      borderTop: '1px solid var(--border-gold)',
      padding: '48px clamp(16px, 4vw, 60px) 28px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--gold)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--gold-glow)',
              }}>
                <BookOpen size={14} color="var(--gold)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)', fontWeight: 600 }}>The Elites Mobile Cafe</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
              Premium research writing services. Quality work, delivered with integrity.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Services</h4>
            {['Browse Topics', 'Request Custom Work', 'Pricing', 'How It Works'].map(l => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{l}</Link>
              </div>
            ))}
          </div>

          {/* Account */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Account</h4>
            {[['Sign In', '/login'], ['Create Account', '/register'], ['Dashboard', '/dashboard'], ['My Orders', '/dashboard/orders']].map(([l, p]) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Link to={p} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{l}</Link>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="mailto:info@elitesmobilecafe.com" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Mail size={13} color="var(--gold)" /> info@elitesmobilecafe.com
              </a>
              <a href="tel:+1234567890" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Phone size={13} color="var(--gold)" /> +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            © {new Date().getFullYear()} The Elites Mobile Cafe. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <Link key={l} to="/" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
