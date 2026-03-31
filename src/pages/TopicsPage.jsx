// src/pages/TopicsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, ArrowRight, SortAsc } from 'lucide-react';
import { subscribeToTopics } from '../firebase/orderService';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState } from '../components/shared/UI';
import { createOrder } from '../firebase/orderService';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Nursing Science',
  'Public Health Nursing',
  'Community Health Nursing',
  'Midwifery',
  'Mental Health / Psychiatric Nursing',
  'Medical Surgical Nursing',
  'Maternal and Child Health',
  'Health Sciences',
  'Public Health',
  'Medicine & Surgery',
  'Pharmacology',
  'Medical Laboratory Science',
  'Nutrition & Dietetics',
  'Environmental Health',
  'Technology',
  'Business',
  'Economics',
  'Sociology',
  'Psychology',
  'Education',
  'Law',
  'Other'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'a-z', label: 'A - Z' },
];

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToTopics(data => {
      setTopics(data.filter(t => t.available !== false));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Live filtered + sorted results
  const filteredTopics = useMemo(() => {
    let result = [...topics];

    // Search (now also matches department/category)
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (category !== 'All') {
      result = result.filter(t => t.category === category);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'a-z':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'newest':
      default:
        result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
    }

    return result;
  }, [topics, search, category, sortBy]);

  const handleOrder = async (topic) => {
    if (!user) {
      navigate('/register');
      return;
    }
    try {
      const orderId = await createOrder({
        clientId: user.uid,
        clientName: profile?.name || user.displayName,
        clientEmail: user.email,
        topicId: topic.id,
        topicTitle: topic.title,
        details: topic.description || '',
        pages: topic.pages || '',
        referredBy: profile?.referredBy || null,
      });
      toast.success('Order placed successfully! Awaiting quote from our team.');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Category counts for chips
  const categoryCounts = useMemo(() => {
    const counts = { All: topics.length };
    CATEGORIES.forEach(cat => {
      if (cat !== 'All') {
        counts[cat] = topics.filter(t => t.category === cat).length;
      }
    });
    return counts;
  }, [topics]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 80 }}>
      {/* Header */}
      <div style={{ background: 'var(--dark-card)', borderBottom: '1px solid var(--border)', padding: '48px clamp(16px,4vw,60px) 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Research Library</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4vw,52px)', fontWeight: 600, marginBottom: 12 }}>Browse Topics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, marginBottom: 32 }}>
            Choose from our curated collection of pre-researched topics. Our writers will customize them to your exact requirements.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 520 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by topic title, keywords, or department..."
              style={{ 
                background: 'var(--dark-elevated)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', 
                padding: '13px 16px 13px 52px', 
                color: 'var(--text-primary)', 
                fontSize: 15, 
                width: '100%',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px clamp(16px,4vw,60px)' }}>
        {/* Filters Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          {/* Category Chips - now scrollable on small screens */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4, flex: 1, scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? 'var(--gold)' : 'var(--dark-card)',
                  color: category === cat ? 'var(--dark)' : 'var(--text-secondary)',
                  border: `1px solid ${category === cat ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 20, 
                  padding: '8px 18px', 
                  fontSize: 13,
                  fontFamily: 'var(--font-body)', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                {cat} 
                {categoryCounts[cat] > 0 && <span style={{ opacity: 0.7, marginLeft: 4 }}>({categoryCounts[cat]})</span>}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
            <SortAsc size={16} color="var(--text-muted)" />
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: 'var(--dark-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
                minWidth: 160
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Showing <strong>{filteredTopics.length}</strong> of <strong>{topics.length}</strong> topics
          {search && ` matching "${search}"`}
          {category !== 'All' && ` in ${category}`}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spinner size={40} />
          </div>
        ) : filteredTopics.length === 0 ? (
          <EmptyState 
            title="No topics found" 
            desc={search || category !== 'All' 
              ? `No results for "${search || category}"` 
              : 'No topics available yet in this category.'} 
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filteredTopics.map(topic => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onOrder={() => handleOrder(topic)} 
                isLoggedIn={!!user} 
              />
            ))}
          </div>
        )}

        {/* Custom Request Banner */}
        <div style={{ marginTop: 80, background: 'var(--dark-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Don't see your perfect topic?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Submit a custom request — we'll research and write it specifically for you.</p>
          </div>
          <button 
            onClick={() => navigate('/request')} 
            style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '12px 28px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Request Custom Topic <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// TopicCard (kept mostly the same with small polish)
function TopicCard({ topic, onOrder, isLoggedIn }) {
  return (
    <div style={{ 
      background: 'var(--dark-card)', 
      border: '1px solid var(--border)', 
      borderRadius: 'var(--radius-lg)', 
      padding: '26px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 14,
      transition: 'var(--transition)'
    }}
      onMouseEnter={e => { 
        e.currentTarget.style.borderColor = 'var(--border-gold)'; 
        e.currentTarget.style.transform = 'translateY(-4px)'; 
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.borderColor = 'var(--border)'; 
        e.currentTarget.style.transform = 'none'; 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{topic.category}</span>
        {topic.price && <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>₦{Number(topic.price).toLocaleString()}</span>}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{topic.title}</h3>
      
      {topic.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {topic.description}
        </p>
      )}

      {topic.pages && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{topic.pages} pages</div>}

      <button 
        onClick={onOrder} 
        disabled={topic.available === false}
        style={{ 
          marginTop: 'auto',
          background: 'transparent', 
          border: '1.5px solid var(--border-gold)', 
          color: 'var(--gold)', 
          borderRadius: 'var(--radius)', 
          padding: '12px 20px', 
          fontSize: 14, 
          fontWeight: 600,
          cursor: topic.available === false ? 'not-allowed' : 'pointer',
          opacity: topic.available === false ? 0.5 : 1,
          transition: 'var(--transition)'
        }}
      >
        {isLoggedIn ? 'Order This Topic →' : 'Sign Up to Order'}
      </button>
    </div>
  );
}
