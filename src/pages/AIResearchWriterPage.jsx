// src/pages/AIResearchWriterPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveGuideDocument, listGuideDocuments, deleteGuideDocument } from '../firebase/guideDocService';

const RESEARCH_CHAPTERS = [
  { id: 'ch1', title: 'Chapter One',   subtitle: 'Introduction',                           color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)'  },
  { id: 'ch2', title: 'Chapter Two',   subtitle: 'Literature Review',                      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  { id: 'ch3', title: 'Chapter Three', subtitle: 'Research Methodology',                   color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.25)' },
  { id: 'ch4', title: 'Chapter Four',  subtitle: 'Results',                                color: '#D97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)'  },
  { id: 'ch5', title: 'Chapter Five',  subtitle: 'Discussion of Findings',                 color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)'  },
];

const CLIENT_CARE_CHAPTERS = [
  { id: 'ch1', title: 'Chapter One',   subtitle: 'Introduction',                           color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)'  },
  { id: 'ch2', title: 'Chapter Two',   subtitle: 'Literature Review',                      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  { id: 'ch3', title: 'Chapter Three', subtitle: 'Client Assessment & Nursing Care Plan',  color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.25)' },
];

// ── Draw bar chart → base64 PNG ──────────────────────────────
const makeBarChartPng = (title, labels, values, color = '#2563EB') => {
  const W = 560, H = 320, PL = 50, PR = 20, PT = 44, PB = 70;
  const BW = W - PL - PR, BH = H - PT - PB;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
  ctx.fillText(title.slice(0, 70), W / 2, 22);
  const n = labels.length || 1;
  const maxVal = Math.max(...values, 1);
  const barW = Math.min(55, BW / n - 10);
  const spacing = (BW - barW * n) / (n + 1);
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.font = '9px Arial'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const pct = (i / 4) * 100;
    const yy = PT + BH - (pct / 100) * BH;
    ctx.beginPath(); ctx.moveTo(PL, yy); ctx.lineTo(W - PR, yy); ctx.stroke();
    ctx.fillText(Math.round(pct) + '%', PL - 4, yy + 3);
  }
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  values.forEach((val, i) => {
    const x = PL + spacing + i * (barW + spacing);
    const bh = Math.max((val / maxVal) * BH, 2);
    const y = PT + BH - bh;
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(x + 2, y + 2, barW, bh);
    const grad = ctx.createLinearGradient(0, y, 0, y + bh);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(1, `rgba(${Math.max(r-40,0)},${Math.max(g-40,0)},${Math.max(b-40,0)},1)`);
    ctx.fillStyle = grad; ctx.fillRect(x, y, barW, bh);
    ctx.fillStyle = bh > 18 ? '#ffffff' : '#374151';
    ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(val + '%', x + barW / 2, bh > 18 ? y + 14 : y - 4);
    ctx.fillStyle = '#374151'; ctx.font = '9px Arial';
    const words = labels[i].split(' ');
    let line = ''; let lineY = PT + BH + 14;
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > barW + spacing - 2 && line) {
        ctx.fillText(line, x + barW / 2, lineY); line = w; lineY += 11;
      } else line = test;
    });
    ctx.fillText(line, x + barW / 2, lineY);
  });
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PL, PT + BH); ctx.lineTo(W - PR, PT + BH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + BH); ctx.stroke();
  return canvas.toDataURL('image/png').split(',')[1];
};

// ── Parse Chapter 4 pipe tables ──────────────────────────────
const parseChapterFourTables = (text) => {
  if (!text) return [];
  const tables = [];
  const colors = ['2563EB','7C3AED','0D9488','D97706','DC2626','16A34A'];
  let ci = 0;
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (/^Table\s+4[\.\d]+/i.test(line)) {
      const title = line;
      const color = colors[ci++ % colors.length];
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('|')) j++;
      const rawRows = [];
      while (j < lines.length && lines[j].includes('|')) {
        const cells = lines[j].split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length > 0 && !cells.join('').match(/^[-| ]+$/)) rawRows.push(cells);
        j++;
      }
      if (rawRows.length >= 2) {
        const headers = rawRows[0];
        const dataRows = rawRows.slice(1).filter(r => !r.join('').match(/^[-| ]+$/));
        const chartLabels = [], chartValues = [];
        dataRows.forEach(row => {
          chartLabels.push(row[0] || '');
          let found = false;
          for (let k = 1; k < row.length; k++) {
            const m = row[k].match(/(\d+\.?\d*)/);
            if (m) { chartValues.push(parseFloat(m[1])); found = true; break; }
          }
          if (!found) chartValues.push(0);
        });
        tables.push({ title, headers, dataRows, color, chartLabels: chartLabels.slice(0,8), chartValues: chartValues.slice(0,8), chartTitle: title.replace(/^Table\s+[\d.]+[:.]\s*/i,'') });
      }
      i = j; continue;
    }
    i++;
  }
  return tables;
};

export default function AIResearchWriterPage() {

  const { user, profile } = useAuth();
  const canManageGuides = !!(profile?.isAdmin || profile?.isWriter);
  const [savedGuides, setSavedGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [savingGuide, setSavingGuide] = useState(false);
  const [showGuideLibrary, setShowGuideLibrary] = useState(false);
  const [showSaveGuideBox, setShowSaveGuideBox] = useState(false);
  const [saveGuideName, setSaveGuideName] = useState('');

  const refreshGuideLibrary = async () => {
    if (!user?.uid || !canManageGuides) return;
    setLoadingGuides(true);
    try { setSavedGuides(await listGuideDocuments(user.uid)); }
    catch (e) { console.error('Failed to load guide library', e); }
    finally { setLoadingGuides(false); }
  };

  const handleSaveGuide = async () => {
    if (!user?.uid || !guideDoc.trim()) return;
    setSavingGuide(true);
    try {
      const { truncated } = await saveGuideDocument({
        ownerId: user.uid,
        name: saveGuideName.trim() || guideFileName || 'Untitled Guide',
        content: guideDoc,
        fileName: guideFileName,
      });
      setSaveGuideName('');
      setShowSaveGuideBox(false);
      if (truncated) alert('Guide saved, but it was very large and was trimmed to fit storage limits.');
      await refreshGuideLibrary();
    } catch (e) {
      console.error('Failed to save guide', e);
      alert('Could not save guide document. Please try again.');
    } finally {
      setSavingGuide(false);
    }
  };

  const handleUseGuide = (g) => {
    setGuideDoc(g.content || '');
    setGuideFileName(g.name || '');
    setShowGuideLibrary(false);
  };

  const handleDeleteGuide = async (id) => {
    if (!confirm('Delete this saved guide document? This cannot be undone.')) return;
    try {
      await deleteGuideDocument(id);
      setSavedGuides(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      console.error('Failed to delete guide', e);
      alert('Could not delete guide document. Please try again.');
    }
  };

  const [topic, setTopic] = useState(() => sessionStorage.getItem('aiw_topic') || '');
  const [objectives, setObjectives] = useState(() => sessionStorage.getItem('aiw_objectives') || '');
  const [level, setLevel] = useState(() => sessionStorage.getItem('aiw_level') || 'BSc / B.Tech');
  const [department, setDepartment] = useState(() => sessionStorage.getItem('aiw_department') || '');
  const [citationStyle, setCitationStyle] = useState(() => sessionStorage.getItem('aiw_citation') || 'APA');
  const [chapterPages, setChapterPages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('aiw_pages')) || { ch1:'10-15',ch2:'15-20',ch3:'15-20',ch4:'15-20',ch5:'10-15' }; }
    catch { return { ch1:'10-15',ch2:'15-20',ch3:'15-20',ch4:'15-20',ch5:'10-15' }; }
  });
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf,  setDownloadingPdf]  = useState(false);
  const [mode, setMode] = useState(() => sessionStorage.getItem('aiw_mode') || 'research');
  const [aiProvider, setAiProvider] = useState(() => sessionStorage.getItem('aiw_provider') || 'claude');
  const [guideDoc, setGuideDoc] = useState(() => sessionStorage.getItem('aiw_guide') || '');
  const [guideFileName, setGuideFileName] = useState(() => sessionStorage.getItem('aiw_guidename') || '');
  const [showGuide, setShowGuide] = useState(() => sessionStorage.getItem('aiw_showguide') === 'true');
  const [activeChapter, setActiveChapter] = useState(() => sessionStorage.getItem('aiw_activechapter') || null);
  const [chapters, setChapters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('aiw_chapters')) || {}; }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('aiw_topic', topic);
    sessionStorage.setItem('aiw_objectives', objectives);
    sessionStorage.setItem('aiw_level', level);
    sessionStorage.setItem('aiw_department', department);
    sessionStorage.setItem('aiw_citation', citationStyle);
    sessionStorage.setItem('aiw_pages', JSON.stringify(chapterPages));
    sessionStorage.setItem('aiw_mode', mode);
    sessionStorage.setItem('aiw_provider', aiProvider);
    sessionStorage.setItem('aiw_chapters', JSON.stringify(chapters));
    sessionStorage.setItem('aiw_activechapter', activeChapter || '');
    sessionStorage.setItem('aiw_guide', guideDoc);
    sessionStorage.setItem('aiw_guidename', guideFileName);
    sessionStorage.setItem('aiw_showguide', showGuide);
  }, [topic,objectives,level,department,citationStyle,chapterPages,mode,aiProvider,chapters,activeChapter,guideDoc,guideFileName,showGuide]);

  useEffect(() => { refreshGuideLibrary(); }, [user?.uid, canManageGuides]);

  const activeChapters = mode === 'clientcare' ? CLIENT_CARE_CHAPTERS : RESEARCH_CHAPTERS;
  const totalChapters  = activeChapters.length;
  const canGenerate    = topic.trim().length >= 10;
  const generatedCount = activeChapters.filter(c => chapters[c.id]).length;

  const handleGuideFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5000000) { alert('Guide document must be under 5MB.'); return; }
    setGuideFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => { const t = reader.result || ''; setGuideDoc(t); sessionStorage.setItem('aiw_guide', t); };
    reader.readAsText(file);
  };

  // ── Build prompt ─────────────────────────────────────────────
  const buildPrompt = (chapterId) => {
    const ch = activeChapters.find(c => c.id === chapterId);
    const isCC = mode === 'clientcare';
    const guideSection = guideDoc.trim()
      ? `\nMANDATORY FORMAT GUIDE (HIGHEST PRIORITY — STRICTLY ENFORCED):\nYou MUST follow the structure, headings, subheadings, writing style, paragraph length, table format, and all formatting conventions shown in this guide EXACTLY. This overrides all other instructions. Do NOT skip any section. Do NOT produce half-complete work.\n\nGUIDE DOCUMENT:\n"""\n${guideDoc.trim().slice(0,15000)}${guideDoc.length>15000?'\n[...guide continues — maintain same pattern]':''}\n"""\n`
      : '';

    const citationRules = `
CITATION & REFERENCE RULES (STRICTLY ENFORCED):
- EVERY paragraph must contain at least ONE in-text citation
- EVERY factual statement, statistic, or claim needs an in-text citation
- Format: (Author, Year) or Author (Year) — ${citationStyle} 7th edition
- Use ONLY real verifiable sources 2021–2025
- Do NOT add references at end of Chapters 1, 2, 3, or 4
- ALL references appear ONLY at the end of Chapter 5 — combined, alphabetical, minimum 25–30 entries
- Format: Author, A. A. (Year). Title. Journal, Vol(Issue), pages. https://doi.org/xxx
- Anti-plagiarism: write entirely in your own words, 0–5% similarity target`;

    const researchInstructions = {
      ch1: `Write CHAPTER ONE: INTRODUCTION.

CHAPTER ONE
INTRODUCTION

1.1 Background of the Study
Five paragraphs with citations: Global (WHO) → High-income countries → Africa (3–4 studies) → Nigeria (2–3 studies with %) → Local facility ending with "This study therefore seeks to assess [topic] among [population] in [facility]."

1.2 Statement of Problem
Five paragraphs with citations: Global gap → Nigeria consequences + SDG → Nigerian study % → Second study → "Therefore, this study aims to assess..."

1.3 Objectives of the Study
Broad Objective: To [assess/determine] the [topic] among [population] in [facility].
Specific Objectives (bullet points):
- To [verb] the level of [variable 1] among [population] in [facility].
- To [verb] the level of [variable 2] among [population] in [facility].
- To identify factors influencing [variable 1 and 2] among [population] in [facility].

1.4 Research Questions (bullet points):
- What is the level of [variable 1] among [population] in [facility]?
- What is the level of [variable 2] among [population] in [facility]?
- What factors influence [variable 1 and 2] among [population] in [facility]?

1.5 Research Hypotheses
H₀₁: There is no relationship between [variable 1] and [variable 2] among [population] in [facility].
H₀₂: There is no relationship between socio-demographic factors and [variable 2] among [population] in [facility].

1.6 Significance of the Study — four cited paragraphs: nursing profession → healthcare providers → society → literature.

1.7 Scope of the Study — three paragraphs: focus/population/period → confined dimensions → setting restriction.

1.8 Operational Definition of Terms — six terms as [Bold Term]: [definition in context of this study].`,

      ch2: `Write CHAPTER TWO: LITERATURE REVIEW. Every paragraph must have at least one citation.

CHAPTER TWO
LITERATURE REVIEW

2.1 Conceptual Review — opening cited paragraph.
2.1.1 [Variable 1 — Knowledge]: 3–4 cited paragraphs then BOLD UNNUMBERED sub-sections: Principles, Types, Components, Benefits, Practice Role, Knowledge Gaps.
2.1.2 [Variable 2 — Practices]: opening + 6 BOLD UNNUMBERED sub-sections each with 2 cited paragraphs.
2.1.3 Factors Influencing: opening + 6 BOLD UNNUMBERED sub-sections (2 paragraphs each): Socioeconomic | Educational and Health Literacy | Cultural and Social | Psychological | Healthcare System | Environmental.

2.2 Theoretical Review
2.2.1 [Theory] ([Developer], [Year]) — Figure 1 / Source: Researchgate — constructs as BOLD LABELS.
2.2.2 Application — each construct BOLD HEADING + application paragraphs. Figure 2 / Source: Research Fieldwork [Year].

2.3 Empirical Review
2.3.1 [Variable 1]: Opening → Globally (4 studies) → Africa (3) → Nigeria (2–3) → Closing.
2.3.2 [Variable 2]: same structure.
2.3.3 Factors: same structure with synthesis paragraph.
NOTE: No references here. All at end of Chapter 5.`,

      ch3: `Write CHAPTER THREE: METHODOLOGY.

CHAPTER THREE
METHODOLOGY

3.1 Research Design — descriptive quantitative, justified with citation.
3.2 Research Setting — full name, location, governing body, why chosen.
3.3 Target Population — describe, state N.
3.4 Sample Size Determination — Slovin's formula: n = N/1+N(e)² where e=0.05. Full step-by-step calculation shown.
3.5 Sampling Technique — stratified random, justify, list strata.
3.6 Instrument — structured questionnaire, 4 sections: A=Demographics, B=Variable 1 Yes/No, C=Variable 2 Likert SA/A/D/SD, D=Factors Likert.
3.7 Validity — face and content, supervisor approval, cited.
3.8 Reliability — pilot, Cronbach's Alpha ≥0.70, cited.
3.9 Data Collection — flowing prose: approval→letter→distribution→consent→collection.
3.10 Data Analysis — SPSS 25.0, descriptive (freq,%, means, SD) and inferential (Chi-square p<0.05), cited.
3.11 Ethical Considerations — approval, confidentiality, right to withdraw, no identifiers, cited.
NOTE: No references here. All at end of Chapter 5.`,

      ch4: `Write CHAPTER FOUR: RESULTS. ALL tables MUST use pipe-delimited format (|col|col|) so they render as colored Word tables.

CHAPTER FOUR
RESULTS

4.1 Presentation of Results

Opening paragraph: "A total of [N] respondents participated, resulting in a 100% response rate. This chapter presents demographics, research question answers, and hypothesis testing."

4.1.1 Demographic Characteristics of Respondents

Table 4.1: Socio-Demographic Characteristics of Respondents
Source: Research field work [Year]

| Variable | Category | Frequency | Percentage |
|----------|----------|-----------|------------|
| Age | 18–25 years | [n] | [%] |
| Age | 26–30 years | [n] | [%] |
| Age | 31–35 years | [n] | [%] |
| Age | 36–40 years | [n] | [%] |
| Age | 41+ years | [n] | [%] |
| Sex | Female | [n] | [%] |
| Sex | Male | [n] | [%] |
| Marital Status | Single | [n] | [%] |
| Marital Status | Married | [n] | [%] |
| Education | Primary | [n] | [%] |
| Education | Secondary | [n] | [%] |
| Education | Tertiary | [n] | [%] |

Narrative paragraph. End: "This profile provides a robust foundation for analyzing [variable 1 and variable 2] among [population] in [facility]."

Figure 4.1: Bar Chart Showing Age Distribution of Respondents
Figure 4.2: Bar Chart Showing Education Level of Respondents

4.1.2 [Variable 1 — Knowledge]
Research Question One: [exact text from Chapter 1]

Table 4.2: Knowledge of [Topic] Among [Population]
Source: Research field work [Year]

| Item | Yes n(%) | No n(%) |
|------|----------|---------|
| [Knowledge item 1] | [n(%)] | [n(%)] |
| [Knowledge item 2] | [n(%)] | [n(%)] |
| [Knowledge item 3] | [n(%)] | [n(%)] |
| [Knowledge item 4] | [n(%)] | [n(%)] |
| [Knowledge item 5] | [n(%)] | [n(%)] |
| [Knowledge item 6] | [n(%)] | [n(%)] |

Narrative: "Table 4.2 indicates a generally [high/moderate] level of [variable 1]..." 3–4 key findings with n and %.

Figure 4.3: Bar Chart Showing Knowledge of [Topic] Among [Population]

4.1.3 [Variable 2 — Practices]
Research Question Two: [exact text from Chapter 1]

Table 4.3: Practices Adopted by [Population] Regarding [Topic]
Source: Research field work [Year]

| Item | Always n(%) | Often n(%) | Sometimes n(%) | Never n(%) |
|------|-------------|------------|----------------|------------|
| [Practice 1] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| [Practice 2] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| [Practice 3] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| [Practice 4] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| [Practice 5] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| [Practice 6] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |

Narrative describing dominant practices with n and %.

Figure 4.4: Bar Chart Showing Practices of [Population] Regarding [Topic]

4.1.4 Factors Influencing [Variable 1 and Variable 2]
Research Question Three: [exact text from Chapter 1]

Table 4.4: Factors Influencing [Variable 1 and Variable 2]
Source: Research field work [Year]

| Item | Strongly Agree n(%) | Agree n(%) | Disagree n(%) | Strongly Disagree n(%) |
|------|---------------------|------------|---------------|------------------------|
| Awareness of [topic] | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| Access to healthcare | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| Cultural beliefs | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| Socioeconomic status | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| Healthcare provider support | [n(%)] | [n(%)] | [n(%)] | [n(%)] |
| Family support | [n(%)] | [n(%)] | [n(%)] | [n(%)] |

Narrative naming top factors with percentages.

Figure 4.5: Bar Chart Showing Factors Influencing [Variable 1 and Variable 2]

4.2 Hypotheses Testing

Decision Rule: If P-value < 0.05, reject H₀ and accept H₁; otherwise accept H₀.

Hypothesis One
H₀₁: [exact from Chapter 1]
H₁₁: There is a significant relationship between [variable 1] and [variable 2] among [population] in [facility].
Chi-Square Test conducted. [State items used and N].

Table 4.5: Cross-Tabulation for Hypothesis One
Source: Research field work [Year]

| [Variable 1] | [Variable 2: Yes] | [Variable 2: No] | Total |
|--------------|-------------------|------------------|-------|
| High | [n] | [n] | [n] |
| Low | [n] | [n] | [n] |
| Total | [n] | [n] | [N] |

Inference: χ²(1) = [value], p = [value] < 0.05. Null hypothesis rejected.

Hypothesis Two
H₀₂: [exact from Chapter 1]
H₁₂: There is a significant relationship between socio-demographic factors and [variable 2] among [population] in [facility].

Table 4.6: Cross-Tabulation for Hypothesis Two
Source: Research field work [Year]

| [Factor] | [Variable 2: Yes] | [Variable 2: No] | Total |
|----------|-------------------|------------------|-------|
| High | [n] | [n] | [n] |
| Low | [n] | [n] | [n] |
| Total | [n] | [n] | [N] |

Inference: χ²(1) = [value], p = [value] < 0.05. Null hypothesis rejected.

4.3 Answering of Research Questions
Research Question One: [restate] — [1–2 sentence answer from Table 4.2]
Research Question Two: [restate] — [1–2 sentence answer from Table 4.3]
Research Question Three: [restate] — [1–2 sentence answer from Table 4.4]
NOTE: No references here. All at end of Chapter 5.`,

      ch5: `Write CHAPTER FIVE: DISCUSSION OF FINDINGS. Every paragraph must have at least one citation.

CHAPTER FIVE
DISCUSSION OF FINDINGS

5.1 Identification of Key Findings
Opening paragraph: restate aim, N, what chapter discusses.
Socio-Demographic Characteristics [bold, no number] — 1–2 cited paragraphs.
Findings on [Variable 1] [bold, no number] — 4 cited paragraphs: own findings % → global compare → Africa compare → Nigeria compare.
Findings on [Variable 2] [bold, no number] — same 4-paragraph structure.
Findings on Factors [bold, no number] — same structure.

5.2 Implications to Nursing
6–8 BOLD sub-headings, no numbers, 2–4 cited sentences each: Enhancing Education | Addressing Cultural Influences | Strengthening Referral Systems | Advocating Policy Changes | Building Community Support | Enhancing Nursing Training | Promoting Preventive Care | Addressing Socioeconomic Disparities.

5.3 Limitations of the Study — 1–2 paragraphs, honest limitations, cite 1 source.

5.4 Summary [bold, no number] — 1 paragraph: topic, N, facility, key findings (%), both hypothesis outcomes with χ² and p values.

5.5 Conclusion [bold, no number] — 1–2 cited paragraphs, forward-looking.

5.6 Recommendations [bold, no number] — 6–8 items: [Bold title]: [strategy + cited study.]

5.7 Suggestions for Further Studies [bold, no number] — 6 items: [Bold title]: [what, where, outcomes.]

REFERENCES [bold, centered, no number]
THIS IS THE ONLY PLACE REFERENCES APPEAR IN THE ENTIRE WORK.
ALL sources from Chapters 1–5 combined. Alphabetical. Minimum 25–30 entries.
Format: Author, A. A. (Year). Title. Journal, Vol(Issue), pages. https://doi.org/xxx`,
    };

    const clientCareInstructions = {
      ch1: `Write CHAPTER ONE: INTRODUCTION for a Client Care Study. All sections cited.
1.1 Background — 3–4 paragraphs, condition burden in Nigeria
1.2 Statement of Problem — 2–3 paragraphs, nursing gap
1.3 Purpose — 1 paragraph
1.4 Objectives — numbered list
1.5 Scope | 1.6 Significance | 1.7 Limitations | 1.8 Operational Definitions (6–8 terms)`,
      ch2: `Write CHAPTER TWO: LITERATURE REVIEW for Client Care Study. Every paragraph cited.
2.1 Conceptual Review — pathophysiology, epidemiology, aetiology
2.2 Clinical Manifestations — signs, symptoms, diagnostic criteria
2.3 Theoretical Review — 2–3 nursing theories + application
2.4 Empirical Review — 6–8 studies (2021–2025), Global→Africa→Nigeria
2.5 Pharmacological Management | 2.6 Multidisciplinary Team
NOTE: No references here.`,
      ch3: `Write CHAPTER THREE: CLIENT ASSESSMENT AND NURSING CARE PLAN. All cited.
3.1 Client Profile (initials only) | 3.2 Chief Complaints | 3.3 Medical History
3.4 Physical Examination — head-to-toe | 3.5 Investigation Results
3.6 Nursing Diagnoses — 5–6 NANDA, Maslow priority
3.7 Nursing Care Plan — Diagnosis|Goal|Outcomes|Interventions|Rationale|Evaluation
3.8 Discharge Plan
REFERENCES — full APA 7th list for all chapters`,
    };

    const instructions = isCC ? clientCareInstructions : researchInstructions;
    const modeLabel = isCC ? 'Client Care Study' : 'Academic Research Project';
    const topicLbl  = isCC ? 'CARE STUDY TOPIC' : 'RESEARCH TOPIC';
    const objLbl    = isCC ? 'CARE STUDY OBJECTIVES' : 'RESEARCH OBJECTIVES';

    return `You are a highly experienced Nigerian nursing academic writer. Write in natural human voice, never AI-sounding.

You write at ${level} level for ${department || 'Nursing Science'} department.

Write ${ch.title.toUpperCase()}: ${ch.subtitle.toUpperCase()} for the following ${modeLabel}.

${topicLbl}: ${topic}

${objLbl}:
${objectives.trim() ? objectives.trim() : `(Not provided by the user — derive clear, appropriate ${isCC ? 'care study' : 'research'} objectives yourself based on the topic above, and use them consistently across all chapters.)`}

ACADEMIC LEVEL: ${level}
DEPARTMENT: ${department || 'Nursing Science'}
WRITING MODE: ${modeLabel}

${guideSection}

TARGET LENGTH: Approximately ${chapterPages[chapterId] || '10-15'} pages

STRICT FORMAT:
${instructions[chapterId]}

${citationRules}

STANDARDS:
- Formal academic English, third person
- Nigerian healthcare context
- Minimum 1,500–2,500 words
- Use exact numbered subheadings (1.1, 1.2, 2.1.1 etc.)
- Begin directly with chapter title ALL CAPS — no preamble
- Every section fully written — no half-complete work
- Every paragraph has at least one in-text citation

Begin now with: ${ch.title.toUpperCase()}
${ch.subtitle.toUpperCase()}`;
  };

  // ── AI provider call (Claude or Gemini) ────────────────────────
  const callAI = async (prompt) => {
    if (aiProvider === 'gemini') {
      const key = import.meta.env.VITE_GEMINI_API_KEY;
      if (!key) throw new Error('VITE_GEMINI_API_KEY not set in Vercel.');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0.9 },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error('No response from Gemini.');
      if (candidate.finishReason === 'MAX_TOKENS' && !candidate.content?.parts?.length) {
        throw new Error('Gemini ran out of output tokens before writing any text — try a shorter target length.');
      }
      return (candidate.content?.parts || []).map(p => p.text || '').join('');
    }
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!key) throw new Error('VITE_ANTHROPIC_API_KEY not set in Vercel.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:6000, messages:[{role:'user',content:prompt}] }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.find(b => b.type==='text')?.text || '';
  };

  const generateChapter = async (chapterId) => {
    if (!canGenerate) return;
    setLoading(chapterId); setError('');
    try {
      const text = await callAI(buildPrompt(chapterId));
      setChapters(prev => ({...prev,[chapterId]:text}));
      setActiveChapter(chapterId);
    } catch(e) { setError(`Failed: ${e.message}`); }
    setLoading(null);
  };

  const generateAll = async () => {
    if (!canGenerate) return;
    setGeneratingAll(true); setError('');
    for (const ch of activeChapters) {
      setLoading(ch.id);
      try {
        const text = await callAI(buildPrompt(ch.id));
        setChapters(prev=>({...prev,[ch.id]:text}));
      } catch(e) { setError(`Error on ${ch.title}: ${e.message}`); break; }
      setLoading(null);
      await new Promise(r=>setTimeout(r,800));
    }
    setLoading(null); setGeneratingAll(false); setActiveChapter('ch1');
  };

  const toast = (msg, bg='#0D9488') => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;`;
    document.body.appendChild(el); setTimeout(()=>el.remove(),2800);
  };

  const copyChapter = (id) => { navigator.clipboard.writeText(chapters[id]||''); toast('📋 Chapter copied!'); };
  const copyAll = () => { navigator.clipboard.writeText(activeChapters.map(c=>chapters[c.id]||'').filter(Boolean).join('\n\n\n')); toast('📋 Full document copied!','#1E3A8A'); };

  // ── XML escape ───────────────────────────────────────────────
  const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ── OOXML paragraph helpers ──────────────────────────────────
  const mkRun = (text,bold=false) =>
    `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
    `<w:sz w:val="24"/><w:szCs w:val="24"/>${bold?'<w:b/><w:bCs/>':''}</w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

  const mkP = (runsXML,center=false,hanging=false,listIndent=false,pageBreak=false) => {
    const jc = center?`<w:jc w:val="center"/>`:`<w:jc w:val="both"/>`;
    const ind = hanging?`<w:ind w:left="720" w:hanging="720"/>`:listIndent?`<w:ind w:left="720"/>`:'';
    const pb = pageBreak?`<w:pageBreakBefore/>`:'';
    return `<w:p><w:pPr><w:spacing w:line="480" w:lineRule="auto" w:before="0" w:after="0"/>${jc}${ind}${pb}</w:pPr>${runsXML}</w:p>`;
  };

  const blank    = ()  => mkP(mkRun(''));
  const centerB  = t   => mkP(mkRun(t,true),true);
  const justB    = t   => mkP(mkRun(t,true),false);
  const justN    = t   => mkP(mkRun(t,false),false);
  const refLine  = t   => mkP(mkRun(t,false),false,true);
  const listLine = t   => mkP(mkRun(t,false),false,false,true);
  const newPage  = ()  => mkP(mkRun(''),true,false,false,true);
  const boldColon = text => { const ci=text.indexOf(':'); return ci<0?justN(text):mkP(mkRun(text.slice(0,ci+1),true)+mkRun(text.slice(ci+1),false),false); };
  const inlineBold = text => { const parts=text.split(/(\*\*[^*]+\*\*)/g); return mkP(parts.map(p=>p.startsWith('**')&&p.endsWith('**')?mkRun(p.slice(2,-2),true):mkRun(p,false)).join(''),false); };

  // ── Colored OOXML table ──────────────────────────────────────
  const mkColoredTableXML = (headers, dataRows, headerHex) => {
    const cols = Math.max(headers.length,...dataRows.map(r=>r.length));
    const tableW = 8640, colW = Math.floor(tableW/cols);
    const tcXML = (text,bold,fillHex,textHex='FFFFFF') => {
      const sh = fillHex?`<w:shd w:val="clear" w:color="auto" w:fill="${fillHex}"/>`:'';
      const brd = `<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/></w:tcBorders>`;
      return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/>${brd}${sh}<w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>` +
        `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/>` +
        `${bold?'<w:b/><w:bCs/>':''}${fillHex?`<w:color w:val="${textHex}"/>`:'<w:color w:val="1E293B"/>'}` +
        `</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
    };
    const headerRow = `<w:tr>${headers.map(h=>tcXML(h,true,headerHex)).join('')}</w:tr>`;
    const bodyRows  = dataRows.map((row,ri) => {
      const cells = Array.from({length:cols},(_,ci)=>row[ci]||'');
      return `<w:tr>${cells.map(c=>tcXML(c,false,ri%2===1?'F1F5F9':null,ri%2===1?'1E293B':'1E293B')).join('')}</w:tr>`;
    }).join('');
    const gridCols = Array.from({length:cols},()=>`<w:gridCol w:w="${colW}"/>`).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${tableW}" w:type="dxa"/>` +
      `<w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/><w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/></w:tblBorders>` +
      `</w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>`;
  };

  // ── Image paragraph ──────────────────────────────────────────
  const mkImgPara = (rIdNum) =>
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>` +
    `<w:r><w:rPr/><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="5400000" cy="3200000"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${rIdNum}" name="Chart${rIdNum}"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${rIdNum}" name="Chart${rIdNum}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rId${rIdNum+10}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="3200000"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

  // ── Line classifier ──────────────────────────────────────────
  const classify = line => {
    const t = line.trim();
    if (!t) return 'blank';
    if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) return 'chapter-title';
    if (t===t.toUpperCase()&&/^[A-Z][A-Z\s,&/\-]+$/.test(t)&&t.length>=4&&t.length<90&&!/^\d/.test(t)) return 'chapter-subtitle';
    if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) return 'subheading';
    if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t)||/^H[₁1][₁₂₃123][:.\s]/.test(t)) return 'hypothesis';
    if (/^(Broad Objective|Specific Objectives|Decision Rule|Inference:|Source:|REFERENCES|Research (Question|Hypothesis)\s+\d+|Hypothesis (One|Two)|Summary of the Study|Conclusion|Recommendations|Suggestions for Further Studies|Socio-Demographic|Findings on|Implications|Limitations of)/i.test(t)) return 'bold-label';
    if (/^Table\s+4[\.\d]+/i.test(t)) return 'table-title';
    if (/^Figure\s+4[\.\d]+/i.test(t)) return 'figure-label';
    if (/^[A-Z][A-Za-z\s]+:/.test(t)&&t.length<140&&!/^(http|https|doi|www)/i.test(t)&&!/^\d/.test(t)&&t.split(':')[0].split(' ').length<=10) return 'bold-colon';
    if (/^[A-Z][a-z]+,\s[A-Z][\.\s]/.test(t)) return 'reference';
    if (/^(\d+\.|[ivxlIVXL]+\.|[a-z]\)|-|\*)\s/.test(t)) return 'list-item';
    if (t.startsWith('|')||(t.includes('|')&&t.indexOf('|')<5)) return 'table-row';
    if (t.includes('**')) return 'inline-bold';
    return 'body';
  };

  // ── Standard text → OOXML (chapters 1,2,3,5) ────────────────
  const textToXML = rawText => {
    const lines = rawText.split('\n');
    let out='', prev=null, tableBuf=[];
    const flushTable = () => {
      if (!tableBuf.length) return;
      // Parse pipe rows into headers + data rows and render as colored table
      const rawRows = tableBuf.map(r => r.split('|').map(c=>c.trim()).filter(Boolean));
      const validRows = rawRows.filter(r => !r.join('').match(/^[-| ]+$/));
      if (validRows.length >= 2) {
        const headers = validRows[0];
        const dataRows = validRows.slice(1);
        out += mkColoredTableXML(headers, dataRows, '2563EB');
      } else {
        tableBuf.forEach(r => { out+=`<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${esc(r)}</w:t></w:r></w:p>`; });
      }
      out+=blank(); tableBuf=[];
    };
    for (const line of lines) {
      const type=classify(line); const t=line.trim();
      if (type==='table-row') { tableBuf.push(t); prev=type; continue; }
      if (tableBuf.length) flushTable();
      if (type==='blank') { if(prev!=='blank'&&prev!==null) out+=blank(); prev='blank'; continue; }
      if ((type==='subheading'||type==='chapter-title'||type==='bold-label')&&prev!==null&&prev!=='blank'&&prev!=='chapter-title'&&prev!=='chapter-subtitle') out+=blank();
      switch(type) {
        case 'chapter-title':    out+=centerB(t.toUpperCase()); break;
        case 'chapter-subtitle': out+=centerB(t.toUpperCase()); break;
        case 'subheading':       out+=justB(t); break;
        case 'bold-label':       out+=justB(t); break;
        case 'hypothesis':       out+=justB(t); break;
        case 'bold-colon':       out+=boldColon(t); break;
        case 'reference':        out+=refLine(t); break;
        case 'list-item':        out+=listLine(t); break;
        case 'inline-bold':      out+=inlineBold(t); break;
        default:                 out+=justN(t); break;
      }
      prev=type;
    }
    flushTable(); return out;
  };

  // ── Chapter 4 → OOXML with colored tables + chart images ─────
  const buildChapterFourXML = (rawText, tables, chartImages) => {
    const lines = rawText.split('\n');
    let out='', prev=null, tblIdx=0, chartIdx=0;
    for (const line of lines) {
      const type=classify(line); const t=line.trim();
      if (type==='table-row') { prev='table-row'; continue; } // skip raw pipe rows
      if (type==='blank') { if(prev!=='blank'&&prev!==null) out+=blank(); prev='blank'; continue; }
      if (type==='table-title') {
        if(prev!=='blank') out+=blank();
        out+=justB(t); out+=blank();
        if (tables[tblIdx]) { out+=mkColoredTableXML(tables[tblIdx].headers,tables[tblIdx].dataRows,tables[tblIdx].color||'2563EB'); tblIdx++; }
        out+=blank(); prev='table-title'; continue;
      }
      if (type==='figure-label') {
        out+=blank(); out+=mkP(mkRun(t,true),true);
        const figNum = t.match(/Figure\s+4\.(\d+)/i)?.[1];
        if (figNum) {
          const imgIdx = parseInt(figNum)-1;
          if (chartImages[imgIdx]) { out+=mkImgPara(imgIdx+1); }
        } else if (chartImages[chartIdx]) { out+=mkImgPara(chartIdx+1); chartIdx++; }
        out+=blank(); prev='figure-label'; continue;
      }
      if ((type==='subheading'||type==='chapter-title'||type==='bold-label')&&prev!==null&&prev!=='blank'&&prev!=='chapter-title'&&prev!=='chapter-subtitle') out+=blank();
      switch(type) {
        case 'chapter-title':    out+=centerB(t.toUpperCase()); break;
        case 'chapter-subtitle': out+=centerB(t.toUpperCase()); break;
        case 'subheading':       out+=justB(t); break;
        case 'bold-label':       out+=justB(t); break;
        case 'hypothesis':       out+=justB(t); break;
        case 'bold-colon':       out+=boldColon(t); break;
        case 'reference':        out+=refLine(t); break;
        case 'list-item':        out+=listLine(t); break;
        case 'inline-bold':      out+=inlineBold(t); break;
        default:                 out+=justN(t); break;
      }
      prev=type;
    }
    return out;
  };

  // ── Download .docx ───────────────────────────────────────────
  const downloadDocx = async () => {
    const hasContent = activeChapters.some(c=>chapters[c.id]);
    if (!hasContent) { toast('⚠️ No chapters generated yet','#D97706'); return; }
    setDownloadingDocx(true);
    try {
      if (!window.JSZip) {
        await new Promise((resolve,reject) => {
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload=resolve; s.onerror=()=>reject(new Error('Could not load JSZip.')); document.head.appendChild(s);
        });
      }

      // Generate chart PNGs for chapter 4
      const ch4Text = chapters['ch4']||'';
      const ch4Tables = parseChapterFourTables(ch4Text);
      const chartImages = ch4Tables.map((tbl,i) => {
        if (!tbl.chartLabels.length) return null;
        return { base64: makeBarChartPng(tbl.chartTitle, tbl.chartLabels, tbl.chartValues, '#'+tbl.color) };
      }).filter(Boolean);

      // Build body
      const monthYear = `${new Date().toLocaleString('default',{month:'long'}).toUpperCase()}, ${new Date().getFullYear()}.`;
      const titleXML = [blank(),blank(),blank(),blank(),centerB((topic||'RESEARCH PROJECT').toUpperCase()),blank(),centerB('BY'),blank(),mkP(mkRun('___________________________'),true),blank(),centerB('PRESENTED TO'),centerB(`DEPARTMENT OF ${(department||'NURSING SCIENCE').toUpperCase()}`),centerB('NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS'),blank(),blank(),centerB(monthYear)].join('');

      let bodyXML = titleXML;
      for (const ch of activeChapters) {
        if (!chapters[ch.id]) continue;
        bodyXML += newPage();
        bodyXML += ch.id==='ch4' ? buildChapterFourXML(chapters[ch.id], ch4Tables, chartImages) : textToXML(chapters[ch.id]);
      }

      const sectProps = `<w:sectPr><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:footer="720" w:header="0" w:gutter="0"/><w:pgNumType w:fmt="decimal" w:start="1"/></w:sectPr>`;

      const documentXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
        `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<w:body>${bodyXML}${sectProps}</w:body></w:document>`;

      const footerXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;

      const imgRels = chartImages.map((_,i)=>`<Relationship Id="rId${i+11}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/chart${i+1}.png"/>`).join('');

      const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${chartImages.length?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;

      const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

      const wordRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${imgRels}</Relationships>`;

      const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="480" w:lineRule="auto" w:before="0" w:after="0"/><w:jc w:val="both"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;

      const settingsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/></w:settings>`;

      const zip = new window.JSZip();
      zip.file('[Content_Types].xml', contentTypes);
      zip.file('_rels/.rels', relsXML);
      zip.file('word/_rels/document.xml.rels', wordRelsXML);
      zip.file('word/document.xml', documentXML);
      zip.file('word/styles.xml', stylesXML);
      zip.file('word/settings.xml', settingsXML);
      zip.file('word/footer1.xml', footerXML);
      chartImages.forEach((img,i) => {
        const bin=atob(img.base64); const bytes=new Uint8Array(bin.length);
        for(let k=0;k<bin.length;k++) bytes[k]=bin.charCodeAt(k);
        zip.file(`word/media/chart${i+1}.png`,bytes);
      });

      const blob = await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
      const fileName = `${(topic||'Research').slice(0,60).replace(/[^a-zA-Z0-9 ]/g,'').trim()}.docx`;
      const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast('✅ Word document downloaded!','#16A34A');
    } catch(err) { console.error('DOCX error:',err); toast(`❌ Word failed: ${err.message}`,'#DC2626'); }
    setDownloadingDocx(false);
  };

  // ── Download PDF ─────────────────────────────────────────────
  const downloadPdf = async () => {
    const hasContent = activeChapters.some(c=>chapters[c.id]);
    if (!hasContent) { toast('⚠️ No chapters generated yet','#D97706'); return; }
    setDownloadingPdf(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve,reject) => {
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          s.onload=resolve; s.onerror=()=>reject(new Error('Could not load jsPDF.')); document.head.appendChild(s);
        });
      }
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const PW=doc.internal.pageSize.getWidth(), PH=doc.internal.pageSize.getHeight();
      const mL=25,mR=20,mT=25,mB=20,uW=PW-mL-mR;
      let y=mT, pageNum=1;
      const addPN=()=>{doc.setFontSize(10);doc.setFont('times','normal');doc.text(String(pageNum),PW/2,PH-10,{align:'center'});};
      const chkPg=(n=10)=>{if(y+n>PH-mB){addPN();doc.addPage();pageNum++;y=mT;}};
      const writePara=(text)=>{doc.setFontSize(12);doc.setFont('times','normal');const ls=doc.splitTextToSize(text,uW);ls.forEach(l=>{chkPg(8);doc.text(l,mL,y);y+=8;});y+=4;};

      // Title page
      y=PH/2-40;
      doc.setFontSize(14);doc.setFont('times','bold');
      const tl=doc.splitTextToSize((topic||'RESEARCH PROJECT').toUpperCase(),uW);
      tl.forEach(l=>{doc.text(l,PW/2,y,{align:'center'});y+=10;});
      y+=6;doc.setFontSize(12);doc.text('BY',PW/2,y,{align:'center'});y+=10;
      doc.setFont('times','normal');doc.text('___________________________',PW/2,y,{align:'center'});y+=10;
      doc.text('PRESENTED TO',PW/2,y,{align:'center'});y+=8;
      doc.text(`DEPARTMENT OF ${(department||'NURSING SCIENCE').toUpperCase()}`,PW/2,y,{align:'center'});y+=8;
      doc.text('NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS',PW/2,y,{align:'center'});y+=12;
      doc.text(`${new Date().toLocaleString('default',{month:'long'}).toUpperCase()}, ${new Date().getFullYear()}`,PW/2,y,{align:'center'});

      for (const ch of activeChapters) {
        if (!chapters[ch.id]) continue;
        addPN(); doc.addPage(); pageNum++; y=mT;
        const isCh4=ch.id==='ch4';
        const ch4Tables = isCh4?parseChapterFourTables(chapters[ch.id]):[];
        let tblIdx=0, figIdx=0;

        const drawTbl=(headers,dataRows,hexColor)=>{
          const r=parseInt(hexColor.slice(0,2),16),g=parseInt(hexColor.slice(2,4),16),b=parseInt(hexColor.slice(4,6),16);
          const cols=Math.max(headers.length,...dataRows.map(r=>r.length));
          const cW=uW/cols, rH=8;
          chkPg(rH+4);
          doc.setFillColor(r,g,b); doc.rect(mL,y,uW,rH,'F');
          doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('times','bold');
          headers.forEach((h,i)=>doc.text(String(h).slice(0,18),mL+i*cW+cW/2,y+5.5,{align:'center'}));
          y+=rH;
          dataRows.forEach((row,ri)=>{
            chkPg(rH);
            if(ri%2===1){doc.setFillColor(241,245,249);}else{doc.setFillColor(255,255,255);}
            doc.rect(mL,y,uW,rH,'F');
            doc.setTextColor(30,41,59); doc.setFontSize(9); doc.setFont('times','normal');
            const cells=Array.from({length:cols},(_,ci)=>row[ci]||'');
            cells.forEach((c,i)=>doc.text(String(c).slice(0,20),mL+i*cW+cW/2,y+5.5,{align:'center'}));
            doc.setDrawColor(200,200,200); doc.setLineWidth(0.1); doc.rect(mL,y,uW,rH,'S');
            y+=rH;
          });
          doc.setTextColor(0,0,0); y+=4;
        };

        const drawChart=(tbl)=>{
          if(!tbl.chartLabels.length) return;
          const b64=makeBarChartPng(tbl.chartTitle,tbl.chartLabels,tbl.chartValues,'#'+tbl.color);
          const imgH=uW*(320/560);
          chkPg(imgH+10);
          doc.addImage('data:image/png;base64,'+b64,'PNG',mL,y,uW,imgH);
          y+=imgH+6;
        };

        const lines=chapters[ch.id].split('\n');
        for (const line of lines) {
          const t=line.trim();
          if (!t){y+=3;continue;}
          if (isCh4&&(t.startsWith('|')||(t.includes('|')&&t.indexOf('|')<5))) continue;
          if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) { chkPg(14);doc.setFontSize(14);doc.setFont('times','bold');doc.text(t.toUpperCase(),PW/2,y,{align:'center'});y+=12; }
          else if (t===t.toUpperCase()&&/^[A-Z][A-Z\s,&/\-]+$/.test(t)&&t.length>=4&&t.length<90&&!/^\d/.test(t)) { chkPg(12);doc.setFontSize(13);doc.setFont('times','bold');doc.text(t,PW/2,y,{align:'center'});y+=10; }
          else if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) { y+=3;chkPg(12);doc.setFontSize(12);doc.setFont('times','bold');doc.text(t,mL,y);y+=9; }
          else if (isCh4&&/^Table\s+4[\.\d]+/i.test(t)) { y+=3;chkPg(12);doc.setFontSize(11);doc.setFont('times','bold');doc.text(t,mL,y);y+=8; if(ch4Tables[tblIdx]){drawTbl(ch4Tables[tblIdx].headers,ch4Tables[tblIdx].dataRows,ch4Tables[tblIdx].color||'2563EB');tblIdx++;} }
          else if (isCh4&&/^Figure\s+4[\.\d]+/i.test(t)) { chkPg(12);doc.setFontSize(11);doc.setFont('times','bold');doc.text(t,PW/2,y,{align:'center'});y+=8; if(ch4Tables[figIdx]){drawChart(ch4Tables[figIdx]);figIdx++;} }
          else if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t)||/^H[₁1][₁₂₃123][:.\s]/.test(t)) { chkPg(9);doc.setFontSize(12);doc.setFont('times','bold');doc.text(t,mL,y);y+=9; }
          else if (/^(REFERENCES|Summary of the Study|Conclusion|Recommendations|Suggestions for Further Studies|Socio-Demographic|Findings on|Implications|Limitations|Decision Rule|Inference:|Hypothesis (One|Two)|Broad Objective|Specific Objectives)/i.test(t)) { y+=3;chkPg(12);doc.setFontSize(12);doc.setFont('times','bold');doc.text(t,mL,y);y+=9; }
          else if (/^[A-Z][A-Za-z\s]+:/.test(t)&&t.length<140&&t.split(':')[0].split(' ').length<=10) {
            chkPg(9); const ci=t.indexOf(':');
            doc.setFontSize(12);doc.setFont('times','bold');
            const bW=doc.getTextWidth(t.slice(0,ci+1));
            doc.text(t.slice(0,ci+1),mL,y);
            doc.setFont('times','normal');
            const rest=doc.splitTextToSize(t.slice(ci+1),uW-bW-1);
            if(rest[0]) doc.text(rest[0],mL+bW+1,y); y+=8;
            if(rest.length>1) rest.slice(1).forEach(l=>{chkPg(8);doc.text(l,mL,y);y+=8;});
          }
          else if (/^[A-Z][a-z]+,\s[A-Z][\.\s]/.test(t)) { doc.setFontSize(11);doc.setFont('times','normal');const rl=doc.splitTextToSize(t,uW-10);rl.forEach((l,li)=>{chkPg(8);doc.text(l,li===0?mL:mL+10,y);y+=7;}); }
          else if (/^(\d+\.|[ivxlIVXL]+\.|[a-z]\)|-|\*)\s/.test(t)) { doc.setFontSize(12);doc.setFont('times','normal');const ll=doc.splitTextToSize(t,uW-8);ll.forEach((l,li)=>{chkPg(8);doc.text(l,mL+(li>0?8:0),y);y+=8;}); }
          else { writePara(t); }
        }
      }
      addPN();
      doc.save(`${(topic||'Research').slice(0,60).replace(/[^a-zA-Z0-9 ]/g,'').trim()}.pdf`);
      toast('✅ PDF downloaded!','#16A34A');
    } catch(err) { console.error('PDF error:',err); toast(`❌ PDF failed: ${err.message}`,'#DC2626'); }
    setDownloadingPdf(false);
  };

  const inp={width:'100%',padding:'11px 14px',background:'var(--bg-tertiary,#1a2236)',border:'1.5px solid var(--border,#2d3748)',borderRadius:8,color:'var(--text-primary,#e2e8f0)',fontFamily:'var(--font-body,inherit)',fontSize:14,outline:'none',boxSizing:'border-box'};
  const lbl={display:'block',fontSize:12,fontWeight:700,color:'var(--text-muted,#718096)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6};
  const accentColor=mode==='clientcare'?'#7C3AED':'#0D9488';

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary,#0f172a)',paddingTop:64,paddingBottom:60}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .ai-ch-btn{transition:all 0.2s} .ai-ch-btn:hover:not(:disabled){transform:translateY(-2px);opacity:0.9}`}</style>

      <div style={{background:mode==='clientcare'?'linear-gradient(135deg,#7C3AED,#0D9488)':'linear-gradient(135deg,#1E3A8A,#0D9488)',padding:'24px 20px',transition:'background 0.4s'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:30}}>{mode==='clientcare'?'🏥':'🤖'}</span>
            <div>
              <h1 style={{fontFamily:'var(--font-display,serif)',fontSize:'clamp(17px,3vw,24px)',fontWeight:700,color:'#fff',margin:0}}>{mode==='clientcare'?'AI Client Care Study Writer':'AI Research Writer'}</h1>
              <p style={{color:'rgba(255,255,255,0.75)',fontSize:12,margin:'3px 0 0'}}>{totalChapters} chapters · APA 7th ed. · Colored tables & charts · Word + PDF</p>
            </div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)',borderRadius:12,padding:4,display:'flex',gap:3}}>
            {[['research','🔬 Research','#1E3A8A'],['clientcare','🏥 Client Care','#7C3AED']].map(([m,label,col])=>(
              <button key={m} onClick={()=>{setMode(m);setChapters({});setActiveChapter(null);setError('');}}
                style={{padding:'7px 13px',borderRadius:9,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,fontFamily:'var(--font-body,inherit)',transition:'all 0.2s',whiteSpace:'nowrap',background:mode===m?'#fff':'transparent',color:mode===m?col:'rgba(255,255,255,0.75)'}}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'14px 16px 0',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8}}>
        <span style={{fontSize:11,fontWeight:600,color:'var(--text-muted,#718096)'}}>AI Engine:</span>
        <div style={{background:'var(--bg-card,#1a2236)',border:'1px solid var(--border-card,#2d3748)',borderRadius:10,padding:3,display:'flex',gap:3}}>
          {[['claude','✦ Claude'],['gemini','✧ Gemini']].map(([p,label])=>(
            <button key={p} type="button" onClick={()=>setAiProvider(p)}
              style={{padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'var(--font-body,inherit)',transition:'all 0.2s',background:aiProvider===p?accentColor:'transparent',color:aiProvider===p?'#fff':'var(--text-muted,#718096)'}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px',display:'flex',flexDirection:'column',gap:18}}>

        <div style={{background:'var(--bg-card,#1a2236)',border:'1px solid var(--border-card,#2d3748)',borderRadius:14,padding:'22px'}}>
          <h2 style={{fontFamily:'var(--font-display,serif)',fontSize:17,fontWeight:700,color:'var(--text-primary,#e2e8f0)',marginBottom:18}}>{mode==='clientcare'?'🏥 Care Study Details':'📝 Research Details'}</h2>
          <div style={{display:'flex',flexDirection:'column',gap:15}}>
            <div>
              <label style={lbl}>{mode==='clientcare'?'Client Condition / Care Study Topic *':'Research Topic *'}</label>
              <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={3} placeholder={mode==='clientcare'?'e.g. Nursing Care of a 48-Year-Old Female Patient with Type 2 Diabetes Mellitus':'e.g. Assessment of Knowledge and Practice of Infection Prevention Among Nurses in Lagos State University Teaching Hospital'} style={{...inp,resize:'vertical',lineHeight:1.6}}/>
              <div style={{fontSize:11,color:topic.length>=10?'#16A34A':'var(--text-muted,#718096)',marginTop:4}}>{topic.length>=10?'✅ Good':`${topic.length}/10 min`}</div>
            </div>
            <div>
              <label style={lbl}>{mode==='clientcare'?'Care Study Objectives':'Research Objectives'} <span style={{fontSize:11,fontWeight:400,color:'var(--text-muted,#718096)'}}>(optional)</span></label>
              <textarea value={objectives} onChange={e=>setObjectives(e.target.value)} rows={5} placeholder={'Leave blank and the AI will draft objectives from your topic, or list your own:\n1. To assess the level of knowledge...\n2. To determine the practice...\n3. To identify factors influencing...\n4. To examine the relationship between...'} style={{...inp,resize:'vertical',lineHeight:1.7}}/>
              <div style={{fontSize:11,color:'var(--text-muted,#718096)',marginTop:4}}>{objectives.trim()?`✅ Set — ${objectives.length} characters`:'Optional — AI will generate objectives from your topic if left blank'}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Academic Level</label>
                <select value={level} onChange={e=>setLevel(e.target.value)} style={inp}>{['OND','HND','BSc / B.Tech','PGD','MSc / MBA','PhD'].map(l=><option key={l}>{l}</option>)}</select>
              </div>
              <div>
                <label style={lbl}>{mode==='clientcare'?'Ward / Specialty':'Department / Field'}</label>
                <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder={mode==='clientcare'?'e.g. Medical Ward':'e.g. Nursing Science'} style={inp}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Citation Style</label>
              <select value={citationStyle} onChange={e=>setCitationStyle(e.target.value)} style={{...inp,width:'auto',minWidth:180}}>{['APA','MLA','Harvard','Vancouver','Chicago'].map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div style={{background:'var(--bg-tertiary,#0f172a)',border:'1px solid var(--border,#2d3748)',borderRadius:10,padding:'14px 16px'}}>
              <label style={{...lbl,marginBottom:10}}>📄 Pages Per Chapter</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))',gap:10}}>
                {activeChapters.map(ch=>(
                  <div key={ch.id}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:ch.color,marginBottom:4}}>{ch.title.replace('Chapter ','Ch.')}</label>
                    <input type="text" value={chapterPages[ch.id]||'10-15'} onChange={e=>setChapterPages(p=>({...p,[ch.id]:e.target.value}))} placeholder="e.g. 10-15" style={{...inp,padding:'8px 10px',fontSize:13}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{background:'var(--bg-card,#1a2236)',border:`1px solid ${showGuide?accentColor+'60':'var(--border-card,#2d3748)'}`,borderRadius:14,overflow:'hidden'}}>
          <button onClick={()=>setShowGuide(v=>!v)} style={{width:'100%',padding:'16px 22px',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>📂</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--text-primary,#e2e8f0)'}}>Guide Document <span style={{fontSize:11,fontWeight:400,color:'var(--text-muted,#718096)'}}>(optional)</span></div>
                <div style={{fontSize:12,color:'var(--text-muted,#718096)',marginTop:2}}>{guideDoc.trim()?`✅ Loaded${guideFileName?` — ${guideFileName}`:''} · ${guideDoc.trim().split(/\s+/).length.toLocaleString()} words`:'Upload chapters 1–5 as strict format guide · max 5MB'}</div>
              </div>
            </div>
            <span style={{color:accentColor,fontSize:18,transition:'transform 0.2s',transform:showGuide?'rotate(180deg)':'none'}}>▾</span>
          </button>
          {showGuide&&(
            <div style={{padding:'0 22px 22px',borderTop:'1px solid var(--border,#2d3748)'}}>
              <div style={{background:'rgba(37,99,235,0.07)',border:'1px solid rgba(37,99,235,0.2)',borderRadius:8,padding:'10px 14px',margin:'14px 0',fontSize:13,color:'#60A5FA'}}>
                ℹ️ The AI will treat this as the <strong>mandatory format authority</strong> — strictly following its structure, headings, and depth for every chapter.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                <label style={{display:'inline-flex',alignItems:'center',gap:6,background:accentColor,color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13,flexShrink:0}}>
                  📎 Upload File<input type="file" accept=".txt,.doc,.docx,.pdf" style={{display:'none'}} onChange={handleGuideFile}/>
                </label>
                <span style={{fontSize:12,color:'var(--text-muted,#718096)'}}>max 5MB</span>
                {guideDoc.trim()&&<button onClick={()=>{setGuideDoc('');setGuideFileName('');sessionStorage.removeItem('aiw_guide');sessionStorage.removeItem('aiw_guidename');}} style={{marginLeft:'auto',background:'#EF4444',color:'#fff',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:12,fontWeight:700}}>✕ Clear</button>}
              </div>
              <label style={lbl}>Or paste document text directly</label>
              <textarea value={guideDoc} onChange={e=>{setGuideDoc(e.target.value);setGuideFileName('');sessionStorage.setItem('aiw_guide',e.target.value);}} rows={8} placeholder="Paste chapters 1–5 here. AI will strictly follow this format." style={{...inp,resize:'vertical',lineHeight:1.7,fontSize:13}}/>

              {canManageGuides && (
                <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid var(--border,#2d3748)'}}>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>{setShowGuideLibrary(v=>!v);setShowSaveGuideBox(false);if(!showGuideLibrary)refreshGuideLibrary();}} style={{background:'transparent',color:accentColor,border:`1px solid ${accentColor}60`,borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700}}>
                      📚 My Saved Guides {savedGuides.length>0?`(${savedGuides.length})`:''}
                    </button>
                    {guideDoc.trim() && (
                      <button type="button" onClick={()=>{setShowSaveGuideBox(v=>!v);setShowGuideLibrary(false);setSaveGuideName(guideFileName||'');}} style={{background:'transparent',color:'#16A34A',border:'1px solid rgba(22,163,74,0.4)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700}}>
                        💾 Save This Guide
                      </button>
                    )}
                  </div>

                  {showSaveGuideBox && (
                    <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                      <input value={saveGuideName} onChange={e=>setSaveGuideName(e.target.value)} placeholder="Name this guide, e.g. NACON Diabetes Care Study Format" style={{...inp,flex:1,minWidth:200}}/>
                      <button type="button" disabled={savingGuide} onClick={handleSaveGuide} style={{background:'#16A34A',color:'#fff',border:'none',borderRadius:8,padding:'0 16px',cursor:savingGuide?'default':'pointer',fontWeight:700,fontSize:13,opacity:savingGuide?0.7:1}}>
                        {savingGuide?'Saving…':'Save'}
                      </button>
                    </div>
                  )}

                  {showGuideLibrary && (
                    <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8,maxHeight:260,overflowY:'auto'}}>
                      {loadingGuides && <div style={{fontSize:12,color:'var(--text-muted,#718096)'}}>Loading saved guides…</div>}
                      {!loadingGuides && savedGuides.length===0 && <div style={{fontSize:12,color:'var(--text-muted,#718096)'}}>No saved guides yet. Load or paste a guide above, then tap "Save This Guide".</div>}
                      {savedGuides.map(g=>(
                        <div key={g.id} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-secondary,#151b2c)',border:'1px solid var(--border,#2d3748)',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary,#e2e8f0)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{g.name}</div>
                            <div style={{fontSize:11,color:'var(--text-muted,#718096)'}}>{(g.wordCount||0).toLocaleString()} words{g.truncated?' · trimmed':''}</div>
                          </div>
                          <button type="button" onClick={()=>handleUseGuide(g)} style={{background:accentColor,color:'#fff',border:'none',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:700,flexShrink:0}}>Use</button>
                          <button type="button" onClick={()=>handleDeleteGuide(g.id)} style={{background:'transparent',color:'#EF4444',border:'1px solid rgba(239,68,68,0.4)',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:12,fontWeight:700,flexShrink:0}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{background:'rgba(22,163,74,0.07)',border:'1px solid rgba(22,163,74,0.25)',borderRadius:10,padding:'10px 16px',display:'flex',gap:10,alignItems:'flex-start'}}>
          <span style={{fontSize:16,flexShrink:0}}>📚</span>
          <div style={{fontSize:12,color:'rgba(22,163,74,0.9)',lineHeight:1.6}}><strong>Citation Policy:</strong> Every paragraph cited. All references combined at end of Chapter 5 only. APA 7th edition, 2021–2025.</div>
        </div>
        <div style={{background:'rgba(37,99,235,0.07)',border:'1px solid rgba(37,99,235,0.25)',borderRadius:10,padding:'10px 16px',display:'flex',gap:10,alignItems:'flex-start'}}>
          <span style={{fontSize:16,flexShrink:0}}>📊</span>
          <div style={{fontSize:12,color:'rgba(147,197,253,0.9)',lineHeight:1.6}}><strong>Chapter 4 Format:</strong> Tables render as <strong>colored Word tables</strong> (blue/purple headers, alternating rows). Bar charts embedded as images. Available in both Word and PDF.</div>
        </div>

        {error&&<div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:10,padding:'12px 16px',color:'#EF4444',fontSize:14}}>❌ {error}</div>}

        <button onClick={generateAll} disabled={!canGenerate||generatingAll||loading!==null}
          style={{width:'100%',padding:'15px',borderRadius:12,border:'none',fontSize:15,fontWeight:700,fontFamily:'var(--font-body,inherit)',cursor:canGenerate&&!generatingAll&&!loading?'pointer':'not-allowed',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
            background:canGenerate&&!generatingAll&&!loading?(mode==='clientcare'?'linear-gradient(135deg,#7C3AED,#0D9488)':'linear-gradient(135deg,#1E3A8A,#0D9488)'):'rgba(45,55,72,0.6)',
            color:canGenerate?'#fff':'rgba(255,255,255,0.4)'}}>
          {generatingAll?<><div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Generating {activeChapters.find(c=>c.id===loading)?.title||'…'}</>
            :mode==='clientcare'?`🏥 Generate All ${totalChapters} Care Study Chapters`:`🚀 Generate All ${totalChapters} Chapters At Once`}
        </button>

        <div style={{display:'grid',gridTemplateColumns:`repeat(${totalChapters}, 1fr)`,gap:8}}>
          {activeChapters.map(ch=>{
            const done=!!chapters[ch.id]; const isLoading=loading===ch.id;
            return (
              <button key={ch.id} className="ai-ch-btn" onClick={()=>done?setActiveChapter(ch.id):generateChapter(ch.id)} disabled={!canGenerate||(loading!==null&&!isLoading)}
                style={{padding:'10px 6px',borderRadius:10,border:`2px solid ${activeChapter===ch.id?ch.color:done?ch.border:'var(--border,#2d3748)'}`,background:activeChapter===ch.id?ch.bg:done?ch.bg:'var(--bg-card,#1a2236)',color:done?ch.color:'var(--text-muted,#718096)',cursor:canGenerate&&(!loading||isLoading)?'pointer':'not-allowed',fontFamily:'var(--font-body,inherit)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                {isLoading?<div style={{width:18,height:18,border:`2px solid ${ch.color}40`,borderTop:`2px solid ${ch.color}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<span style={{fontSize:16}}>{done?'✅':'✍️'}</span>}
                <span style={{fontSize:10,fontWeight:700,textAlign:'center',lineHeight:1.3}}>{ch.title.replace('Chapter ','Ch.')}</span>
                <span style={{fontSize:9,opacity:0.7,textAlign:'center',lineHeight:1.2}}>{ch.subtitle}</span>
              </button>
            );
          })}
        </div>

        {generatedCount>0&&(
          <div style={{background:'var(--bg-card,#1a2236)',borderRadius:10,padding:'14px 18px',border:'1px solid var(--border-card,#2d3748)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:13,fontWeight:700,color:'var(--text-primary,#e2e8f0)'}}>{generatedCount}/{totalChapters} chapter{generatedCount>1?'s':''} generated {generatedCount===totalChapters&&<span style={{marginLeft:8,color:'#16A34A'}}>✅ Complete</span>}</span>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={copyAll} style={{background:'#1E3A8A',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:12}}>📋 Copy All</button>
                <button onClick={downloadDocx} disabled={downloadingDocx} style={{background:downloadingDocx?'rgba(13,148,136,0.5)':'#0D9488',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:downloadingDocx?'not-allowed':'pointer',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                  {downloadingDocx?<><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Building…</>:'⬇️ Word (.docx)'}
                </button>
                <button onClick={downloadPdf} disabled={downloadingPdf} style={{background:downloadingPdf?'rgba(220,38,38,0.5)':'#DC2626',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:downloadingPdf?'not-allowed':'pointer',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                  {downloadingPdf?<><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Building…</>:'⬇️ PDF'}
                </button>
              </div>
            </div>
            <div style={{background:'var(--bg-tertiary,#2d3748)',borderRadius:20,height:8,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(generatedCount/totalChapters)*100}%`,background:`linear-gradient(90deg,${mode==='clientcare'?'#7C3AED':'#1E3A8A'},#0D9488)`,borderRadius:20,transition:'width 0.5s ease'}}/>
            </div>
          </div>
        )}

        {activeChapter&&chapters[activeChapter]&&(()=>{
          const ch=activeChapters.find(c=>c.id===activeChapter);
          if (!ch) return null;
          const isCh4=activeChapter==='ch4';

          // ── Chapter 4 Rich Renderer ──────────────────────────────
          const renderCh4 = (rawText) => {
            const ch4Tables = parseChapterFourTables(rawText);
            let tblIdx=0, figIdx=0;
            const lines = rawText.split('\n');
            const elements = [];
            let key = 0;
            const tableColors = ['#2563EB','#7C3AED','#0D9488','#D97706','#DC2626','#16A34A'];

            const ChartBar = ({tbl}) => {
              const max = Math.max(...tbl.chartValues,1);
              const barColors = ['#2563EB','#7C3AED','#0D9488','#D97706','#DC2626','#16A34A','#0891B2','#9333EA'];
              return (
                <div style={{background:'#fff',borderRadius:10,padding:'18px 16px 12px',border:'1px solid #e2e8f0',margin:'8px 0'}}>
                  <div style={{fontWeight:700,fontSize:13,color:'#1e293b',textAlign:'center',marginBottom:14}}>{tbl.chartTitle}</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:6,height:180,padding:'0 8px'}}>
                    {tbl.chartLabels.map((label,i)=>{
                      const pct = (tbl.chartValues[i]/max)*100;
                      const col = barColors[i%barColors.length];
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          <div style={{fontSize:10,fontWeight:700,color:col}}>{tbl.chartValues[i]}%</div>
                          <div style={{width:'100%',background:`linear-gradient(180deg,${col},${col}cc)`,height:`${Math.max(pct,2)}%`,borderRadius:'4px 4px 0 0',minHeight:4,boxShadow:`0 2px 6px ${col}40`,transition:'height 0.3s'}}/>
                          <div style={{fontSize:9,color:'#64748b',textAlign:'center',lineHeight:1.3,maxWidth:60,wordBreak:'break-word'}}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{borderTop:'2px solid #e2e8f0',marginTop:4}}/>
                </div>
              );
            };

            const StyledTable = ({tbl,colorHex}) => {
              const cols = Math.max(tbl.headers.length,...tbl.dataRows.map(r=>r.length));
              return (
                <div style={{overflowX:'auto',margin:'8px 0',borderRadius:8,boxShadow:'0 2px 8px rgba(0,0,0,0.18)'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:"'Times New Roman',Georgia,serif"}}>
                    <thead>
                      <tr>
                        {tbl.headers.map((h,i)=>(
                          <th key={i} style={{background:colorHex,color:'#fff',padding:'8px 10px',textAlign:'center',fontWeight:700,fontSize:12,border:`1px solid ${colorHex}`,whiteSpace:'nowrap'}}>
                            {h}
                          </th>
                        ))}
                        {Array.from({length:cols-tbl.headers.length},(_,i)=>(
                          <th key={`empty-${i}`} style={{background:colorHex,border:`1px solid ${colorHex}`}}/>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tbl.dataRows.map((row,ri)=>(
                        <tr key={ri} style={{background:ri%2===1?'#f1f5f9':'#ffffff'}}>
                          {Array.from({length:cols},(_,ci)=>(
                            <td key={ci} style={{padding:'7px 10px',textAlign:'center',border:'1px solid #e2e8f0',color:'#1e293b',fontSize:12}}>
                              {row[ci]||''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            };

            let i=0;
            while (i<lines.length) {
              const line=lines[i]; const t=line.trim();
              if (!t) { elements.push(<div key={key++} style={{height:8}}/>); i++; continue; }
              // skip raw pipe rows — rendered via StyledTable
              if (t.startsWith('|')||(t.includes('|')&&t.indexOf('|')<5)) { i++; continue; }

              if (/^Table\s+4[\.\d]+/i.test(t)) {
                const tbl = ch4Tables[tblIdx];
                const col = tableColors[tblIdx%tableColors.length];
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:13,color:'#1e293b',marginTop:14,fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                if (tbl) { elements.push(<StyledTable key={key++} tbl={tbl} colorHex={col}/>); tblIdx++; }
                i++; continue;
              }
              if (/^Figure\s+4[\.\d]+/i.test(t)) {
                const tbl = ch4Tables[figIdx];
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:12,color:'#374151',textAlign:'center',marginTop:8,fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                if (tbl) { elements.push(<ChartBar key={key++} tbl={tbl}/>); figIdx++; }
                i++; continue;
              }
              if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) {
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:17,textAlign:'center',textTransform:'uppercase',color:'#1e293b',margin:'12px 0 4px',fontFamily:"'Times New Roman',serif",letterSpacing:1}}>{t}</div>);
                i++; continue;
              }
              if (t===t.toUpperCase()&&/^[A-Z][A-Z\s,&/\-]+$/.test(t)&&t.length>=4&&t.length<90&&!/^\d/.test(t)) {
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:14,textAlign:'center',color:'#1e293b',margin:'6px 0',fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                i++; continue;
              }
              if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) {
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:13,color:'#1e293b',margin:'10px 0 4px',fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                i++; continue;
              }
              if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t)||/^H[₁1][₁₂₃123][:.\s]/.test(t)) {
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:13,color:'#1e293b',margin:'6px 0',fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                i++; continue;
              }
              if (/^(Decision Rule|Inference:|Source:|Hypothesis (One|Two)|Broad Objective|Research Question (One|Two|Three))/i.test(t)) {
                elements.push(<div key={key++} style={{fontWeight:700,fontSize:13,color:'#374151',margin:'8px 0 2px',fontFamily:"'Times New Roman',serif"}}>{t}</div>);
                i++; continue;
              }
              // bold-colon lines
              if (/^[A-Z][A-Za-z\s]+:/.test(t)&&t.length<140&&t.split(':')[0].split(' ').length<=10) {
                const ci=t.indexOf(':');
                elements.push(<div key={key++} style={{fontSize:13,color:'#1e293b',margin:'4px 0',lineHeight:1.8,fontFamily:"'Times New Roman',serif"}}><strong>{t.slice(0,ci+1)}</strong>{t.slice(ci+1)}</div>);
                i++; continue;
              }
              // body paragraph
              elements.push(<p key={key++} style={{fontSize:14,color:'#1e293b',lineHeight:2,margin:'4px 0 8px',textAlign:'justify',fontFamily:"'Times New Roman',Georgia,serif"}}>{t}</p>);
              i++;
            }
            return elements;
          };

          return (
            <div style={{background:'var(--bg-card,#1a2236)',border:`2px solid ${ch.border}`,borderRadius:14,overflow:'hidden'}}>
              <div style={{background:ch.bg,borderBottom:`1px solid ${ch.border}`,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:ch.color}}>{ch.title}: {ch.subtitle}</div>
                  <div style={{fontSize:12,color:'var(--text-muted,#718096)',marginTop:2}}>{chapters[activeChapter].split(' ').length.toLocaleString()} words · {Math.ceil(chapters[activeChapter].split(' ').length/250)} min read{isCh4&&' · Tables & charts rendered'}</div>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>copyChapter(activeChapter)} style={{background:ch.color,color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontWeight:700,fontSize:13}}>📋 Copy</button>
                  <button onClick={downloadDocx} disabled={downloadingDocx} style={{background:downloadingDocx?'rgba(13,148,136,0.4)':'#0D9488',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:downloadingDocx?'not-allowed':'pointer',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
                    {downloadingDocx?<><div style={{width:11,height:11,border:'2px solid rgba(255,255,255,0.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Saving…</>:'⬇️ .docx'}
                  </button>
                  <button onClick={downloadPdf} disabled={downloadingPdf} style={{background:downloadingPdf?'rgba(220,38,38,0.4)':'#DC2626',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:downloadingPdf?'not-allowed':'pointer',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
                    {downloadingPdf?<><div style={{width:11,height:11,border:'2px solid rgba(255,255,255,0.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Saving…</>:'⬇️ .pdf'}
                  </button>
                  <button onClick={()=>generateChapter(activeChapter)} disabled={loading!==null} style={{background:'transparent',color:ch.color,border:`1.5px solid ${ch.color}`,borderRadius:8,padding:'8px 14px',cursor:'pointer',fontWeight:700,fontSize:13}}>🔄 Regenerate</button>
                </div>
              </div>
              <div style={{padding:'24px 28px',background: isCh4?'#f8fafc':'transparent'}} ref={contentRef}>
                {isCh4
                  ? <div style={{maxWidth:'100%'}}>{renderCh4(chapters[activeChapter])}</div>
                  : <textarea value={chapters[activeChapter]} onChange={e=>setChapters(prev=>({...prev,[activeChapter]:e.target.value}))}
                      style={{width:'100%',minHeight:600,background:'transparent',border:'none',outline:'none',resize:'vertical',color:'var(--text-secondary,#cbd5e0)',fontFamily:"'Times New Roman', Georgia, serif",fontSize:15,lineHeight:1.9,boxSizing:'border-box'}}/>
                }
              </div>
            </div>
          );
        })()}

        {!activeChapter&&generatedCount===0&&(
          <div style={{textAlign:'center',padding:'48px 24px',background:'var(--bg-card,#1a2236)',borderRadius:14,border:'1px solid var(--border-card,#2d3748)'}}>
            <div style={{fontSize:'3.5rem',marginBottom:16}}>{mode==='clientcare'?'🏥':'🤖'}</div>
            <h3 style={{fontFamily:'var(--font-display,serif)',fontSize:20,color:'var(--text-primary,#e2e8f0)',marginBottom:8}}>{mode==='clientcare'?'Ready to Write Care Study':'Ready to Write'}</h3>
            <p style={{color:'var(--text-muted,#718096)',fontSize:14,maxWidth:460,margin:'0 auto 24px',lineHeight:1.7}}>
              Fill in your topic and objectives, upload a format guide, then generate. Chapter 4 downloads with <strong style={{color:'#0D9488'}}>colored tables</strong> and <strong style={{color:'#0D9488'}}>bar charts</strong> in both Word and PDF.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              {activeChapters.map(ch=><div key={ch.id} style={{padding:'7px 14px',borderRadius:20,border:`1px solid ${ch.border}`,fontSize:12,fontWeight:600,color:ch.color,background:ch.bg}}>{ch.title}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
