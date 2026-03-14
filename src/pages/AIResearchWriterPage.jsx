// src/pages/AIResearchWriterPage.jsx
import { useState, useRef } from 'react';

const RESEARCH_CHAPTERS = [
  { id: 'ch1', title: 'Chapter One',   subtitle: 'Introduction',                           color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)'  },
  { id: 'ch2', title: 'Chapter Two',   subtitle: 'Literature Review',                      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  { id: 'ch3', title: 'Chapter Three', subtitle: 'Research Methodology',                   color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.25)' },
  { id: 'ch4', title: 'Chapter Four',  subtitle: 'Data Presentation & Analysis',           color: '#D97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)'  },
  { id: 'ch5', title: 'Chapter Five',  subtitle: 'Summary, Conclusion & Recommendations',  color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)'  },
];

const CLIENT_CARE_CHAPTERS = [
  { id: 'ch1', title: 'Chapter One',   subtitle: 'Introduction',                           color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)'  },
  { id: 'ch2', title: 'Chapter Two',   subtitle: 'Literature Review',                      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  { id: 'ch3', title: 'Chapter Three', subtitle: 'Client Assessment & Nursing Care Plan',  color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.25)' },
];

export default function AIResearchWriterPage() {
  const [topic, setTopic]               = useState('');
  const [objectives, setObjectives]     = useState('');
  const [level, setLevel]               = useState('BSc / B.Tech');
  const [department, setDepartment]     = useState('');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [chapterPages, setChapterPages] = useState({
    ch1: '10-15', ch2: '15-20', ch3: '15-20', ch4: '15-20', ch5: '10-15', // edit freely e.g. 1-4
  });
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [mode, setMode]                 = useState('research');
  const [guideDoc, setGuideDoc]         = useState('');         // pasted guide text
  const [guideFileName, setGuideFileName] = useState('');      // uploaded file name
  const [showGuide, setShowGuide]       = useState(false);

  const [activeChapter, setActiveChapter] = useState(null);
  const [chapters, setChapters]           = useState({});
  const [loading, setLoading]             = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [error, setError]                 = useState('');
  const contentRef = useRef(null);

  const activeChapters = mode === 'clientcare' ? CLIENT_CARE_CHAPTERS : RESEARCH_CHAPTERS;
  const totalChapters  = activeChapters.length;
  const canGenerate    = topic.trim().length >= 10 && objectives.trim().length >= 20;
  const generatedCount = activeChapters.filter(c => chapters[c.id]).length;

  // ── Read uploaded guide file ─────────────────────────────────
  const handleGuideFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert('Guide document must be under 500KB.'); return; }
    setGuideFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setGuideDoc(reader.result || '');
    reader.readAsText(file);
  };

  // ── Build prompt ─────────────────────────────────────────────
  const buildPrompt = (chapterId) => {
    const ch = activeChapters.find(c => c.id === chapterId);
    const isCC = mode === 'clientcare';
    const guideSection = guideDoc.trim()
      ? `\nGUIDE DOCUMENT (use this as a structural and stylistic template — adapt content to the new topic):\n"""\n${guideDoc.trim().slice(0, 3000)}${guideDoc.length > 3000 ? '\n[...truncated for length]' : ''}\n"""\n`
      : '';

    const citationRules = `
CITATION RULES (STRICTLY ENFORCED):
- Use ONLY real, verifiable academic sources published from 2021 onwards
- Every in-text citation must be in ${citationStyle} 7th edition format: (Author, Year) or Author (Year)
- Do NOT invent or fabricate author names, journal titles, volume numbers, or article titles
- Only cite sources that genuinely exist — preferred journals include:
  * Journal of Advanced Nursing, Nurse Education Today, BMC Nursing, International Journal of Nursing Studies, Nursing Open
  * The Lancet, BMJ, JAMA, PLOS ONE, New England Journal of Medicine
  * African Journal of Nursing and Midwifery, West African Journal of Nursing, Nigerian Journal of Medicine
  * World Health Organization (WHO) reports, Federal Ministry of Health Nigeria reports (2021–2025)
- If you are uncertain whether a specific source exists, paraphrase the idea in your own words without citing
- ALL references must be formatted in APA 7th edition:
  Author, A. A., & Author, B. B. (Year). Title of article in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx
- References must be dated 2021–2025 unless citing foundational nursing theories (e.g. Orem, 1991; Roy, 1984)

ANTI-PLAGIARISM RULES (TARGET: 0–5% SIMILARITY):
- NEVER copy, reproduce, or closely paraphrase any sentence from any existing published source
- Express ALL ideas, concepts, and research findings entirely in your own original words and sentence structures
- When referencing a researcher's finding, describe WHAT they found using completely different sentence construction from the original — e.g. "Adeyemi et al. (2023) established that..." then explain the finding in fresh language
- Vary sentence length and structure throughout — mix short punchy sentences with longer analytical ones
- Use active AND passive voice strategically — not exclusively passive (which is a plagiarism tell)
- Avoid formulaic academic clichés such as: "It is worth noting that...", "In the light of the foregoing...", "It is evident that...", "This study therefore seeks to..."
- Instead of clichés, write naturally as a knowledgeable clinician explaining concepts to a peer
- Each paragraph must flow organically from the previous — use transition phrases that fit the specific content
- Do NOT start multiple consecutive sentences or paragraphs with the same word or structure
- Use discipline-specific vocabulary correctly but blend it with accessible explanatory language
- Write as if explaining to a knowledgeable colleague — precise, thoughtful, and original
- Paraphrase all concepts in fresh language — if a concept has been expressed in a particular way in literature, find a completely different way to say it
- Add the writer's own analytical commentary after citing each source — do not just string citations together`;

    const researchInstructions = {
      ch1: `Write a comprehensive CHAPTER ONE: INTRODUCTION for an academic research project. Include ALL of these sections with proper subheadings:

1.1 Background of the Study — 3–4 paragraphs of detailed historical and contextual background with ${citationStyle} citations
1.2 Statement of the Problem — 2–3 paragraphs identifying the specific research gap
1.3 Purpose / Aim of the Study — 1 paragraph
1.4 Objectives of the Study — list ALL provided objectives, numbered
1.5 Research Questions — derive one per objective, numbered
1.6 Hypotheses — derive testable hypotheses from objectives (where applicable)
1.7 Significance of the Study — 2–3 paragraphs: academic, professional, societal significance
1.8 Scope and Delimitation — 1–2 paragraphs
1.9 Limitation of the Study — 1 paragraph
1.10 Operational Definition of Terms — define 6–8 key terms from the topic
1.11 Organization of the Study — brief overview of all ${totalChapters} chapters`,

      ch2: `Write a comprehensive CHAPTER TWO: LITERATURE REVIEW for an academic research project. Include ALL of these sections:

2.1 Introduction — 1 paragraph
2.2 Conceptual Framework — define and discuss 4–5 key concepts with APA 7th ed. citations (2021–2025)
2.3 Theoretical Framework — discuss 2–3 relevant theories (state proponent, year, relevance to study)
2.4 Empirical Review — review 8–10 real studies from peer-reviewed journals (2021–2025), discussing methodology, findings, and gaps
2.5 Summary of Literature Review — 1–2 paragraphs on what is known and the gap this study fills
2.6 References — list ALL cited works in APA 7th edition format (2021–2025 only, except foundational theories)`,

      ch3: `Write a comprehensive CHAPTER THREE: RESEARCH METHODOLOGY. Include ALL sections:

3.1 Introduction — 1 paragraph
3.2 Research Design — describe the design (e.g. descriptive cross-sectional survey) and justify
3.3 Area of the Study — describe the research setting/location in detail
3.4 Population of the Study — describe the target population
3.5 Sample Size and Sampling Technique — calculate using Taro Yamane or equivalent formula; describe sampling method
3.6 Instrument for Data Collection — describe questionnaire sections and scoring (e.g. 4-point Likert)
3.7 Validity of the Instrument — face and content validity procedure
3.8 Reliability of the Instrument — Cronbach's alpha (state a coefficient e.g. r = 0.84)
3.9 Method of Data Collection — how data was collected, ethical approval, confidentiality
3.10 Method of Data Analysis — statistical tools (mean, SD, chi-square, SPSS version), decision rule (e.g. mean ≥ 2.50)`,

      ch4: `Write a comprehensive CHAPTER FOUR: DATA PRESENTATION AND ANALYSIS. Include:

4.1 Introduction — 1 paragraph
4.2 Demographic Data — table: gender, age group, qualification, years of experience (n=150, plausible data)
4.3 Presentation by Research Questions — one sub-section per research question with a Mean/SD table and interpretation
4.4 Hypothesis Testing — Chi-square or t-test for each hypothesis (calculated value, critical value, df, p-value, decision)
4.5 Summary of Findings — bulleted list of all major findings

Note: Use plausible but clearly fictional data. Format all tables clearly in plain text/ASCII.`,

      ch5: `Write a comprehensive CHAPTER FIVE: SUMMARY, CONCLUSION AND RECOMMENDATIONS. Include:

5.1 Introduction — 1 paragraph
5.2 Summary of the Study — 2–3 paragraphs covering objectives, methodology, key findings
5.3 Conclusion — 2–3 paragraphs drawing from findings
5.4 Recommendations — 8–10 specific, numbered, practical recommendations to relevant stakeholders
5.5 Contribution to Knowledge — 2–3 paragraphs on the study's unique contribution
5.6 Suggestions for Further Studies — 4–5 numbered future research directions
5.7 References — full reference list in APA 7th edition (2021–2025), 15–20 entries`,
    };

    const clientCareInstructions = {
      ch1: `Write a comprehensive CHAPTER ONE: INTRODUCTION for a Client Care Study / Case Study in nursing. Include ALL sections:

1.1 Background of the Case — 3–4 paragraphs introducing the clinical condition, its burden in Nigeria, why this case is significant (cite APA 7th ed. sources, 2021–2025)
1.2 Statement of the Problem — 2–3 paragraphs identifying the patient's presenting problems and clinical nursing gap
1.3 Purpose of the Study — 1 paragraph stating what this care study aims to achieve
1.4 Objectives of the Care Study — list ALL provided objectives, numbered
1.5 Scope of the Study — care aspects covered (assessment, diagnosis, planning, implementation, evaluation)
1.6 Significance of the Study — 2–3 paragraphs: significance to nursing practice, patient outcomes, healthcare education
1.7 Limitation of the Study — 1 paragraph
1.8 Operational Definition of Terms — define 6–8 key clinical and nursing terms
1.9 Organization of the Study — brief overview of all 3 chapters`,

      ch2: `Write a comprehensive CHAPTER TWO: LITERATURE REVIEW for a Client Care Study. Include ALL sections:

2.1 Introduction — 1 paragraph
2.2 Overview of the Condition — detailed pathophysiology, epidemiology (especially Nigerian/African data), aetiology and risk factors (APA 7th ed., 2021–2025)
2.3 Clinical Manifestations and Assessment — signs, symptoms, diagnostic criteria
2.4 Nursing Theories and Models — discuss 2–3 nursing theories directly applicable to this case (e.g. Orem's Self-Care Deficit Theory, Roy's Adaptation Model, Henderson's 14 Needs — state proponent and year)
2.5 Evidence-Based Nursing Interventions — review 6–8 real studies (peer-reviewed journals, 2021–2025) on nursing care for this condition; discuss methodology, findings, clinical implications
2.6 Pharmacological Management — drug classes used, mechanisms of action, nursing considerations
2.7 Multidisciplinary Team Involvement — roles of physicians, physiotherapists, dieticians, social workers
2.8 Summary of Literature Review — 1–2 paragraphs on what is known and gaps addressed by this study
2.9 References — full APA 7th edition reference list (2021–2025), 15–20 entries`,

      ch3: `Write a comprehensive CHAPTER THREE: CLIENT ASSESSMENT AND NURSING CARE PLAN. Include ALL sections:

3.1 Introduction — 1 paragraph
3.2 Client Profile / Bio-data — plausible fictional patient: name (initials only), age, sex, occupation, religion, tribe, marital status, ward, date of admission, reason for admission
3.3 Chief Complaints — patient's presenting complaints on admission
3.4 Medical History — past medical/surgical history, family history, social history, drug history, known allergies
3.5 Physical Examination — systematic head-to-toe assessment: vital signs (BP, temp, pulse, RR, SpO2), general appearance, each body system reviewed
3.6 Medical Diagnosis and Investigation Results — plausible lab values (FBC, electrolytes, RBS, urinalysis, imaging) with interpretation
3.7 Nursing Diagnoses — list 5–6 NANDA-approved nursing diagnoses, prioritized by Maslow's hierarchy of needs
3.8 Nursing Care Plan — formatted table for each nursing diagnosis:
    | Nursing Diagnosis | Goal | Expected Outcomes | Nursing Interventions | Rationale | Evaluation |
    Include evidence-based rationale with APA 7th ed. citations (2021–2025)
3.9 Discharge Plan — discharge instructions, medications, diet, lifestyle, follow-up, referrals
3.10 References — full APA 7th edition reference list for all citations used in this chapter (2021–2025)`,
    };

    const instructions = isCC ? clientCareInstructions : researchInstructions;
    const modeLabel = isCC ? 'Client Care Study (Case Study)' : 'Academic Research Project';
    const topicLbl  = isCC ? 'CARE STUDY TOPIC / CLIENT CONDITION' : 'RESEARCH TOPIC';
    const objLbl    = isCC ? 'CARE STUDY OBJECTIVES' : 'RESEARCH OBJECTIVES';

    return `You are a highly experienced Nigerian nursing and healthcare academic writer with 20 years of research and clinical experience. You write entirely in your own natural, human voice — never using AI-sounding sentence patterns or plagiarised phrasing.

Your writing philosophy: original thought expressed clearly, evidence used to support YOUR analysis (not replace it), and every sentence crafted fresh for this specific topic. A plagiarism checker must return 0–5% similarity.

You write at ${level} level for the ${department || 'Nursing Science'} department.

Write ${ch.title.toUpperCase()}: ${ch.subtitle.toUpperCase()} for the following ${modeLabel}.

${topicLbl}: ${topic}

${objLbl}:
${objectives.trim()}

ACADEMIC LEVEL: ${level}
DEPARTMENT/FIELD: ${department || 'Nursing Science'}
TARGET LENGTH FOR THIS CHAPTER: Approximately ${chapterPages[chapterId] || '10-15'} pages
WRITING MODE: ${modeLabel}
${guideSection}
CHAPTER INSTRUCTIONS:
${instructions[chapterId]}

${citationRules}

WRITING STANDARDS & HUMAN LANGUAGE STYLE:
- Write entirely in formal academic English, third person throughout
- Nigerian healthcare and educational context where relevant
- Minimum 1,500–2,500 words for this chapter
- Use numbered subheadings exactly as listed in the instructions (1.1, 1.2, etc.)
- Never start with preamble like "Here is your chapter" — begin directly with the chapter title
- For care studies: use realistic but clearly fictional patient details (initials only for name)

HUMAN WRITING STYLE (critical for 0–5% plagiarism target):
- Write exactly as a highly educated human Nigerian nurse/researcher would write — thoughtful, measured, and original
- Every sentence must be freshly constructed — no recycled academic sentence templates
- Vary your sentence openings: do NOT start more than two consecutive sentences with the same word
- Show intellectual engagement: after presenting a fact or citation, add a brief analytical remark showing what it means for the Nigerian context
- Use connective phrases that feel natural, not mechanical: "This pattern suggests...", "What emerges from these findings is...", "A closer look reveals...", "The implication for practice is..."
- Write background sections like a storyteller building context — not like a list of facts
- Write methodology sections with the confidence of someone who has actually conducted the study
- Embed your unique voice: slight variation in formality across sections is acceptable and human
- Do NOT use AI-signature phrases such as: "It is important to note", "Furthermore, it should be noted", "In conclusion, it can be seen", "As previously mentioned", "In summary, this section has..."
- Produce text that reads as naturally as a well-written journal article or thesis — the kind that a lecturer would not flag as AI-generated

Begin now with: ${ch.title.toUpperCase()}
${ch.subtitle.toUpperCase()}`;
  };

  // ── Generate single chapter ──────────────────────────────────
  const generateChapter = async (chapterId) => {
    if (!canGenerate) return;
    setLoading(chapterId);
    setError('');
    const missingKey = !import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (missingKey) {
      setError('VITE_ANTHROPIC_API_KEY is not set. Add it to your Render environment variables and redeploy.');
      setLoading(null);
      return;
    }
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          messages: [{ role: 'user', content: buildPrompt(chapterId) }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      setChapters(prev => ({ ...prev, [chapterId]: text }));
      setActiveChapter(chapterId);
    } catch (e) { setError(`Failed: ${e.message}`); }
    setLoading(null);
  };

  // ── Generate all chapters ────────────────────────────────────
  const generateAll = async () => {
    if (!canGenerate) return;
    setGeneratingAll(true);
    setError('');
    for (const ch of activeChapters) {
      setLoading(ch.id);
      try {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 6000,
            messages: [{ role: 'user', content: buildPrompt(ch.id) }],
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.content?.find(b => b.type === 'text')?.text || '';
        setChapters(prev => ({ ...prev, [ch.id]: text }));
      } catch (e) { setError(`Error on ${ch.title}: ${e.message}`); break; }
      setLoading(null);
      await new Promise(r => setTimeout(r, 800));
    }
    setLoading(null);
    setGeneratingAll(false);
    setActiveChapter('ch1');
  };

  const toast = (msg, bg = '#0D9488') => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  const copyChapter = (id) => { navigator.clipboard.writeText(chapters[id] || ''); toast('📋 Chapter copied!'); };
  const copyAll     = () => {
    const all = activeChapters.map(c => chapters[c.id] || '').filter(Boolean).join('\n\n\n');
    navigator.clipboard.writeText(all);
    toast('📋 Full document copied!', '#1E3A8A');
  };
  const downloadAll = () => {
    const all = activeChapters.map(c => chapters[c.id] || '').filter(Boolean).join('\n\n\n');
    if (!all) return;
    const blob = new Blob([all], { type: 'text/plain' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${topic.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim()}_${mode}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Download as .docx ────────────────────────────────────────
  const downloadDocx = async () => {
    const allContent = activeChapters.map(c => chapters[c.id] || '').filter(Boolean);
    if (!allContent.length) return;
    setDownloadingDocx(true);

    try {
      // Load docx library from CDN if not already loaded
      if (!window.docx) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel,
        AlignmentType, PageNumber, NumberFormat, Footer,
        LevelFormat, BorderStyle
      } = window.docx;

      // Helper: convert plain text chapter into docx paragraphs
      const textToParas = (text) => {
        const lines = text.split('\n');
        const paras = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) { paras.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } })); continue; }

          // Chapter title (ALL CAPS, short)
          if (/^CHAPTER (ONE|TWO|THREE|FOUR|FIVE)$/i.test(trimmed)) {
            paras.push(new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: trimmed.toUpperCase(), bold: true, size: 32, font: 'Times New Roman' })],
              spacing: { before: 480, after: 240 },
            }));
            continue;
          }
          // Chapter subtitle (ALL CAPS after chapter title)
          if (/^(INTRODUCTION|LITERATURE REVIEW|RESEARCH METHODOLOGY|DATA PRESENTATION|SUMMARY|CLIENT ASSESSMENT|NURSING CARE)/.test(trimmed.toUpperCase()) && trimmed === trimmed.toUpperCase() && trimmed.length < 80) {
            paras.push(new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: trimmed, bold: true, size: 28, font: 'Times New Roman' })],
              spacing: { before: 120, after: 360 },
            }));
            continue;
          }
          // Numbered subheading (1.1, 2.3, etc.)
          if (/^\d+\.\d+/.test(trimmed)) {
            paras.push(new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: trimmed, bold: true, size: 26, font: 'Times New Roman' })],
              spacing: { before: 280, after: 120 },
            }));
            continue;
          }
          // Numbered section heading only (1., 2., etc.)
          if (/^\d+\.\s/.test(trimmed) && trimmed.length < 80) {
            paras.push(new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: trimmed, bold: true, size: 24, font: 'Times New Roman' })],
              spacing: { before: 200, after: 100 },
            }));
            continue;
          }
          // Table row (contains | characters)
          if (trimmed.includes('|') && trimmed.startsWith('|')) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: 'Courier New', size: 20 })],
              spacing: { after: 60 },
            }));
            continue;
          }
          // References line (Author, Year format)
          if (/^[A-Z][a-z]+,\s[A-Z]\./.test(trimmed)) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: 'Times New Roman', size: 24 })],
              indent: { left: 720, hanging: 720 },
              spacing: { after: 120 },
            }));
            continue;
          }
          // Regular paragraph
          paras.push(new Paragraph({
            children: [new TextRun({ text: trimmed, font: 'Times New Roman', size: 24 })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200, line: 480 }, // double spacing (480 = 2x 240)
            indent: { firstLine: 720 }, // 0.5 inch indent
          }));
        }
        return paras;
      };

      // Build title page
      const titlePageParas = [
        new Paragraph({ children: [new TextRun('')], spacing: { after: 1440 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: topic || 'Research Project', bold: true, size: 32, font: 'Times New Roman' })],
          spacing: { after: 480 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: mode === 'clientcare' ? 'A CLIENT CARE STUDY' : 'A RESEARCH PROJECT', bold: true, size: 26, font: 'Times New Roman' })],
          spacing: { after: 240 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Department of ${department || 'Nursing Science'}`, size: 24, font: 'Times New Roman' })],
          spacing: { after: 120 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: level, size: 24, font: 'Times New Roman' })],
          spacing: { after: 120 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: new Date().getFullYear().toString(), size: 24, font: 'Times New Roman' })],
          spacing: { after: 120 },
        }),
      ];

      // Build all chapter paragraphs
      const allParas = [...titlePageParas];
      for (const ch of activeChapters) {
        if (chapters[ch.id]) {
          allParas.push(...textToParas(chapters[ch.id]));
          allParas.push(new Paragraph({ children: [new TextRun('')], pageBreakBefore: true, spacing: { after: 0 } }));
        }
      }

      const doc = new Document({
        styles: {
          default: { document: { run: { font: 'Times New Roman', size: 24 } } },
          paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 32, bold: true, font: 'Times New Roman', color: '000000' },
              paragraph: { spacing: { before: 480, after: 240 }, alignment: AlignmentType.CENTER, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 26, bold: true, font: 'Times New Roman', color: '000000' },
              paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
          ],
        },
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }, // 1.25" left
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
            },
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 }),
                ],
              })],
            }),
          },
          children: allParas,
        }],
      });

      const buffer = await Packer.toBlob(doc);
      const url    = URL.createObjectURL(buffer);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `${(topic || 'document').slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, '').trim()}_${mode}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast('✅ Downloaded as .docx!', '#16A34A');
    } catch (e) {
      console.error(e);
      toast('❌ DOCX failed — downloading .txt instead', '#DC2626');
      downloadAll();
    }
    setDownloadingDocx(false);
  };

  const inp = { width: '100%', padding: '11px 14px', background: 'var(--bg-tertiary,#1a2236)', border: '1.5px solid var(--border,#2d3748)', borderRadius: 8, color: 'var(--text-primary,#e2e8f0)', fontFamily: 'var(--font-body,inherit)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#718096)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
  const accentColor = mode === 'clientcare' ? '#7C3AED' : '#0D9488';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary,#0f172a)', paddingTop: 64, paddingBottom: 60 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ai-ch-btn { transition: all 0.2s; }
        .ai-ch-btn:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.9; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: mode === 'clientcare' ? 'linear-gradient(135deg,#7C3AED,#0D9488)' : 'linear-gradient(135deg,#1E3A8A,#0D9488)', padding: '24px 20px', transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 30 }}>{mode === 'clientcare' ? '🏥' : '🤖'}</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 'clamp(17px,3vw,24px)', fontWeight: 700, color: '#fff', margin: 0 }}>
                {mode === 'clientcare' ? 'AI Client Care Study Writer' : 'AI Research Writer'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '3px 0 0' }}>
                {mode === 'clientcare' ? `${totalChapters} chapters · APA 7th ed. (2021–2025)` : `${totalChapters} chapters · APA 7th ed. (2021–2025) · verified sources`}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, display: 'flex', gap: 3 }}>
            {[['research','🔬 Research','#1E3A8A'],['clientcare','🏥 Client Care','#7C3AED']].map(([m, label, col]) => (
              <button key={m} onClick={() => { setMode(m); setChapters({}); setActiveChapter(null); setError(''); }}
                style={{ padding: '7px 13px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body,inherit)', transition: 'all 0.2s', whiteSpace: 'nowrap', background: mode === m ? '#fff' : 'transparent', color: mode === m ? col : 'rgba(255,255,255,0.75)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Input Card ── */}
        <div style={{ background: 'var(--bg-card,#1a2236)', border: '1px solid var(--border-card,#2d3748)', borderRadius: 14, padding: '22px' }}>
          <h2 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)', marginBottom: 18 }}>
            {mode === 'clientcare' ? '🏥 Care Study Details' : '📝 Research Details'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

            {/* Topic */}
            <div>
              <label style={lbl}>{mode === 'clientcare' ? 'Client Condition / Care Study Topic *' : 'Research Topic *'}</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={3}
                placeholder={mode === 'clientcare'
                  ? 'e.g. Nursing Care of a 48-Year-Old Female Patient with Type 2 Diabetes Mellitus and Diabetic Foot Ulcer Admitted to the Medical Ward'
                  : 'e.g. Assessment of Knowledge and Practice of Infection Prevention and Control Among Nurses in Lagos State University Teaching Hospital'}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              <div style={{ fontSize: 11, color: topic.length >= 10 ? '#16A34A' : 'var(--text-muted,#718096)', marginTop: 4 }}>
                {topic.length >= 10 ? '✅ Good' : `${topic.length}/10 min`}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label style={lbl}>{mode === 'clientcare' ? 'Care Study Objectives *' : 'Research Objectives *'}</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={5}
                placeholder={mode === 'clientcare'
                  ? '1. To assess the health status and care needs of the client\n2. To identify nursing diagnoses using NANDA taxonomy\n3. To plan and implement evidence-based nursing interventions\n4. To evaluate effectiveness of nursing care provided\n5. To educate client and family on self-management'
                  : '1. To assess the level of knowledge of infection prevention among nurses\n2. To determine the practice of standard precautions\n3. To identify factors influencing infection control practices\n4. To examine the relationship between training and IPC compliance'}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
              <div style={{ fontSize: 11, color: objectives.length >= 20 ? '#16A34A' : 'var(--text-muted,#718096)', marginTop: 4 }}>
                {objectives.length >= 20 ? '✅ Set' : `${objectives.length}/20 min`}
              </div>
            </div>

            {/* Row: Level + Dept */}
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
                  placeholder={mode === 'clientcare' ? 'e.g. Medical Ward' : 'e.g. Nursing Science'} style={inp} />
              </div>
            </div>

            {/* Citation style */}
            <div>
              <label style={lbl}>Citation Style</label>
              <select value={citationStyle} onChange={e => setCitationStyle(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 180 }}>
                {['APA','MLA','Harvard','Vancouver','Chicago'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Per-chapter page count */}
            <div style={{ background: 'var(--bg-tertiary,#0f172a)', border: '1px solid var(--border,#2d3748)', borderRadius: 10, padding: '14px 16px' }}>
              <label style={{ ...lbl, marginBottom: 10 }}>📄 Pages Per Chapter</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10 }}>
                {activeChapters.map(ch => (
                  <div key={ch.id}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: ch.color, marginBottom: 4 }}>
                      {ch.title.replace('Chapter ', 'Ch.')}
                    </label>
                    <input
                      type="text"
                      value={chapterPages[ch.id] || '10-15'}
                      onChange={e => setChapterPages(p => ({ ...p, [ch.id]: e.target.value }))}
                      placeholder="e.g. 1-4"
                      style={{ ...inp, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted,#718096)', marginTop: 8 }}>
                💡 Type any range e.g. <strong style={{color:'var(--text-primary,#e2e8f0)'}}>1-4</strong>, <strong style={{color:'var(--text-primary,#e2e8f0)'}}>10-15</strong>, or a single number like <strong style={{color:'var(--text-primary,#e2e8f0)'}}>20</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Guide Document Card ── */}
        <div style={{ background: 'var(--bg-card,#1a2236)', border: `1px solid ${showGuide ? accentColor + '60' : 'var(--border-card,#2d3748)'}`, borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={() => setShowGuide(v => !v)}
            style={{ width: '100%', padding: '16px 22px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📂</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary,#e2e8f0)' }}>
                  Guide Document <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted,#718096)' }}>(optional)</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted,#718096)', marginTop: 2 }}>
                  {guideDoc.trim()
                    ? `✅ Guide loaded${guideFileName ? ` — ${guideFileName}` : ''} · ${guideDoc.trim().split(/\s+/).length.toLocaleString()} words`
                    : 'Paste or upload a sample care/research study for the AI to use as a structural guide'}
                </div>
              </div>
            </div>
            <span style={{ color: accentColor, fontSize: 18, transition: 'transform 0.2s', transform: showGuide ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {showGuide && (
            <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border,#2d3748)' }}>
              <div style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 14px', margin: '14px 0', fontSize: 13, color: '#60A5FA' }}>
                ℹ️ Paste or upload an existing {mode === 'clientcare' ? 'care/case study' : 'research project'} that follows the structure and style you want. The AI will use it as a guide while writing the new topic.
              </div>

              {/* Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accentColor, color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                  📎 Upload File
                  <input type="file" accept=".txt,.doc,.docx,.pdf" style={{ display: 'none' }} onChange={handleGuideFile} />
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted,#718096)' }}>.txt files recommended · max 500KB</span>
                {guideDoc.trim() && (
                  <button onClick={() => { setGuideDoc(''); setGuideFileName(''); }}
                    style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Paste area */}
              <label style={lbl}>Or paste document text directly</label>
              <textarea value={guideDoc} onChange={e => { setGuideDoc(e.target.value); setGuideFileName(''); }} rows={8}
                placeholder={`Paste an existing ${mode === 'clientcare' ? 'care study / case study' : 'research project'} here. The AI will follow its structure, headings, and writing style when generating the new chapters.`}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
            </div>
          )}
        </div>

        {/* ── APA Notice ── */}
        <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📚</span>
          <div style={{ fontSize: 12, color: 'rgba(22,163,74,0.9)', lineHeight: 1.6 }}>
            <strong>Citation Policy:</strong> All in-text citations and references are strictly APA 7th edition from verifiable academic sources published <strong>2021–2025</strong>. No fabricated sources. Foundational nursing theories (e.g. Orem, Roy) may retain original publication years.
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 14 }}>❌ {error}</div>
        )}

        {/* ── Generate All Button ── */}
        <button onClick={generateAll} disabled={!canGenerate || generatingAll || loading !== null}
          style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body,inherit)', cursor: canGenerate && !generatingAll && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: canGenerate && !generatingAll && !loading ? (mode === 'clientcare' ? 'linear-gradient(135deg,#7C3AED,#0D9488)' : 'linear-gradient(135deg,#1E3A8A,#0D9488)') : 'rgba(45,55,72,0.6)',
            color: canGenerate ? '#fff' : 'rgba(255,255,255,0.4)' }}>
          {generatingAll
            ? <><div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generating {activeChapters.find(c => c.id === loading)?.title || '…'}</>
            : mode === 'clientcare' ? `🏥 Generate All ${totalChapters} Care Study Chapters` : `🚀 Generate All ${totalChapters} Chapters At Once`}
        </button>

        {/* ── Chapter Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalChapters}, 1fr)`, gap: 8 }}>
          {activeChapters.map(ch => {
            const done = !!chapters[ch.id];
            const isLoading = loading === ch.id;
            return (
              <button key={ch.id} className="ai-ch-btn"
                onClick={() => done ? setActiveChapter(ch.id) : generateChapter(ch.id)}
                disabled={!canGenerate || (loading !== null && !isLoading)}
                style={{ padding: '10px 6px', borderRadius: 10, border: `2px solid ${activeChapter === ch.id ? ch.color : done ? ch.border : 'var(--border,#2d3748)'}`, background: activeChapter === ch.id ? ch.bg : done ? ch.bg : 'var(--bg-card,#1a2236)', color: done ? ch.color : 'var(--text-muted,#718096)', cursor: canGenerate && (!loading || isLoading) ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body,inherit)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {isLoading
                  ? <div style={{ width: 18, height: 18, border: `2px solid ${ch.color}40`, borderTop: `2px solid ${ch.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <span style={{ fontSize: 16 }}>{done ? '✅' : '✍️'}</span>}
                <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{ch.title.replace('Chapter ', 'Ch.')}</span>
                <span style={{ fontSize: 9, opacity: 0.7, textAlign: 'center', lineHeight: 1.2 }}>{ch.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* ── Progress bar ── */}
        {generatedCount > 0 && (
          <div style={{ background: 'var(--bg-card,#1a2236)', borderRadius: 10, padding: '14px 18px', border: '1px solid var(--border-card,#2d3748)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)' }}>{generatedCount}/{totalChapters} chapters generated</span>
              {generatedCount === totalChapters && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={copyAll}
                    style={{ background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    📋 Copy All
                  </button>
                  <button onClick={downloadDocx} disabled={downloadingDocx}
                    style={{ background: downloadingDocx ? 'rgba(13,148,136,0.5)' : '#0D9488', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: downloadingDocx ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {downloadingDocx
                      ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Building .docx…</>
                      : '⬇️ Download .docx'}
                  </button>
                  <button onClick={downloadAll}
                    style={{ background: 'transparent', color: 'var(--text-muted,#718096)', border: '1px solid var(--border,#2d3748)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                    .txt
                  </button>
                </div>
              )}
            </div>
            <div style={{ background: 'var(--bg-tertiary,#2d3748)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(generatedCount / totalChapters) * 100}%`, background: `linear-gradient(90deg,${mode === 'clientcare' ? '#7C3AED' : '#1E3A8A'},#0D9488)`, borderRadius: 20, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* ── Chapter Content Viewer ── */}
        {activeChapter && chapters[activeChapter] && (() => {
          const ch = activeChapters.find(c => c.id === activeChapter);
          if (!ch) return null;
          return (
            <div style={{ background: 'var(--bg-card,#1a2236)', border: `2px solid ${ch.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: ch.bg, borderBottom: `1px solid ${ch.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: ch.color }}>{ch.title}: {ch.subtitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted,#718096)', marginTop: 2 }}>
                    {chapters[activeChapter].split(' ').length.toLocaleString()} words · {Math.ceil(chapters[activeChapter].split(' ').length / 250)} min read
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyChapter(activeChapter)} style={{ background: ch.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>📋 Copy</button>
                  <button onClick={() => generateChapter(activeChapter)} disabled={loading !== null} style={{ background: 'transparent', color: ch.color, border: `1.5px solid ${ch.color}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>🔄 Regenerate</button>
                </div>
              </div>
              <div style={{ padding: '24px 28px' }} ref={contentRef}>
                <textarea value={chapters[activeChapter]} onChange={e => setChapters(prev => ({ ...prev, [activeChapter]: e.target.value }))}
                  style={{ width: '100%', minHeight: 600, background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: 'var(--text-secondary,#cbd5e0)', fontFamily: "'Times New Roman', Georgia, serif", fontSize: 15, lineHeight: 1.9, boxSizing: 'border-box' }} />
              </div>
            </div>
          );
        })()}

        {/* ── Empty state ── */}
        {!activeChapter && generatedCount === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card,#1a2236)', borderRadius: 14, border: '1px solid var(--border-card,#2d3748)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{mode === 'clientcare' ? '🏥' : '🤖'}</div>
            <h3 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 20, color: 'var(--text-primary,#e2e8f0)', marginBottom: 8 }}>
              {mode === 'clientcare' ? 'Ready to Write Care Study' : 'Ready to Write'}
            </h3>
            <p style={{ color: 'var(--text-muted,#718096)', fontSize: 14, maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.7 }}>
              {mode === 'clientcare'
                ? <>Fill in the client condition and care objectives above, then click <strong style={{ color: '#7C3AED' }}>Generate All {totalChapters} Care Study Chapters</strong>. Optionally upload a guide document for structure and style.</>
                : <>Fill in your research topic and objectives above, then click <strong style={{ color: '#0D9488' }}>Generate All {totalChapters} Chapters</strong> or generate individual chapters. Upload a guide document for custom structure.</>}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {activeChapters.map(ch => (
                <div key={ch.id} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${ch.border}`, fontSize: 12, fontWeight: 600, color: ch.color, background: ch.bg }}>
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
