// src/pages/ServicesPage.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/* ── Service definitions with their exact fields ─────────── */
const SERVICES = [
  {
    icon: '🔬', label: 'Research Projects', path: '/services/research-projects',
    desc: 'Complete research assistance from topic selection to final write-up. We handle literature reviews, methodology, data collection, analysis, and full project documentation.',
    fields: [
      { name: 'topic',    label: 'Research Topic / Area',  type: 'text',   placeholder: 'e.g. Effect of malaria on under-5 children in Lagos', required: true },
      { name: 'level',    label: 'Academic Level',         type: 'select', required: true,
        options: ['OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD','Other'] },
      { name: 'chapters', label: 'Chapters Needed',        type: 'select', required: false,
        options: ['Chapter 1 only','Chapters 1–3','Chapters 1–5 (Full)','Data Analysis only','Full Project + Defence Slides'] },
      { name: 'subject',  label: 'Course / Department',    type: 'text',   placeholder: 'e.g. Nursing Science, Public Health', required: false },
    ],
  },
  {
    icon: '📊', label: 'Data Analysis', path: '/services/data-analysis',
    desc: 'Professional statistical analysis using SPSS, Excel, or other tools. We handle data cleaning, descriptive and inferential statistics, charts, and interpretation.',
    fields: [
      { name: 'software',     label: 'Preferred Software',    type: 'select', required: false,
        options: ['SPSS','Microsoft Excel','R','Stata','Any / Not Sure'] },
      { name: 'dataType',     label: 'Type of Data',          type: 'select', required: true,
        options: ['Questionnaire / Survey data','Secondary / Existing data','Clinical / Lab data','Financial data','Other'] },
      { name: 'sampleSize',   label: 'Sample Size (approx.)', type: 'text',   placeholder: 'e.g. 150 respondents', required: false },
      { name: 'analysisType', label: 'Analysis Needed',       type: 'textarea', placeholder: 'e.g. Frequency tables, chi-square, regression, charts', required: false },
    ],
  },
  {
    icon: '🤝', label: 'Client Care Support', path: '/services/client-care',
    desc: 'Personalised academic and administrative support. We guide you through school processes, form submissions, documentation, and any other challenges you face.',
    fields: [
      { name: 'supportType', label: 'Type of Support Needed', type: 'select', required: true,
        options: ['School registration guidance','Document processing','Academic counselling','Form filling assistance','Result checking','Other'] },
      { name: 'institution', label: 'School / Institution',   type: 'text', placeholder: 'e.g. UNILAG, LASU, Polytechnic Yaba', required: false },
    ],
  },
  {
    icon: '📝', label: 'Academic Assignments', path: '/services/academic-assignments',
    desc: 'Well-researched, properly formatted assignments for any course or level. We cover essays, reports, case studies, term papers, and more.',
    fields: [
      { name: 'assignmentType', label: 'Assignment Type',     type: 'select', required: true,
        options: ['Essay','Term Paper','Case Study','Lab Report','Course Work','Other'] },
      { name: 'course',         label: 'Course / Subject',    type: 'text',   placeholder: 'e.g. Community Health Nursing', required: true },
      { name: 'wordCount',      label: 'Word / Page Count',   type: 'text',   placeholder: 'e.g. 1500 words or 5 pages', required: false },
      { name: 'level',          label: 'Academic Level',      type: 'select', required: false,
        options: ['OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD','Other'] },
    ],
  },
  {
    icon: '🖥️', label: 'Online Registration', path: '/services/online-registration',
    desc: 'Fast and accurate online registration assistance for JAMB, WAEC, NECO, Post-UTME, school portals, professional bodies, and more.',
    fields: [
      { name: 'regType',       label: 'Registration Type',                    type: 'select', required: true,
        options: ['JAMB / UTME','WAEC','NECO','Post-UTME','School Portal','NIN / BVN','Professional Body','Other'] },
      { name: 'candidateName', label: "Candidate's Full Name (if different)", type: 'text', placeholder: 'Leave blank if same as above', required: false },
    ],
  },
  {
    icon: '📑', label: 'PowerPoint Presentation', path: '/services/powerpoint',
    desc: 'Professional, visually appealing presentation slides for seminars, defence, business pitches, conferences, and lectures.',
    fields: [
      { name: 'topic',      label: 'Presentation Topic',             type: 'text',   placeholder: 'e.g. Effect of hypertension in elderly patients', required: true },
      { name: 'slideCount', label: 'Number of Slides (approx.)',     type: 'text',   placeholder: 'e.g. 20 slides', required: false },
      { name: 'purpose',    label: 'Purpose',                        type: 'select', required: true,
        options: ['Project Defence','Seminar / Class presentation','Conference','Business Pitch','Teaching / Lecture','Other'] },
      { name: 'hasContent', label: 'Do you have existing content?',  type: 'select', required: false,
        options: ['Yes — I will provide the write-up','Partial — some notes available','No — please research and create'] },
    ],
  },
  {
    icon: '✏️', label: 'Proofreading & Editing', path: '/services/proofreading',
    desc: 'Thorough proofreading and editing for grammar, spelling, clarity, structure, and academic tone. We handle projects, theses, essays, and any written document.',
    fields: [
      { name: 'docType',      label: 'Document Type',               type: 'select', required: true,
        options: ['Research Project / Thesis','Essay / Assignment','CV / Cover Letter','Business Document','Article / Blog','Other'] },
      { name: 'pageCount',    label: 'Approximate Number of Pages', type: 'text',   placeholder: 'e.g. 30 pages', required: false },
      { name: 'editingLevel', label: 'Level of Editing Needed',     type: 'select', required: false,
        options: ['Light proofread (grammar & spelling only)','Standard edit (grammar + clarity)','Deep edit (structure + rewrite where needed)'] },
    ],
  },
  {
    icon: '📋', label: 'Survey Design & Analysis', path: '/services/survey-design',
    desc: 'End-to-end survey support — questionnaire design, Google Forms / paper setup, data collection strategy, and full statistical analysis of results.',
    fields: [
      { name: 'surveyTopic', label: 'Survey Topic / Research Area', type: 'text',   placeholder: 'e.g. Patient satisfaction in primary health centres', required: true },
      { name: 'service',     label: 'What Do You Need?',            type: 'select', required: true,
        options: ['Design questionnaire only','Analyse existing data only','Both design & analysis','Google Form setup','Full survey package'] },
      { name: 'targetGroup', label: 'Target Respondents',           type: 'text',   placeholder: 'e.g. Final year nursing students', required: false },
      { name: 'sampleSize',  label: 'Expected Sample Size',         type: 'text',   placeholder: 'e.g. 100–200', required: false },
    ],
  },
  {
    icon: '🎓', label: 'WAEC / NECO Scratch Cards', path: '/services/waec-neco',
    desc: 'Quick, reliable scratch card purchase for checking your WAEC or NECO results. Cards are delivered promptly after confirmation.',
    fields: [
      { name: 'cardType',       label: 'Card Type',       type: 'select', required: true,
        options: ['WAEC Result Checker','NECO Result Checker','Both WAEC & NECO'] },
      { name: 'quantity',       label: 'Number of Cards', type: 'select', required: true,
        options: ['1 card','2 cards','3 cards','4 cards','5+ cards'] },
      { name: 'examYear',       label: 'Exam Year',       type: 'text',   placeholder: 'e.g. 2024', required: false },
      { name: 'deliveryMethod', label: 'Delivery Method', type: 'select', required: true,
        options: ['WhatsApp (image)','Email','Pick up in person (Yaba, Lagos)'] },
    ],
  },
];

/* ── Main Page ───────────────────────────────────────────── */
export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const writerUid = searchParams.get('writer') || searchParams.get('ref') || null;

  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm]                       = useState({});
  const [submitted, setSubmitted]             = useState(false);

  const handleServiceClick = (svc) => {
    setSelectedService(svc);
    const init = { details: '', deadline: '' };
    svc.fields.forEach(f => { init[f.name] = ''; });
    setForm(init);
    setTimeout(() => {
      document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = selectedService.fields.filter(f => f.required && !form[f.name]);
    if (missing.length) {
      alert(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    if (!form.details?.trim()) {
      alert('Please describe your request.');
      return;
    }
    const draft = {
      serviceLabel: selectedService.label,
      servicePath:  selectedService.path,
      serviceKey:   selectedService.path.replace('/services/', '').replace(/-/g, '_'),
      description:  form.details.trim(),
      deadline:     form.deadline || null,
      referredBy:   writerUid || null,
      createdAt:    new Date().toISOString(),
      ...Object.fromEntries(selectedService.fields.map(f => [f.name, form[f.name] || ''])),
    };
    localStorage.setItem('pendingServiceRequest', JSON.stringify(draft));
    setSubmitted(true);
    setTimeout(() => {
      navigate(writerUid ? `/register?ref=${writerUid}` : '/register');
    }, 1800);
  };

  return (
    <div style={S.page}>
      <div style={S.bgPattern} />
      <div style={S.container}>

        {writerUid && (
          <div style={S.writerBanner}>
            ✍️ You were referred by a writer — your order will go directly to them.
          </div>
        )}

        <div style={S.header}>
          <p style={S.eyebrow}>What can we help you with?</p>
          <h1 style={S.title}>OUR SERVICES</h1>
          <div style={S.titleUnderline} />
          <p style={S.subtitle}>
            Choose a service, fill in your details, then create a free account — your request goes straight to admin.
          </p>
        </div>

        {/* Services Grid */}
        {!selectedService && !submitted && (
          <div style={S.card}>
            <div style={S.grid}>
              {SERVICES.map((svc, i) => (
                <ServiceCard key={svc.path} svc={svc} index={i} onClick={() => handleServiceClick(svc)} />
              ))}
            </div>
          </div>
        )}

        {/* Request Form */}
        {selectedService && !submitted && (
          <div id="request-form" style={S.formCard}>
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              style={S.backBtn}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              ← Back to Services
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 6px' }}>
              <span style={{ fontSize: 32 }}>{selectedService.icon}</span>
              <h2 style={S.formTitle}>{selectedService.label}</h2>
            </div>
            <p style={S.formSubtitle}>{selectedService.desc}</p>

            <div style={S.infoBox}>
              📋 After submitting, our team will review your request, discuss details &amp; pricing with you, then begin work once agreed.
            </div>

            <form onSubmit={handleSubmit} style={S.form}>
              {selectedService.fields.map(f => (
                <div style={S.fieldGroup} key={f.name}>
                  <label style={S.label}>{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'select' ? (
                    <select name={f.name} value={form[f.name] || ''} onChange={handleChange} style={S.select}
                      onFocus={e => e.target.style.borderColor = '#0D9488'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}>
                      <option value="">-- Select --</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea name={f.name} value={form[f.name] || ''} onChange={handleChange}
                      placeholder={f.placeholder} rows={3} style={S.textarea}
                      onFocus={e => e.target.style.borderColor = '#0D9488'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'} />
                  ) : (
                    <input name={f.name} type={f.type || 'text'} value={form[f.name] || ''} onChange={handleChange}
                      placeholder={f.placeholder} style={S.input}
                      onFocus={e => e.target.style.borderColor = '#0D9488'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'} />
                  )}
                </div>
              ))}

              <div style={S.fieldGroup}>
                <label style={S.label}>Project Details / Description *</label>
                <textarea name="details" value={form.details || ''} onChange={handleChange}
                  placeholder="Describe exactly what you need — the more detail, the better we can help you."
                  required rows={5} style={S.textarea}
                  onFocus={e => e.target.style.borderColor = '#0D9488'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'} />
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Preferred Deadline (optional)</label>
                <input name="deadline" type="date" value={form.deadline || ''} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ ...S.input, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = '#0D9488'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'} />
              </div>

              <button type="submit" style={S.submitBtn}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}>
                📤 Submit Request →
              </button>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '12px 0 0' }}>
                🔒 You will be asked to create a free account to send this request
              </p>
            </form>
          </div>
        )}

        {/* Success */}
        {submitted && (
          <div style={S.successBox}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Request saved!</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              Creating your account now — your request will be sent to admin automatically once you sign up.
            </p>
            <div style={S.spinner} />
          </div>
        )}

        {/* CTA row */}
        {!selectedService && !submitted && (
          <>
            <div style={S.ctaRow}>
              <button style={S.ctaPrimary}
                onClick={() => navigate(writerUid ? `/register?ref=${writerUid}` : '/register')}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0D9488'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.color = '#0D9488'; }}>
                Create Free Account
              </button>
              <button style={S.ctaSecondary}
                onClick={() => navigate('/login')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Sign In
              </button>
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 }}>
              🔒 Select a service above to fill your request, or sign in if you have an account
            </p>
          </>
        )}

      </div>
    </div>
  );
}

/* ── Service Card ────────────────────────────────────────── */
function ServiceCard({ svc, index, onClick }) {
  return (
    <button onClick={onClick}
      style={{ ...S.serviceCard, animationDelay: `${index * 60}ms` }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.18)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{svc.icon}</span>
      <span style={S.serviceLabel}>{svc.label.toUpperCase()}</span>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, flexShrink: 0 }}>→</span>
    </button>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const S = {
  page:         { minHeight: '100vh', background: 'linear-gradient(160deg,#0D4F4A 0%,#0D9488 40%,#0F766E 70%,#134E4A 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px 80px', fontFamily: "'Times New Roman',Georgia,serif", position: 'relative', overflow: 'hidden' },
  bgPattern:    { position: 'absolute', inset: 0, pointerEvents: 'none', background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" },
  container:    { position: 'relative', zIndex: 1, width: '100%', maxWidth: 700 },
  writerBanner: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 20 },
  header:       { textAlign: 'center', marginBottom: 32 },
  eyebrow:      { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' },
  title:        { color: '#fff', fontSize: 'clamp(22px,4vw,36px)', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 12px' },
  titleUnderline: { width: 70, height: 3, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)', margin: '0 auto 16px', borderRadius: 2 },
  subtitle:     { color: 'rgba(255,255,255,0.75)', fontSize: 14, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 },
  card:         { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '24px 16px', backdropFilter: 'blur(8px)', marginBottom: 28 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 },
  serviceCard:  { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%', animation: 'fadeInUp 0.4s ease both' },
  serviceLabel: { flex: 1, color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.4, fontFamily: "'Times New Roman',Georgia,serif" },
  formCard:     { background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '28px 20px', backdropFilter: 'blur(12px)', marginBottom: 28, animation: 'fadeInUp 0.3s ease both' },
  backBtn:      { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, fontFamily: "'Times New Roman',Georgia,serif", cursor: 'pointer', transition: 'all 0.2s' },
  formTitle:    { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
  formSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' },
  infoBox:      { background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.35)', borderRadius: 10, padding: '12px 16px', color: '#5EEAD4', fontSize: 13, marginBottom: 24, lineHeight: 1.6 },
  form:         { display: 'flex', flexDirection: 'column', gap: 18 },
  fieldGroup:   { display: 'flex', flexDirection: 'column', gap: 7 },
  label:        { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' },
  input:        { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: "'Times New Roman',Georgia,serif", outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' },
  select:       { background: 'rgba(20,60,55,0.95)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: "'Times New Roman',Georgia,serif", outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' },
  textarea:     { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: "'Times New Roman',Georgia,serif", outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', lineHeight: 1.6, width: '100%', boxSizing: 'border-box' },
  submitBtn:    { background: '#FFFBEB', color: '#0D9488', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman',Georgia,serif", cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', width: '100%', marginTop: 4 },
  successBox:   { background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(13,148,136,0.5)', borderRadius: 16, padding: '40px 28px', textAlign: 'center', marginBottom: 28 },
  spinner:      { width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#0D9488', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' },
  ctaRow:       { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 },
  ctaPrimary:   { background: '#FFFBEB', color: '#0D9488', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman',Georgia,serif", cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 200 },
  ctaSecondary: { background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, fontFamily: "'Times New Roman',Georgia,serif", cursor: 'pointer', transition: 'all 0.2s', minWidth: 200 },
};

/* ── Keyframes ───────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('svc-page-kf')) {
  const s = document.createElement('style');
  s.id = 'svc-page-kf';
  s.textContent = `
    @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
  `;
  document.head.appendChild(s);
}
