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
    ch1: '10-15', ch2: '15-20', ch3: '15-20', ch4: '15-20', ch5: '10-15',
  });
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [mode, setMode]                 = useState('research');
  const [guideDoc, setGuideDoc]         = useState('');
  const [guideFileName, setGuideFileName] = useState('');
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

  // ── Build AI prompt ──────────────────────────────────────────
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
- When referencing a researcher's finding, describe WHAT they found using completely different sentence construction from the original
- Vary sentence length and structure throughout — mix short punchy sentences with longer analytical ones
- Use active AND passive voice strategically — not exclusively passive
- Avoid formulaic academic clichés such as: "It is worth noting that...", "In the light of the foregoing...", "It is evident that...", "This study therefore seeks to..."
- Each paragraph must flow organically from the previous — use transition phrases that fit the specific content
- Do NOT start multiple consecutive sentences or paragraphs with the same word or structure
- Write as if explaining to a knowledgeable colleague — precise, thoughtful, and original
- Add the writer's own analytical commentary after citing each source — do not just string citations together`;

    const researchInstructions = {
      ch1: `Write a comprehensive CHAPTER ONE: INTRODUCTION for an academic research project. Include ALL of these sections with proper subheadings:

1.1 Background to the Study — 3–4 paragraphs of detailed historical and contextual background with ${citationStyle} citations (Global → Africa → Nigeria → Local setting)
1.2 Statement of Problem — 2–3 paragraphs identifying the specific research gap (no subheading number prefix — write as "Statement of Problem")
1.3 Objectives of the Study — start with "Broad Objective" (bold sub-label, 1 paragraph), then "Specific Objectives" (bold sub-label), then "The researcher intends to:" followed by numbered list
1.4 Research Questions — one per objective, numbered list
1.5 Research Hypotheses — H₀₁, H₀₂ etc. (bold, state null hypotheses derived from objectives)
1.6 Significance of the Study — 2–3 paragraphs covering: nursing profession, healthcare providers, society
1.7 Scope of the Study (Delimitation) — 1–2 paragraphs
1.8 Operational Definition of Terms — define 6–8 key terms from the topic`,

      ch2: `Write a comprehensive CHAPTER TWO: LITERATURE REVIEW. Include ALL of these sections:

2.1 Conceptual Review — paragraph introducing the section, then subsections:
  2.1.1 [First major concept] — detailed discussion with sub-sub-topics as bold labels (not numbered)
  2.1.2 [Second major concept/Preventive Measures] — with bold sub-topic labels inside
  2.1.3 [Third major concept/Factors Influencing] — with bold sub-topic labels inside
  All with APA 7th ed. citations (2021–2025)
2.2 Theoretical Framework:
  2.2.1 [Theory Name] ([Proponent], [Year]) — explain the theory and its key constructs as bold sub-labels
  2.2.2 Application of [Theory Name] to the Study — map each construct to the study (bold sub-labels for each construct)
2.3 Empirical Review — subsections per objective:
  2.3.1 [First objective topic] — Global → Africa → Nigeria pattern, 3–4 studies each, end with a conclusion paragraph
  2.3.2 [Second objective topic] — same pattern
  2.3.3 [Third objective topic] — same pattern
REFERENCES — full APA 7th edition list at end`,

      ch3: `Write a comprehensive CHAPTER THREE: RESEARCH METHODOLOGY. Include ALL sections exactly:

3.1 Research Design — describe and justify (e.g. descriptive survey design)
3.2 Research Setting — describe facility: full name, location, why chosen, services provided
3.3 Target Population — describe who the population consists of
3.4 Sample Size and Sampling Technique — show full Taro Yamane formula working:
  n = N / [1 + N(e)²]  where N=population, e=0.05
  Show step-by-step calculation. State final sample + 10% attrition buffer.
  Describe stratified random sampling with strata (e.g. trimesters) and simple random within strata
3.5 Instrument for Data Collection — describe questionnaire sections:
  Section A: Demographic Information (list items)
  Section B: [First variable] (Yes/No or Likert)
  Section C: [Second variable] (4-point Likert: Strongly Agree=4, Agree=3, Disagree=2, Strongly Disagree=1)
  Section D: [Third variable/Factors]
3.6 Validity of the Instrument — face and content validity (supervisor review, expert scrutiny)
3.7 Reliability of the Instrument — pilot study (n=15, ~10% of sample) at a similar facility; Cronbach's Alpha ≥ 0.70; all items retained
3.8 Method of Data Collection — cover: Ethical Approval, Recruitment and Consent, Questionnaire Administration, Data Collection Period (4 weeks), Quality Control, Research Assistants (2 trained nurses)
3.9 Method of Data Analysis — SPSS version 25+; Data Preparation (as numbered sub-steps); Descriptive Statistics (frequencies, percentages, means, SD per section); Inferential Statistics (Chi-square for hypotheses); Data Presentation (tables, charts, graphs)
3.10 Ethical Considerations — cover: Ethical Approval, Informed Consent, Confidentiality and Anonymity, Voluntary Participation, Respect and Dignity, Beneficence and Non-maleficence, Data Management, Dissemination
REFERENCES — full APA 7th edition list`,

      ch4: `Write a comprehensive CHAPTER FOUR: ANALYSIS AND PRESENTATION OF DATA. Include:

Opening paragraph — total respondents recruited, response rate (e.g. 100%)
4.2 Demographic Characteristics of Respondents:
  - "Table 4.2.1: Socio-Demographic Characteristics of Respondents" (reference this table in prose)
  - "Source: Research field work, [year]" after table reference
  - "Figure 4.1: Bar Chart Showing [variable] Distribution of Respondents" for each demographic
  - Write a narrative paragraph describing the demographics
4.3 Answering of Research Questions — one sub-section per research question:
  Research Question One: [state it in full]
  "Table 4.3.1: [Description]"
  "Source: Research field work, [year]"
  "Figure 4.4: Bar Chart Showing [variable]"
  Narrative paragraph interpreting findings with specific percentages
  (Repeat for each research question with sequential table/figure numbers)
4.4 Hypothesis Testing:
  Research Hypothesis 1:
  H₀₁: [state in full]
  Describe Chi-Square test conducted (which items from which sections used)
  "Table 4.4.1: Cross-Tabulation for Hypothesis 1 — [Variable A] vs [Variable B]"
  "Source: Research field work, [year]"
  Inference: State χ² value, critical value (3.841 at df=1), P-value, decision (reject/retain H₀)
  (Repeat for each hypothesis)
Note: Use plausible fictional data consistent with a Nigerian hospital setting.`,

      ch5: `Write a comprehensive CHAPTER FIVE: DISCUSSION OF RESULTS. Include ALL sections:

5.1 Discussion of Findings:
  Start with: Socio-Demographic Characteristics — narrative describing the sample demographics
  Then one sub-section per research question titled "Findings on [topic]":
  For each finding: state what was found, compare with Global → Africa → Nigeria studies (APA 7th ed. 2021–2025), explain implications
5.2 Implications of the Study to Nursing — 4–6 sub-headed paragraphs (e.g. "Strengthening Nursing Education...", "Development of Institutional Protocols...", "Advocacy for Resource Allocation...", "Addressing Workload...")
5.3 Summary of the Study — 2–3 paragraphs: objectives, methodology, key findings
5.4 Conclusion — 2–3 paragraphs drawing from findings
5.5 Recommendations — 5–8 numbered, practical, specific recommendations to named stakeholders (numbered with full paragraphs for each)
5.6 Suggestions for Further Studies — 4–5 numbered future research directions with explanatory paragraphs

PILOT STUDY (as a final section after 5.6):
  "PILOT STUDY" as a heading
  "Reliability Analysis of Structured Questionnaire" as sub-heading
  Paragraph describing pilot study (n=15, ~10% of sample, similar facility, purpose)
  State the Cronbach's Alpha formula:
  α = N/(N−1) × (1 − ΣItem Variance / Total Variance)
  Where: N = Number of items; ΣItem Variance = Sum of variances; Total Variance = Variance of total scores
  "Table P.1: Pilot Study Reliability Data (n = 15)" reference
  "Source: Research field work, [year]"
  Show calculation substituting plausible values, result α ≥ 0.70
  Interpretation paragraph

REFERENCES — full APA 7th edition list (2021–2025), 15–20 entries`,
    };

    const clientCareInstructions = {
      ch1: `Write a comprehensive CHAPTER ONE: INTRODUCTION for a Client Care Study. Include ALL sections:

1.1 Background of the Case — 3–4 paragraphs introducing the clinical condition, its burden in Nigeria
1.2 Statement of the Problem — 2–3 paragraphs identifying presenting problems and clinical nursing gap
1.3 Purpose of the Study — 1 paragraph
1.4 Objectives of the Care Study — numbered list of all provided objectives
1.5 Scope of the Study — care aspects covered
1.6 Significance of the Study — nursing practice, patient outcomes, healthcare education
1.7 Limitation of the Study — 1 paragraph
1.8 Operational Definition of Terms — define 6–8 key clinical and nursing terms`,

      ch2: `Write a comprehensive CHAPTER TWO: LITERATURE REVIEW for a Client Care Study. Include ALL sections:

2.1 Conceptual Review — overview of the condition: pathophysiology, epidemiology (Nigerian/African data), aetiology and risk factors (APA 7th ed., 2021–2025)
2.2 Clinical Manifestations and Assessment — signs, symptoms, diagnostic criteria
2.3 Theoretical Framework — 2.3.1: discuss 2–3 nursing theories applicable to this case (state proponent and year); 2.3.2: Application to the study
2.4 Empirical Review — review 6–8 real studies (peer-reviewed journals, 2021–2025) on nursing care for this condition; Global → Africa → Nigeria pattern
2.5 Pharmacological Management — drug classes, mechanisms, nursing considerations
2.6 Multidisciplinary Team Involvement — roles of physicians, physiotherapists, dieticians, social workers
REFERENCES — full APA 7th edition list`,

      ch3: `Write a comprehensive CHAPTER THREE: CLIENT ASSESSMENT AND NURSING CARE PLAN. Include ALL sections:

3.1 Client Profile / Bio-data — plausible fictional patient (initials only): age, sex, occupation, religion, tribe, marital status, ward, date of admission, reason for admission
3.2 Chief Complaints — presenting complaints on admission
3.3 Medical History — past medical/surgical history, family history, social history, drug history, known allergies
3.4 Physical Examination — systematic head-to-toe: vital signs (BP, temp, pulse, RR, SpO2), general appearance, each body system
3.5 Medical Diagnosis and Investigation Results — plausible lab values (FBC, electrolytes, RBS, urinalysis, imaging) with interpretation
3.6 Nursing Diagnoses — list 5–6 NANDA-approved diagnoses, prioritized by Maslow's hierarchy
3.7 Nursing Care Plan — for each diagnosis: Nursing Diagnosis | Goal | Expected Outcomes | Nursing Interventions | Rationale | Evaluation (with APA citations 2021–2025)
3.8 Discharge Plan — instructions, medications, diet, lifestyle, follow-up, referrals
REFERENCES — full APA 7th edition list`,
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

STRICT CHAPTER FORMAT (NACON / NIGERIAN ARMY COLLEGE OF NURSING STANDARD):
${instructions[chapterId]}

${citationRules}

WRITING STANDARDS:
- Write entirely in formal academic English, third person throughout
- Nigerian healthcare and educational context where relevant
- Minimum 1,500–2,500 words for this chapter
- Use numbered subheadings EXACTLY as listed above (1.1, 1.2, 2.1.1, etc.)
- Never start with preamble like "Here is your chapter" — begin directly with the chapter title in ALL CAPS
- Begin with: CHAPTER [NUMBER] on one line, then the subtitle ALL CAPS on the next line, then the first subheading

HUMAN WRITING STYLE (critical for 0–5% plagiarism target):
- Every sentence must be freshly constructed — no recycled academic sentence templates
- Vary your sentence openings: do NOT start more than two consecutive sentences with the same word
- Show intellectual engagement: after presenting a fact or citation, add analytical commentary on its meaning for the Nigerian context
- Use connective phrases that feel natural: "This pattern suggests...", "What emerges from these findings is...", "A closer look reveals..."
- Do NOT use AI-signature phrases such as: "It is important to note", "Furthermore, it should be noted", "In conclusion, it can be seen", "As previously mentioned"
- Write background sections like a storyteller building context — not like a list of facts

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

  // ────────────────────────────────────────────────────────────
  // Download as .docx — NACON Standard Format
  //
  // Exact specs extracted from real NACON research documents:
  //   Font:         Times New Roman, 12pt
  //   Line spacing: Double (480 twips = 24pt line height for 12pt text)
  //   Alignment:    JUSTIFIED for all body text & subheadings
  //                 CENTER for chapter titles & subtitles only
  //   Bold:         Chapter titles, subtitles, subheadings (1.1 etc.),
  //                 hypothesis lines (H₀₁), sub-labels (Broad Objective etc.)
  //   Indent:       None for body (no first-line indent)
  //                 0.5in hanging indent for references
  //                 0.5in left indent for list items
  //   Spacing:      No space before or after paragraphs
  //   Page:         US Letter (8.5×11 in = 12240×15840 DXA)
  //   Margins:      1 inch all sides (1440 DXA)
  //   Page numbers: Bottom centre, Times New Roman 12pt
  // ────────────────────────────────────────────────────────────
  const downloadDocx = async () => {
    const allContent = activeChapters.map(c => chapters[c.id] || '').filter(Boolean);
    if (!allContent.length) return;
    setDownloadingDocx(true);

    try {
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
        Document, Packer, Paragraph, TextRun,
        AlignmentType, LineRuleType,
        PageNumber, NumberFormat, Footer,
      } = window.docx;

      // ── Formatting constants ─────────────────────────────────
      const FONT     = 'Times New Roman';
      const SIZE     = 24;    // 12pt in half-points (docx unit)
      const LINE     = 480;   // double spacing in twips (24pt for 12pt font)
      const LINERULE = LineRuleType.EXACT;
      const NO_SP    = { before: 0, after: 0 };

      // ── Paragraph factory functions ──────────────────────────

      // Chapter title: ALL CAPS, Bold, Centered
      const mkChapterTitle = (text) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE })],
      });

      // Chapter subtitle: ALL CAPS, Bold, Centered
      const mkSubtitle = (text) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE })],
      });

      // Numbered subheading (1.1, 2.3.1 etc.): Bold, Justified
      const mkSubheading = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text, bold: true, font: FONT, size: SIZE })],
      });

      // Bold label (Broad Objective, Specific Objectives, Inference: etc.): Bold, Justified
      const mkBoldLabel = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text, bold: true, font: FONT, size: SIZE })],
      });

      // Hypothesis (H₀₁, H₀₂): Bold, Justified
      const mkHypothesis = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text, bold: true, font: FONT, size: SIZE })],
      });

      // Body paragraph: normal weight, Justified
      const mkBody = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text, font: FONT, size: SIZE })],
      });

      // Blank line
      const mkBlank = () => new Paragraph({
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text: '', font: FONT, size: SIZE })],
      });

      // Reference entry: 0.5in hanging indent, Justified
      const mkRef = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        indent: { left: 720, hanging: 720 },
        children: [new TextRun({ text, font: FONT, size: SIZE })],
      });

      // List item: 0.5in left indent, Justified
      const mkListItem = (text) => new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        indent: { left: 720 },
        children: [new TextRun({ text, font: FONT, size: SIZE })],
      });

      // Monospaced line (for ASCII tables)
      const mkMono = (text) => new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
        children: [new TextRun({ text, font: 'Courier New', size: 20 })],
      });

      // Page break
      const mkPageBreak = () => new Paragraph({
        pageBreakBefore: true,
        spacing: { ...NO_SP },
        children: [new TextRun({ text: '', font: FONT, size: SIZE })],
      });

      // ── Line classifier ──────────────────────────────────────
      const classify = (line) => {
        const t = line.trim();
        if (!t) return 'blank';

        // "CHAPTER ONE", "CHAPTER TWO" etc.
        if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) return 'chapter-title';

        // ALL-CAPS subtitle lines (INTRODUCTION, LITERATURE REVIEW, REFERENCES, PILOT STUDY etc.)
        if (
          t === t.toUpperCase() &&
          /^[A-Z\s,&\/\-]+$/.test(t) &&
          t.length > 3 &&
          t.length < 80 &&
          !/^\d/.test(t)
        ) return 'chapter-subtitle';

        // Numbered subheadings: 1.1, 2.3, 3.10, 1.1.1, 2.3.1 etc.
        if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) return 'subheading';

        // Hypothesis lines: H₀₁, H₀₂, H01, Ho1 etc.
        if (/^H[₀o0][₁₂₃123]:/.test(t)) return 'hypothesis';

        // Known bold sub-labels
        if (/^(Broad Objective|Specific Objectives|Broad Aim|Specific Aims|Decision Rule|Inference:|Source:|Note:|Research (Question|Hypothesis)\s+\d+)/i.test(t)) return 'bold-label';

        // Reference entries: Author, A. A. pattern
        if (/^[A-Z][a-z]+,\s[A-Z][\.\s]/.test(t)) return 'reference';

        // Numbered list items: "1.", "2.", "(i)", "a)"
        if (/^(\d+\.|[ivxlIVXL]+\.|[a-z]\))\s/.test(t)) return 'list-item';

        // Table rows (ASCII)
        if (t.includes('|') && (t.startsWith('|') || t.indexOf('|') < 6)) return 'table-row';

        return 'body';
      };

      // ── Convert chapter text to docx paragraphs ──────────────
      const textToParas = (text) => {
        const lines  = text.split('\n');
        const result = [];
        let prevType = null;
        let tableBuffer = [];

        const flushTable = () => {
          if (!tableBuffer.length) return;
          tableBuffer.forEach(row => result.push(mkMono(row)));
          tableBuffer = [];
        };

        for (const line of lines) {
          const type = classify(line);

          if (type === 'table-row') { tableBuffer.push(line.trim()); prevType = type; continue; }
          if (type !== 'table-row' && tableBuffer.length) flushTable();

          if (type === 'blank') { result.push(mkBlank()); prevType = type; continue; }

          // Insert a blank line before chapter-titles and subheadings
          // (unless we're at the very start or after a blank)
          if (
            (type === 'chapter-title' || type === 'subheading') &&
            prevType !== null && prevType !== 'blank' && prevType !== 'chapter-title'
          ) {
            result.push(mkBlank());
          }

          const t = line.trim();
          switch (type) {
            case 'chapter-title':    result.push(mkChapterTitle(t)); break;
            case 'chapter-subtitle': result.push(mkSubtitle(t));     break;
            case 'subheading':       result.push(mkSubheading(t));   break;
            case 'bold-label':       result.push(mkBoldLabel(t));    break;
            case 'hypothesis':       result.push(mkHypothesis(t));   break;
            case 'reference':        result.push(mkRef(t));          break;
            case 'list-item':        result.push(mkListItem(t));     break;
            default:                 result.push(mkBody(t));         break;
          }
          prevType = type;
        }

        flushTable();
        return result;
      };

      // ── Title page ───────────────────────────────────────────
      const titlePage = [
        mkBlank(), mkBlank(), mkBlank(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: (topic || 'Research Project').toUpperCase(), bold: true, font: FONT, size: SIZE })],
        }),

        mkBlank(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: 'BY', bold: true, font: FONT, size: SIZE })],
        }),

        mkBlank(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: '___________________________', font: FONT, size: SIZE })],
        }),

        mkBlank(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: 'PRESENTED TO', bold: true, font: FONT, size: SIZE })],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: `DEPARTMENT OF ${(department || 'NURSING SCIENCE').toUpperCase()}`, bold: true, font: FONT, size: SIZE })],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({ text: 'NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS', bold: true, font: FONT, size: SIZE })],
        }),

        mkBlank(), mkBlank(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...NO_SP, line: LINE, lineRule: LINERULE },
          children: [new TextRun({
            text: `${new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}, ${new Date().getFullYear()}.`,
            bold: true, font: FONT, size: SIZE,
          })],
        }),
      ];

      // ── Assemble full document paragraphs ────────────────────
      const allParas = [...titlePage];
      for (const ch of activeChapters) {
        if (!chapters[ch.id]) continue;
        allParas.push(mkPageBreak());
        allParas.push(...textToParas(chapters[ch.id]));
      }

      // ── Create and save document ─────────────────────────────
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },      // US Letter
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
            },
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE })],
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
      toast('✅ Downloaded as .docx (NACON Format)!', '#16A34A');
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

            <div>
              <label style={lbl}>Citation Style</label>
              <select value={citationStyle} onChange={e => setCitationStyle(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 180 }}>
                {['APA','MLA','Harvard','Vancouver','Chicago'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ background: 'var(--bg-tertiary,#0f172a)', border: '1px solid var(--border,#2d3748)', borderRadius: 10, padding: '14px 16px' }}>
              <label style={{ ...lbl, marginBottom: 10 }}>📄 Pages Per Chapter</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10 }}>
                {activeChapters.map(ch => (
                  <div key={ch.id}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: ch.color, marginBottom: 4 }}>
                      {ch.title.replace('Chapter ', 'Ch.')}
                    </label>
                    <input type="text" value={chapterPages[ch.id] || '10-15'}
                      onChange={e => setChapterPages(p => ({ ...p, [ch.id]: e.target.value }))}
                      placeholder="e.g. 1-4"
                      style={{ ...inp, padding: '8px 10px', fontSize: 13 }} />
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
              <label style={lbl}>Or paste document text directly</label>
              <textarea value={guideDoc} onChange={e => { setGuideDoc(e.target.value); setGuideFileName(''); }} rows={8}
                placeholder={`Paste an existing ${mode === 'clientcare' ? 'care study / case study' : 'research project'} here. The AI will follow its structure, headings, and writing style when generating the new chapters.`}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
            </div>
          )}
        </div>

        {/* ── Citation Policy Notice ── */}
        <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📚</span>
          <div style={{ fontSize: 12, color: 'rgba(22,163,74,0.9)', lineHeight: 1.6 }}>
            <strong>Citation Policy:</strong> All in-text citations and references are strictly APA 7th edition from verifiable academic sources published <strong>2021–2025</strong>. No fabricated sources. Foundational nursing theories (e.g. Orem, Roy) may retain original publication years.
          </div>
        </div>

        {/* ── Word Format Notice ── */}
        <div style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
          <div style={{ fontSize: 12, color: 'rgba(147,197,253,0.9)', lineHeight: 1.6 }}>
            <strong>Word Format (NACON Standard):</strong> Downloaded .docx uses <strong>Times New Roman 12pt · Double spacing · Justified text · 1-inch margins all sides · US Letter (8.5×11)</strong>. Chapter titles and subtitles are centered and bold. Subheadings (1.1, 1.2...) are bold and justified. References use hanging indent. Page numbers appear bottom centre.
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

        {/* ── Progress bar + Download ── */}
        {generatedCount > 0 && (
          <div style={{ background: 'var(--bg-card,#1a2236)', borderRadius: 10, padding: '14px 18px', border: '1px solid var(--border-card,#2d3748)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)' }}>
                {generatedCount}/{totalChapters} chapter{generatedCount > 1 ? 's' : ''} generated
                {generatedCount === totalChapters && <span style={{ marginLeft: 8, color: '#16A34A' }}>✅ Complete</span>}
              </span>
              {/* Download buttons appear as soon as ANY chapter is ready */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={copyAll}
                  style={{ background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                  📋 Copy All
                </button>
                <button onClick={downloadDocx} disabled={downloadingDocx}
                  style={{ background: downloadingDocx ? 'rgba(13,148,136,0.5)' : '#0D9488', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: downloadingDocx ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {downloadingDocx
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Building .docx…</>
                    : `⬇️ Download .docx (${generatedCount}/${totalChapters} chapters)`}
                </button>
                <button onClick={downloadAll}
                  style={{ background: 'transparent', color: 'var(--text-muted,#718096)', border: '1px solid var(--border,#2d3748)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                  .txt
                </button>
              </div>
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
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => copyChapter(activeChapter)}
                    style={{ background: ch.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    📋 Copy
                  </button>
                  <button onClick={downloadDocx} disabled={downloadingDocx}
                    style={{ background: downloadingDocx ? 'rgba(13,148,136,0.4)' : '#0D9488', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: downloadingDocx ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {downloadingDocx
                      ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Saving…</>
                      : '⬇️ .docx'}
                  </button>
                  <button onClick={() => generateChapter(activeChapter)} disabled={loading !== null}
                    style={{ background: 'transparent', color: ch.color, border: `1.5px solid ${ch.color}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🔄 Regenerate
                  </button>
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
