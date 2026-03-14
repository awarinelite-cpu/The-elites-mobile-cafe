// src/pages/AIResearchWriterPage.jsx
import { useState, useRef } from 'react';

const CHAPTERS = [
  {
    id: 'ch1',
    title: 'Chapter One',
    subtitle: 'Introduction',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
  },
  {
    id: 'ch2',
    title: 'Chapter Two',
    subtitle: 'Literature Review',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
  },
  {
    id: 'ch3',
    title: 'Chapter Three',
    subtitle: 'Research Methodology',
    color: '#0D9488',
    bg: 'rgba(13,148,136,0.08)',
    border: 'rgba(13,148,136,0.25)',
  },
  {
    id: 'ch4',
    title: 'Chapter Four',
    subtitle: 'Data Presentation & Analysis',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
  },
  {
    id: 'ch5',
    title: 'Chapter Five',
    subtitle: 'Summary, Conclusion & Recommendations',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
  },
];

const CLIENT_CARE_CHAPTERS = [
  { id: 'ch1', title: 'Chapter One',   subtitle: 'Introduction',                              color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.25)'  },
  { id: 'ch2', title: 'Chapter Two',   subtitle: 'Literature Review',                         color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.25)' },
  { id: 'ch3', title: 'Chapter Three', subtitle: 'Client Assessment & Care Planning',         color: '#0D9488', bg: 'rgba(13,148,136,0.08)',  border: 'rgba(13,148,136,0.25)' },
  { id: 'ch4', title: 'Chapter Four',  subtitle: 'Implementation & Evaluation of Care',       color: '#D97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.25)'  },
  { id: 'ch5', title: 'Chapter Five',  subtitle: 'Summary, Conclusion & Recommendations',     color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.25)'  },
];

export default function AIResearchWriterPage() {
  const [topic, setTopic]           = useState('');
  const [objectives, setObjectives] = useState('');
  const [level, setLevel]           = useState('BSc / B.Tech');
  const [department, setDepartment] = useState('');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [pages, setPages]           = useState('65-80');

  const [mode, setMode]                   = useState('research'); // 'research' | 'clientcare'
  const [activeChapter, setActiveChapter] = useState(null);
  const [chapters, setChapters]           = useState({});
  const [loading, setLoading]             = useState(null); // chapter id being generated
  const [generatingAll, setGeneratingAll] = useState(false);
  const [error, setError]                 = useState('');
  const contentRef = useRef(null);

  const canGenerate = topic.trim().length >= 10 && objectives.trim().length >= 20;

  const buildPrompt = (chapterId) => {
    const ch = (mode === 'clientcare' ? CLIENT_CARE_CHAPTERS : CHAPTERS).find(c => c.id === chapterId);
    const objList = objectives.trim();
    const isClientCare = mode === 'clientcare';

    const researchInstructions = {
      ch1: `Write a comprehensive Chapter One (Introduction) for a research project. Include:
- Background of the Study (3-4 paragraphs, detailed historical and contextual background)
- Statement of the Problem (2-3 paragraphs clearly identifying the research gap)
- Purpose / Aim of the Study (1 paragraph)
- Objectives of the Study (list all objectives provided, numbered)
- Research Questions (derive from objectives, numbered)
- Hypotheses (if applicable, derive from objectives)
- Significance of the Study (2-3 paragraphs covering academic, professional and societal impact)
- Scope and Delimitation of the Study (1-2 paragraphs)
- Limitation of the Study (1 paragraph)
- Operational Definition of Terms (define 6-8 key terms relevant to the topic)
- Organization of the Study (brief overview of all 5 chapters)`,

      ch2: `Write a comprehensive Chapter Two (Literature Review) for a research project. Include:
- Introduction (1 paragraph introducing the chapter)
- Conceptual Framework (define and discuss 4-5 key concepts related to the topic with citations)
- Theoretical Framework (discuss 2-3 relevant theories with their proponents and how they relate to the study)
- Empirical Review (review 8-10 related studies from journals, citing authors and years, discussing findings and gaps)
- Summary of Literature Review (1-2 paragraphs summarizing what is known and the gap this study fills)
Use ${citationStyle} citation format throughout. Include in-text citations like (Author, Year) and reference plausible journal sources.`,

      ch3: `Write a comprehensive Chapter Three (Research Methodology) for a research project. Include:
- Introduction (1 paragraph)
- Research Design (describe the design used e.g. descriptive survey, and justify the choice)
- Area of the Study (describe the study setting/location in detail)
- Population of the Study (describe the target population)
- Sample Size and Sampling Technique (calculate sample size using appropriate formula, describe sampling method)
- Instrument for Data Collection (describe the questionnaire/tool, its sections and scoring)
- Validity of the Instrument (face and content validity procedure)
- Reliability of the Instrument (Cronbach's alpha or test-retest, state coefficient e.g. 0.82)
- Method of Data Collection (how data was collected, ethical considerations)
- Method of Data Analysis (statistical tools used e.g. mean, SD, chi-square, SPSS, with decision rule)`,

      ch4: `Write a comprehensive Chapter Four (Data Presentation and Analysis) for a research project. Include:
- Introduction (1 paragraph)
- Demographic Data of Respondents (present in table format: gender, age group, educational qualification, years of experience — use plausible data consistent with the study population, total n=150 or appropriate)
- Presentation of Data According to Research Questions (one section per research question, with a table showing items, Mean, SD, and interpretation — use 2.50 as decision rule for a 4-point Likert scale)
- Testing of Hypotheses (one section per hypothesis, using Chi-square or t-test with calculated value, critical value, df, p-value, and decision)
- Summary of Findings (bulleted list of major findings from the data)
Note: Use plausible but clearly fictional data. Format tables clearly using text/ASCII format.`,

      ch5: `Write a comprehensive Chapter Five (Summary, Conclusion and Recommendations) for a research project. Include:
- Introduction (1 paragraph)
- Summary of the Study (2-3 paragraphs summarizing the entire study from objectives to methodology to findings)
- Conclusion (2-3 paragraphs drawing conclusions from the findings)
- Recommendations (8-10 specific, practical, numbered recommendations based on the findings — directed at appropriate stakeholders)
- Contribution to Knowledge (2-3 paragraphs on the study's unique contribution)
- Suggestions for Further Studies (4-5 numbered suggestions for future researchers)
- References (list 15-20 plausible academic references in ${citationStyle} format, consistent with in-text citations used throughout)`,
    };

    const clientCareInstructions = {
      ch1: `Write a comprehensive Chapter One (Introduction) for a CLIENT CARE STUDY / CASE STUDY in nursing or healthcare. Include:
- Background of the Client / Case (3-4 paragraphs: introduce the patient/client scenario, relevant healthcare context, why this case is significant)
- Statement of the Problem (2-3 paragraphs: identify the client's presenting health problems and the clinical/care gap)
- Purpose of the Study (1 paragraph: what this client care study aims to achieve)
- Objectives of the Care Study (list all provided objectives, numbered)
- Scope of the Study (which care aspects are covered: assessment, planning, implementation, evaluation)
- Significance of the Study (2-3 paragraphs: significance to nursing practice, patient outcomes, and health education)
- Limitation of the Study (1 paragraph)
- Operational Definition of Terms (define 6-8 key clinical/nursing terms)
- Organization of the Study (brief overview of all 5 chapters)`,

      ch2: `Write a comprehensive Chapter Two (Literature Review) for a CLIENT CARE STUDY in nursing/healthcare. Include:
- Introduction (1 paragraph)
- Overview of the Condition/Disease (detailed pathophysiology, epidemiology, causes, risk factors with citations)
- Clinical Manifestations and Assessment Findings (signs and symptoms, diagnostic criteria)
- Nursing Theories and Models (discuss 2-3 nursing theories relevant to the care — e.g. Orem's Self-Care, Roy's Adaptation, Henderson's Need Theory)
- Evidence-Based Nursing Interventions (review 6-8 studies on nursing care practices for this condition)
- Pharmacological Management (discuss relevant drug classes, mechanisms, nursing considerations)
- Multidisciplinary Care Approaches (role of different healthcare professionals)
- Summary of Literature Review (1-2 paragraphs)
Use ${citationStyle} citation format throughout.`,

      ch3: `Write a comprehensive Chapter Three for a CLIENT CARE STUDY — covering Client Assessment and Nursing Care Planning. Include:
- Introduction (1 paragraph)
- Client Profile (bio-data: age, sex, occupation, religion, tribe, marital status, ward/admission details — use a plausible fictional patient)
- Reason for Admission / Chief Complaints
- Medical History (past medical history, family history, social history, drug history, allergies)
- Physical Examination Findings (systematic head-to-toe assessment: vital signs, general appearance, systems review)
- Medical Diagnosis and Investigation Results (laboratory results, imaging — plausible values)
- Nursing Diagnosis (list 5-6 NANDA-approved nursing diagnoses, prioritized by Maslow's hierarchy)
- Nursing Care Plan (for each nursing diagnosis: Goal, Expected Outcomes, Nursing Interventions with Rationale, Evaluation — formatted as a table)`,

      ch4: `Write a comprehensive Chapter Four for a CLIENT CARE STUDY — Implementation of Nursing Care and Evaluation. Include:
- Introduction (1 paragraph)
- Implementation of Nursing Care (narrative account of how each nursing intervention was carried out, day-by-day if appropriate)
- Pharmacological Care Administered (drugs given: name, dose, route, frequency, nursing considerations)
- Patient/Client Education (health teaching provided to client and family: disease, medications, diet, lifestyle, follow-up)
- Multidisciplinary Team Involvement (physiotherapy, dietetics, social work, medical team collaboration)
- Evaluation of Care Outcomes (assess each nursing diagnosis: was the goal met, partially met, or not met? Explain)
- Complications Encountered and Management
- Discharge Planning (discharge summary, home care instructions, referrals, follow-up schedule)`,

      ch5: `Write a comprehensive Chapter Five for a CLIENT CARE STUDY — Summary, Conclusion and Recommendations. Include:
- Introduction (1 paragraph)
- Summary of the Care Study (2-3 paragraphs: summarize the client's condition, care provided, and outcomes)
- Conclusion (2-3 paragraphs: draw conclusions about the effectiveness of the nursing care and lessons learned)
- Recommendations (8-10 specific, numbered recommendations for: nurses, hospital management, patient/family, government health policy)
- Contribution to Nursing Practice (2-3 paragraphs on what this case study contributes to clinical nursing)
- Suggestions for Further Studies (4-5 numbered suggestions for future case studies or research in this area)
- References (list 15-20 plausible academic and clinical references in ${citationStyle} format)`,
    };

    const chapterInstructions = isClientCare ? clientCareInstructions : researchInstructions;

    const modeLabel = isClientCare ? 'Client Care Study (Case Study)' : 'Academic Research Project';
    const topicLabel = isClientCare ? 'CARE STUDY TOPIC / CLIENT CONDITION' : 'RESEARCH TOPIC';
    const objLabel   = isClientCare ? 'CARE OBJECTIVES / STUDY OBJECTIVES' : 'RESEARCH OBJECTIVES';

    return `You are an expert Nigerian nursing and healthcare academic writer with deep knowledge of nursing practice, public health, medicine, and allied health sciences.

Write ${ch.title}: ${ch.subtitle} for the following ${modeLabel}:

${topicLabel}: ${topic}

${objLabel}:
${objList}

ACADEMIC LEVEL: ${level}
DEPARTMENT/FIELD: ${department || 'Nursing Science'}
CITATION STYLE: ${citationStyle}
TARGET LENGTH: Approximately ${pages} pages total for the full document
WRITING MODE: ${modeLabel}

WRITING INSTRUCTIONS:
${chapterInstructions[chapterId]}

IMPORTANT RULES:
- Write in formal academic English
- Use third person throughout
- Write in the context of Nigerian healthcare/education where relevant
- Be thorough and detailed — aim for at least 1500-2500 words for this chapter
- Use proper paragraph breaks and clear headings/subheadings
- Include plausible ${citationStyle} citations where appropriate
- Do NOT include any preamble like "Here is your chapter" — start directly with the chapter heading
${isClientCare ? '- Use realistic but fictional patient/client details\n- Apply nursing process: Assessment, Diagnosis, Planning, Implementation, Evaluation' : ''}

Start with: ${ch.title.toUpperCase()}\n${ch.subtitle.toUpperCase()}`;
  };

  const generateChapter = async (chapterId) => {
    if (!canGenerate) return;
    setLoading(chapterId);
    setError('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: buildPrompt(chapterId) }],
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      setChapters(prev => ({ ...prev, [chapterId]: text }));
      setActiveChapter(chapterId);
    } catch (e) {
      setError(`Failed to generate chapter: ${e.message}`);
    }
    setLoading(null);
  };

  const generateAll = async () => {
    if (!canGenerate) return;
    setGeneratingAll(true);
    setError('');
    for (const ch of activeChapters) {
      setLoading(ch.id);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ role: 'user', content: buildPrompt(ch.id) }],
          }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.content?.find(b => b.type === 'text')?.text || '';
        setChapters(prev => ({ ...prev, [ch.id]: text }));
      } catch (e) {
        setError(`Error on ${ch.title}: ${e.message}`);
        break;
      }
      setLoading(null);
      // Small delay between chapters
      await new Promise(r => setTimeout(r, 1000));
    }
    setLoading(null);
    setGeneratingAll(false);
    setActiveChapter('ch1');
  };

  const copyChapter = (id) => {
    navigator.clipboard.writeText(chapters[id] || '');
    const el = document.createElement('div');
    el.textContent = '📋 Chapter copied!';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0D9488;color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;font-weight:700;z-index:9999;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  };

  const copyAll = () => {
    const all = CHAPTERS.map(ch => chapters[ch.id] || '').filter(Boolean).join('\n\n\n');
    navigator.clipboard.writeText(all);
    const el = document.createElement('div');
    el.textContent = '📋 Full project copied!';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1E3A8A;color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;font-weight:700;z-index:9999;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const downloadAll = () => {
    const all = CHAPTERS.map(ch => chapters[ch.id] || '').filter(Boolean).join('\n\n\n');
    if (!all) return;
    const blob = new Blob([all], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${topic.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g,'').trim()}_research_project.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeChapters = mode === 'clientcare' ? CLIENT_CARE_CHAPTERS : CHAPTERS;
  const generatedCount = activeChapters.filter(c => chapters[c.id]).length;
  const inp = { width: '100%', padding: '11px 14px', background: 'var(--bg-tertiary,#1a2236)', border: '1.5px solid var(--border,#2d3748)', borderRadius: 8, color: 'var(--text-primary,#e2e8f0)', fontFamily: 'var(--font-body,inherit)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#718096)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary,#0f172a)', paddingTop: 64, paddingBottom: 60 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ai-chapter-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .ai-chapter-btn { transition: all 0.2s; }
        .ai-content { white-space: pre-wrap; line-height: 1.85; font-size: 15px; color: var(--text-secondary, #cbd5e0); font-family: 'Times New Roman', Georgia, serif; }
        .ai-content h1, .ai-content h2 { color: var(--text-primary,#e2e8f0); margin: 20px 0 10px; }
      `}</style>

      {/* Header */}
      <div style={{ background: mode === 'clientcare' ? 'linear-gradient(135deg,#7C3AED 0%,#0D9488 100%)' : 'linear-gradient(135deg,#1E3A8A 0%,#0D9488 100%)', padding: '28px 24px', marginBottom: 0, transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>{mode === 'clientcare' ? '🏥' : '🤖'}</div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {mode === 'clientcare' ? 'AI Client Care Study Writer' : 'AI Research Writer'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '3px 0 0' }}>
                  {mode === 'clientcare'
                    ? 'Enter client condition & objectives — AI writes all 5 care study chapters'
                    : 'Enter your topic & objectives — AI writes all 5 research chapters instantly'}
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 4, display: 'flex', gap: 4, alignSelf: 'flex-start', marginTop: 4 }}>
              <button
                onClick={() => { setMode('research'); setChapters({}); setActiveChapter(null); setError(''); }}
                style={{
                  padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: mode === 'research' ? '#fff' : 'transparent',
                  color: mode === 'research' ? '#1E3A8A' : 'rgba(255,255,255,0.75)',
                  fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body,inherit)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                🔬 Research
              </button>
              <button
                onClick={() => { setMode('clientcare'); setChapters({}); setActiveChapter(null); setError(''); }}
                style={{
                  padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: mode === 'clientcare' ? '#fff' : 'transparent',
                  color: mode === 'clientcare' ? '#7C3AED' : 'rgba(255,255,255,0.75)',
                  fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body,inherit)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                🏥 Client Care
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Input Card */}
        <div style={{ background: 'var(--bg-card,#1a2236)', border: '1px solid var(--border-card,#2d3748)', borderRadius: 14, padding: '24px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)', marginBottom: 20 }}>
            {mode === 'clientcare' ? '🏥 Client Care Study Details' : '📝 Research Details'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Topic */}
            <div>
              <label style={lbl}>{mode === 'clientcare' ? 'Client Condition / Care Study Topic *' : 'Research Topic *'}</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={mode === 'clientcare'
                  ? 'e.g. Nursing Care of a 45-Year-Old Male Patient with Type 2 Diabetes Mellitus and Diabetic Foot Ulcer Admitted to the Medical Ward'
                  : 'e.g. Assessment of Knowledge and Practice of Infection Prevention and Control Among Nurses in Lagos State University Teaching Hospital'}
                rows={3}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 11, color: topic.length >= 10 ? '#16A34A' : 'var(--text-muted,#718096)', marginTop: 4 }}>
                {topic.length >= 10 ? '✅ Good topic' : `${topic.length}/10 minimum characters`}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label style={lbl}>{mode === 'clientcare' ? 'Care Study Objectives *' : 'Research Objectives *'}</label>
              <textarea
                value={objectives}
                onChange={e => setObjectives(e.target.value)}
                placeholder={mode === 'clientcare'
                  ? `List your care study objectives, one per line. e.g.
1. To assess the health status and care needs of the client
2. To identify relevant nursing diagnoses using NANDA taxonomy
3. To plan and implement evidence-based nursing interventions
4. To evaluate the effectiveness of nursing care provided
5. To educate the client and family on self-management`
                  : `List your objectives, one per line. e.g.
1. To assess the level of knowledge of infection prevention among nurses
2. To determine the practice of standard precautions among nurses
3. To identify factors influencing infection control practices
4. To examine the relationship between training and IPC compliance`}
                rows={6}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }}
              />
              <div style={{ fontSize: 11, color: objectives.length >= 20 ? '#16A34A' : 'var(--text-muted,#718096)', marginTop: 4 }}>
                {objectives.length >= 20 ? '✅ Objectives set' : `${objectives.length}/20 minimum characters`}
              </div>
            </div>

            {/* Row: Level + Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Academic Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} style={inp}>
                  {['OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>{mode === 'clientcare' ? 'Ward / Specialty' : 'Department / Field'}</label>
                <input value={department} onChange={e => setDepartment(e.target.value)}
                  placeholder={mode === 'clientcare' ? 'e.g. Medical Ward, Surgical Unit' : 'e.g. Nursing Science'}
                  style={inp} />
              </div>
            </div>

            {/* Row: Citation + Pages */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Citation Style</label>
                <select value={citationStyle} onChange={e => setCitationStyle(e.target.value)} style={inp}>
                  {['APA','MLA','Harvard','Vancouver','Chicago'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Project Length</label>
                <select value={pages} onChange={e => setPages(e.target.value)} style={inp}>
                  {['30-40 pages','40-50 pages','50-65 pages','65-80 pages','80-100 pages'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#EF4444', fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        {/* Generate All Button */}
        <button
          onClick={generateAll}
          disabled={!canGenerate || generatingAll || loading !== null}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            background: canGenerate && !generatingAll && !loading
              ? 'linear-gradient(135deg,#1E3A8A,#0D9488)'
              : 'rgba(45,55,72,0.6)',
            color: canGenerate ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body,inherit)',
            cursor: canGenerate && !generatingAll && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 20, transition: 'all 0.2s',
          }}>
          {generatingAll ? (
            <>
              <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Generating {CHAPTERS.find(c => c.id === loading)?.title || '…'}
            </>
          ) : mode === 'clientcare' ? '🏥 Generate All 5 Care Study Chapters' : '🚀 Generate All 5 Chapters At Once'}
        </button>

        {/* Chapter Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
          {CHAPTERS.map(ch => {
            const done = !!chapters[ch.id];
            const isLoading = loading === ch.id;
            return (
              <button key={ch.id}
                className="ai-chapter-btn"
                onClick={() => done ? setActiveChapter(ch.id) : generateChapter(ch.id)}
                disabled={!canGenerate || (loading !== null && !isLoading)}
                style={{
                  padding: '10px 6px', borderRadius: 10, border: `2px solid ${activeChapter === ch.id ? ch.color : done ? ch.border : 'var(--border,#2d3748)'}`,
                  background: activeChapter === ch.id ? ch.bg : done ? `${ch.bg}` : 'var(--bg-card,#1a2236)',
                  color: done ? ch.color : 'var(--text-muted,#718096)',
                  cursor: canGenerate && (loading === null || isLoading) ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body,inherit)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                {isLoading ? (
                  <div style={{ width: 18, height: 18, border: `2px solid ${ch.color}40`, borderTop: `2px solid ${ch.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <span style={{ fontSize: 16 }}>{done ? '✅' : '✍️'}</span>
                )}
                <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                  {ch.title.replace('Chapter ', 'Ch.')}
                </span>
                <span style={{ fontSize: 9, opacity: 0.7, textAlign: 'center', lineHeight: 1.2 }}>{ch.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        {generatedCount > 0 && (
          <div style={{ background: 'var(--bg-card,#1a2236)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: '1px solid var(--border-card,#2d3748)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)' }}>
                {generatedCount}/5 chapters generated
              </span>
              {generatedCount === 5 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyAll}
                    style={{ background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    📋 Copy All
                  </button>
                  <button onClick={downloadAll}
                    style={{ background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    ⬇️ Download .txt
                  </button>
                </div>
              )}
            </div>
            <div style={{ background: 'var(--bg-tertiary,#2d3748)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(generatedCount / 5) * 100}%`, background: 'linear-gradient(90deg,#1E3A8A,#0D9488)', borderRadius: 20, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Chapter Content Viewer */}
        {activeChapter && chapters[activeChapter] && (() => {
          const ch = CHAPTERS.find(c => c.id === activeChapter);
          return (
            <div style={{ background: 'var(--bg-card,#1a2236)', border: `2px solid ${ch.border}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Chapter header */}
              <div style={{ background: ch.bg, borderBottom: `1px solid ${ch.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: ch.color }}>{ch.title}: {ch.subtitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted,#718096)', marginTop: 2 }}>
                    {chapters[activeChapter].split(' ').length.toLocaleString()} words · {Math.ceil(chapters[activeChapter].split(' ').length / 250)} min read
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyChapter(activeChapter)}
                    style={{ background: ch.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📋 Copy
                  </button>
                  <button onClick={() => generateChapter(activeChapter)}
                    disabled={loading !== null}
                    style={{ background: 'transparent', color: ch.color, border: `1.5px solid ${ch.color}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🔄 Regenerate
                  </button>
                </div>
              </div>

              {/* Editable content */}
              <div style={{ padding: '24px 28px' }} ref={contentRef}>
                <textarea
                  value={chapters[activeChapter]}
                  onChange={e => setChapters(prev => ({ ...prev, [activeChapter]: e.target.value }))}
                  style={{
                    width: '100%', minHeight: 600, background: 'transparent',
                    border: 'none', outline: 'none', resize: 'vertical',
                    color: 'var(--text-secondary,#cbd5e0)',
                    fontFamily: "'Times New Roman', Georgia, serif",
                    fontSize: 15, lineHeight: 1.9, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* Empty state */}
        {!activeChapter && generatedCount === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card,#1a2236)', borderRadius: 14, border: '1px solid var(--border-card,#2d3748)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🤖</div>
            <h3 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 20, color: 'var(--text-primary,#e2e8f0)', marginBottom: 8 }}>
              {mode === 'clientcare' ? 'Ready to Write Care Study' : 'Ready to Write'}
            </h3>
            <p style={{ color: 'var(--text-muted,#718096)', fontSize: 14, maxWidth: 440, margin: '0 auto 24px' }}>
              {mode === 'clientcare'
                ? <>Fill in the client condition and care objectives above, then click <strong style={{ color: '#7C3AED' }}>Generate All 5 Care Study Chapters</strong>.</>
                : <>Fill in your research topic and objectives above, then click <strong style={{ color: '#0D9488' }}>Generate All 5 Chapters</strong> or select individual chapters.</>
              }
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {activeChapters.map(ch => (
                <div key={ch.id} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${ch.border}`, fontSize: 12, fontWeight: 600, color: ch.color, background: ch.bg }}>
                  {ch.title}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
