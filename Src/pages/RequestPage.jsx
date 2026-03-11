// src/pages/RequestPage.jsx
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PenTool, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../firebase/orderService';
import { Field, inputStyle, textareaStyle, Btn } from '../components/shared/UI';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technology', 'Business', 'Economics', 'Sociology', 'Psychology', 'Environmental Science', 'Health', 'Education', 'Law', 'History', 'Literature', 'Other'];
const PAGE_RANGES = ['5–10', '10–15', '15–20', '20–30', '30+', 'Custom'];

export default function RequestPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    if (!user) { navigate('/register'); return; }
    try {
      await createOrder({
        clientId: user.uid,
        clientName: profile?.name || user.displayName,
        clientEmail: user.email,
        customTopic: data.title,
        topicTitle: data.title,
        details: data.details,
        pages: data.pages,
        category: data.category,
        deadline: data.deadline || '',
        additionalNotes: data.notes || '',
      });
      toast.success('Request submitted! We\'ll send you a price quote within 24 hours.');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Submission failed. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 80 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px clamp(16px,4vw,40px) 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'var(--gold-glow)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <PenTool size={22} color="var(--gold)" />
          </div>
          <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Custom Work</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 600, marginBottom: 12 }}>Request a Writer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
            Tell us about your research topic. Our team will review it and send you a price quote within 24 hours. No commitment until you accept.
          </p>
        </div>

        {/* Process reminder */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 40 }}>
          {[['📝','Submit','Fill the form below'],['💬','Get Quote','We reply in 24h'],['💳','Pay 50%','Kick off the work'],['✅','Download','After final payment']].map(([icon, step, desc]) => (
            <div key={step} style={{ background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
              <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{step}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px' }}>
          {!user && (
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 24, fontSize: 13, color: 'var(--gold)' }}>
              ⚠️ You need to <span onClick={() => navigate('/login')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>sign in</span> or <span onClick={() => navigate('/register')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>create an account</span> to submit a request.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Field label="Research Topic Title *" error={errors.title?.message}>
              <input {...register('title', { required: 'Topic title is required', minLength: { value: 10, message: 'Please provide a more descriptive title' } })}
                placeholder="e.g. The Impact of Social Media on Mental Health Among Teenagers"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Category *" error={errors.category?.message}>
                <select {...register('category', { required: 'Please select a category' })}
                  style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Number of Pages *" error={errors.pages?.message}>
                <select {...register('pages', { required: 'Please select page range' })}
                  style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Select range…</option>
                  {PAGE_RANGES.map(p => <option key={p} value={p}>{p} pages</option>)}
                </select>
              </Field>
            </div>

            <Field label="Project Details *" error={errors.details?.message} hint="Describe what you need: key points to cover, style (APA/MLA), academic level, any specific requirements.">
              <textarea {...register('details', { required: 'Please describe your project', minLength: { value: 30, message: 'Please provide more detail (at least 30 characters)' } })}
                placeholder="Describe your research topic in detail. Include key arguments to cover, required citation style, academic level (undergraduate/postgraduate), and any specific sources or data you'd like referenced…"
                style={{ ...textareaStyle, minHeight: 140 }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <Field label="Preferred Deadline" hint="Optional — give us an idea of your timeline.">
              <input {...register('deadline')} type="date"
                min={new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <Field label="Additional Notes">
              <textarea {...register('notes')}
                placeholder="Any other information — formatting preferences, reference materials, etc."
                style={{ ...textareaStyle, minHeight: 80 }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn type="submit" loading={isSubmitting} size="lg">
                Submit Request <ArrowRight size={15} />
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
