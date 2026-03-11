// src/pages/TopicsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { subscribeToTopics } from '../firebase/orderService';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, StatusBadge } from '../components/shared/UI';
import { createOrder } from '../firebase/orderService';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Business', 'Economics', 'Sociology', 'Psychology', 'Environmental Science', 'Health', 'Education', 'Law', 'Other'];

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToTopics(data => { setTopics(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = topics.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchCat;
  });

  const handleOrder = async (topic) => {
    if (!user) { navigate('/register'); return; }
    try {
      const orderId = await createOrder({
        clientId: user.uid,
        clientName: profile?.name || user.displayName,
        clientEmail: user.email,
        topicId: topic.id,
        topicTitle: topic.title,
        details: topic.description || '',
        pages: topic.pages || '',
      });
      toast.success('Order placed! Awaiting quote from our team.');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 80 }}>
      {/* Header */}
      <div style={{ background: 'var(--dark-card)', borderBottom: '1px solid var(--border)', padding: '48px clamp(16px,4vw,60px) 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Research Library</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4vw,52px)', fontWeight: 600, marginBottom: 12 }}>Browse Topics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, marginBottom: 32 }}>
            Choose from our curated collection of pre-researched topics, ready to be written to your specifications.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search topics…"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px 11px 40px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', width: '100%' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px clamp(16px,4vw,60px)' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              background: category === cat ? 'var(--gold)' : 'var(--dark-card)',
              color: category === cat ? 'var(--dark)' : 'var(--text-secondary)',
              border: `1px solid ${category === cat ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 20, padding: '6px 16px', fontSize: 12,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'var(--transition)', whiteSpace: 'nowrap',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><Spinner size={36} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No topics found" desc={search ? `No results for "${search}"` : 'No topics available in this category yet.'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map(topic => (
              <TopicCard key={topic.id} topic={topic} onOrder={() => handleOrder(topic)} isLoggedIn={!!user} />
            ))}
          </div>
        )}

        {/* Custom request banner */}
        <div style={{ marginTop: 56, background: 'var(--dark-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Don't see your topic?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Submit a custom request and we'll write it for you.</p>
          </div>
          <button onClick={() => navigate('/request')} style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '12px 28px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'var(--transition)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
          >
            Request Custom Topic <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicCard({ topic, onOrder, isLoggedIn }) {
  return (
    <div style={{ background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'var(--transition)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>{topic.category}</span>
        {topic.available === false && <span style={{ color: 'var(--red)', fontSize: 10, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 10, padding: '2px 8px' }}>Unavailable</span>}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{topic.title}</h3>
      {topic.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{topic.description}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        {topic.pages && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{topic.pages} pages</span>}
        {topic.price && <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>₦{Number(topic.price).toLocaleString()}</span>}
      </div>
      <button onClick={onOrder} disabled={topic.available === false} style={{ background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--gold)', borderRadius: 'var(--radius)', padding: '10px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, cursor: topic.available === false ? 'not-allowed' : 'pointer', transition: 'var(--transition)', opacity: topic.available === false ? 0.5 : 1 }}
        onMouseEnter={e => { if (topic.available !== false) e.currentTarget.style.background = 'var(--gold-glow)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {isLoggedIn ? 'Order This Topic' : 'Sign Up to Order'}
      </button>
    </div>
  );
}
