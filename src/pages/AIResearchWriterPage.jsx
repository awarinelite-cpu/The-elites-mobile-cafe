// src/pages/AIResearchWriterPage.jsx
import { useState, useRef, useEffect } from 'react';

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
  const [mode, setMode] = useState(() => sessionStorage.getItem('aiw_mode') || 'research');
  const [guideDoc, setGuideDoc] = useState(() => sessionStorage.getItem('aiw_guide') || '');
  const [guideFileName, setGuideFileName] = useState(() => sessionStorage.getItem('aiw_guidename') || '');
  const [showGuide, setShowGuide] = useState(false);
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
    sessionStorage.setItem('aiw_chapters', JSON.stringify(chapters));
    sessionStorage.setItem('aiw_activechapter', activeChapter || '');
    sessionStorage.setItem('aiw_guide', guideDoc);
    sessionStorage.setItem('aiw_guidename', guideFileName);
  }, [topic, objectives, level, department, citationStyle, chapterPages, mode, chapters, activeChapter, guideDoc, guideFileName]);

  const activeChapters = mode === 'clientcare' ? CLIENT_CARE_CHAPTERS : RESEARCH_CHAPTERS;
  const totalChapters  = activeChapters.length;
  const canGenerate    = topic.trim().length >= 10 && objectives.trim().length >= 20;
  const generatedCount = activeChapters.filter(c => chapters[c.id]).length;

  // ── Read uploaded guide file ─────────────────────────────────
  const handleGuideFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5000000) { alert('Guide document must be under 5MB.'); return; }
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
      ? `
MANDATORY FORMAT GUIDE (HIGHEST PRIORITY — STRICTLY ENFORCED):
You MUST follow the structure, headings, subheadings, writing style, paragraph length, table format, and all formatting conventions shown in this guide document EXACTLY. This guide overrides all other formatting instructions below. Do NOT skip any section shown in the guide. Do NOT add sections not in the guide. Do NOT produce half-complete work — every section must be fully written out to the same depth and length as the guide.

GUIDE DOCUMENT:
"""
${guideDoc.trim().slice(0, 15000)}${guideDoc.length > 15000 ? '\n[...guide continues — maintain same pattern throughout]' : ''}
"""
`
      : '';

    const citationRules = `
CITATION & REFERENCE RULES (STRICTLY ENFORCED — NO EXCEPTIONS):

IN-TEXT CITATIONS:
- EVERY paragraph must contain at least ONE in-text citation
- EVERY factual statement, statistic, finding, or claim MUST have an in-text citation immediately after it
- Format: (Author, Year) or Author (Year) — ${citationStyle} 7th edition strictly
- Do NOT write any sentence presenting a fact, figure, or finding without a citation
- Minimum 3–5 citations per page of content
- Use ONLY real, verifiable academic sources published 2021–2025
- Preferred journals: Journal of Advanced Nursing, Nurse Education Today, BMC Nursing, International Journal of Nursing Studies, Nursing Open, The Lancet, BMJ, JAMA, PLOS ONE, New England Journal of Medicine, African Journal of Nursing and Midwifery, West African Journal of Nursing, Nigerian Journal of Medicine, WHO reports, Federal Ministry of Health Nigeria reports
- If uncertain whether a source exists, paraphrase without citing rather than fabricating
- Foundational nursing theories (Orem, Roy, etc.) may use original publication year

REFERENCES SECTION:
- Do NOT add a reference list at the end of Chapter 1, 2, 3, or 4
- ALL references for the entire work must appear ONLY at the end of Chapter 5
- The references section must be titled: REFERENCES (bold, centered, no section number)
- List ALL sources cited across all five chapters in one combined alphabetical list
- Minimum 25–30 unique reference entries
- Format every entry in ${citationStyle} 7th edition:
  Author, A. A., & Author, B. B. (Year). Title of article in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx
- Only 2021–2025 sources except foundational theories

ANTI-PLAGIARISM RULES (TARGET: 0–5% SIMILARITY):
- NEVER copy or closely paraphrase any published sentence
- Express ALL ideas entirely in your own original words
- Vary sentence length, structure, and openings throughout
- Use active AND passive voice strategically
- Avoid clichés: "It is worth noting", "In the light of the foregoing", "It is evident that"
- Add your own analytical commentary after every citation
- Do NOT string citations together without analysis between them`;
    
    Find the `researchInstructions` object in `buildPrompt` and replace the entire thing with this:

```js
const researchInstructions = {
      ch1: `Write CHAPTER ONE: INTRODUCTION. Follow this EXACT format — no deviations:

CHAPTER ONE
INTRODUCTION

1.1 Background of the Study
Write FIVE full paragraphs in this exact flow:
- Paragraph 1 — GLOBAL: Define the main concept with a landmark statistic. Cite WHO or major global body. Mention global prevalence, mortality burden, and recommendations. End with the global gap. (6–8 sentences, multiple in-text citations)
- Paragraph 2 — GLOBAL (continued): Discuss high-income country implementation. Cite 2–3 specific countries with statistics, policies, and challenges. (6–8 sentences, in-text citations)
- Paragraph 3 — AFRICA: Shift to sub-Saharan Africa. Cite 3–4 African country studies each with Author (Year) + specific finding + barrier. (6–8 sentences, in-text citations)
- Paragraph 4 — NIGERIA: Focus on Nigeria. State national figures. Cite 2–3 Nigerian studies with specific percentages and findings. (6–8 sentences, in-text citations)
- Paragraph 5 — LOCAL/THIS STUDY: Narrow to the specific facility. State why this setting matters. End with: "This study therefore seeks to assess [topic] among [population] in [facility]." (4–6 sentences)
EVERY sentence with a fact or statistic MUST have an in-text citation.

1.2 Statement of Problem
Write FIVE paragraphs each with in-text citations:
- Paragraph 1: Global recognition of the problem. Cite WHO with specific statistic not being met. State national gap explicitly. (4–6 sentences)
- Paragraph 2: Consequences in Nigeria — mortality, morbidity, SDG implications. Name specific SDG goal and target. (4–6 sentences)
- Paragraph 3: Cite a specific Nigerian study (Author et al., Year) with exact percentages showing knowledge or practice gap. (3–5 sentences)
- Paragraph 4: Cite a second study confirming the gap persists with specific barrier identified. (3–5 sentences)
- Paragraph 5: Begin "Therefore, this study aims to assess [topic] among [population] at [facility]. The findings will provide evidence for [list 3–4 specific uses]." (3–4 sentences)

1.3 Objectives of the Study

Broad Objective
To [assess/determine/evaluate] the [topic] among [population] in [facility/setting].

Specific Objectives
- To [action verb] the level of [variable 1] among [population] in [facility].
- To [action verb] the level of [variable 2] among [population] in [facility].
- To identify the factors influencing [variable 1 and variable 2] among [population] in [facility].
(Use bullet points — NOT numbered list)

1.4 Research Questions
- What is the level of [variable 1] among [population] in [facility]?
- What is the level of [variable 2] among [population] in [facility]?
- What are the factors influencing [variable 1 and variable 2] among [population] in [facility]?
(Use bullet points — NOT numbered list)

1.5 Research Hypotheses
H₀₁: There is no relationship between [variable 1] and [variable 2] among [population] in [facility].
H₀₂: There is no relationship between socio-demographic factors and [variable 2] among [population] in [facility].
(Bold H₀₁ and H₀₂ labels, no bullets)

1.6 Significance of the Study
Write FOUR paragraphs — NO sub-headings, every paragraph must have in-text citations:
- Paragraph 1: Significance to nursing profession — knowledge gaps, evidence-based care, nursing roles. Cite 1–2 sources.
- Paragraph 2: Significance to healthcare providers — clinical practice, health system planning, standardized protocols. Cite 1–2 sources.
- Paragraph 3: Significance to society — public health, neonatal/patient mortality, SDG alignment. Cite 1–2 sources.
- Paragraph 4: Significance to literature — contribution to scholarship, reference for future research, policy evidence. Cite 1 source.

1.7 Scope of the Study
Write THREE paragraphs — NO sub-headings:
- Paragraph 1: What the study focuses on — topic, population, facility, study period.
- Paragraph 2: What is confined to — specific dimensions. State clearly what is NOT included.
- Paragraph 3: Setting restriction — restricted to this facility type only. State what findings will reflect.

1.8 Operational Definition of Terms
Define SIX terms. Format each as:
[Bold Term]: [Definition specifically in the context of this study, population, and facility — not a generic dictionary definition.]`,

      ch2: `Write CHAPTER TWO: LITERATURE REVIEW. Follow this EXACT format:

CHAPTER TWO
LITERATURE REVIEW

EVERY paragraph in this chapter MUST contain at least one in-text citation. No paragraph should be without a citation.

2.1 Conceptual Review
Opening paragraph (2–3 sentences with citations): Introduce the main concept. State its significance for the study population. Mention challenges in resource-limited settings.

2.1.1 [Variable 1 — Knowledge of/on Topic]
Write 3–4 paragraphs defining the concept, its history, how it is done, and its components. Each paragraph must have 1–2 in-text citations.

Then write BOLD UNNUMBERED sub-sections each with 1–2 cited paragraphs:
Principles of [Topic]
Types of [Topic]
Components of [Topic]
Benefits of [Topic]
[Topic] Practice: The Role of [Population]
Knowledge Gaps Among [Population]

2.1.2 [Variable 2 — Practices/Preventive Measures]
Opening paragraph with citation. Then BOLD UNNUMBERED sub-sections for each KEY PRACTICE, each with 2 cited paragraphs:
- Paragraph 1: Describe the practice with citation
- Paragraph 2: Cite a specific study supporting the practice

Include sub-sections:
[Practice 1], [Practice 2], [Practice 3], [Practice 4], [Practice 5], [Practice 6]

2.1.3 Factors Influencing [Population]'s Knowledge and Practice of [Topic]
Opening paragraph with citations. Then BOLD UNNUMBERED sub-sections each with EXACTLY 2 paragraphs:
- Paragraph 1: General discussion of the factor with citation
- Paragraph 2: "A [Year] study by [Author et al.] found that…" — specific study, design, sample, finding, implication

Sub-sections (all six required):
Socioeconomic Factors
Educational Factors and Health Literacy
Cultural and Social Influences
Psychological Factors
Healthcare System and Access to Care
Environmental and Facility-Related Factors

2.2 Theoretical Review

2.2.1 [Theory Name] ([Developer], [Year])
Figure 1: Diagrammatic Illustration of [Theory Name]
Source: Researchgate

Opening paragraph (3–4 sentences with citations): When developed, by whom, purpose. State this study is anchored in this theory.
List each construct as BOLD LABEL followed by 1 cited paragraph applying it to this study's population and topic.
Final paragraph: "The [Theory] is therefore suitable for exploring…"

2.2.2 Application of [Theory Name] to the Study
Restate each construct as BOLD HEADING with 1–2 paragraphs applying it to this study. Be concrete — name the facility and population.
End with: Figure 2: Application of [Theory Name] to [Topic] among [Population] / Source: Research Fieldwork [Year]

2.3 Empirical Review

2.3.1 [Variable 1 — Knowledge]
Opening paragraph with citations.
Globally: 4 studies, each as a paragraph — Author (Year), study design, sample, finding with percentage, implication.
In Africa: 3 studies same structure. End with intervention study mention.
In Nigeria: 2–3 studies same structure.
Closing paragraph: summarise gaps, contributing factors, promising strategies.

2.3.2 [Variable 2 — Practice]
Same structure as 2.3.1 — Globally → Africa → Nigeria → Closing paragraph.

2.3.3 Factors Influencing [Variable 1 and Variable 2]
Same structure — Globally → Sub-Saharan Africa → Nigeria → Closing paragraph.
Final paragraph: "Overall, the literature underscores that [variable 1] and [variable 2] are deeply intertwined with multiple intersecting factors…"

NOTE: Do NOT add a reference list at the end of this chapter. All references appear at the end of Chapter 5 only.`,

      ch3: `Write CHAPTER THREE: METHODOLOGY. Follow this EXACT format:

CHAPTER THREE
METHODOLOGY

Every paragraph must contain at least one in-text citation where relevant.

3.1 Research Design
1 paragraph: "This study will use a descriptive quantitative survey design…" Define and justify with citations.

3.2 Research Setting
1–2 paragraphs: Full facility name, location (state, LGA), governing body, why chosen. Cite if possible.

3.3 Target Population
1 paragraph: Describe the population and what brings them to the facility. State total accessible population N. Cite source if population figure is from a record.

3.4 Sample Size Determination
"The sample size will be determined using Slovin's formula:"
n = N / 1 + N(e)²
Where: n = sample size, N = population size = [N], e = margin of error = 0.05
n = [N] / 1 + [N](0.0025) = [result]
"Thus, [result] [population] will be selected as the study sample."

3.5 Sampling Technique
1 paragraph: "A stratified random sampling technique will be used…" Justify with citation. List the strata.

3.6 Instrument for Data Collection
"A structured, non-standardized self-administered questionnaire will be used. It will consist of four sections:"
Section A: Demographic Information (list 5 items)
Section B: [Variable 1 — Knowledge] (Yes/No questions)
Section C: [Variable 2 — Practices] (4-point Likert: Strongly Agree=4, Agree=3, Disagree=2, Strongly Disagree=1)
Section D: Factors influencing [variable 1 and variable 2] (4-point Likert scale)

3.7 Validity of Instrument
1 paragraph: face and content validity, submitted to supervisor, scrutinized for alignment with objectives. Cite 1 source on validity.

3.8 Reliability of Instrument
1 paragraph: pilot study involving 10–15 participants at similar facility; Cronbach's Alpha; coefficient ≥ 0.70. Cite 1 source on reliability.

3.9 Method of Data Collection
1–2 paragraphs flowing prose: ethical approval → official letter → distribution during clinic visits → informed consent → researcher on-site → immediate collection. Cite ethical guidelines.

3.10 Method of Data Analysis
"Data will be cleaned, coded, and analyzed using SPSS version 25.0:"
Descriptive Statistics: frequencies, percentages, means, standard deviations.
Inferential Statistics: Chi-square tests, significance level p < 0.05. Cite 1 source.

3.11 Ethical Considerations
1–2 paragraphs: ethical approval obtained; participants informed; confidentiality assured; right to withdraw; no identifiers collected; data used solely for academic purposes. Cite relevant ethical guidelines.

NOTE: Do NOT add a reference list at the end of this chapter. All references appear at the end of Chapter 5 only.`,

      ch4: `Write CHAPTER FOUR: RESULTS. Follow this EXACT format:

CHAPTER FOUR
RESULTS

4.1 Presentation of Results

Opening paragraph (NO section number before this heading):
"A total of [N] respondents were recruited and all completed the questionnaires, resulting in a 100% response rate. This chapter presents the demographic characteristics, results of the research questions, and hypothesis testing."

4.1.1 Demographic Characteristics of Respondents
Table 4.1: Socio-Demographic Characteristics of Respondents
Source: Research field work [Year]

[ASCII table: Variable | Category | Frequency | Percentage — include Age groups, Sex, Marital Status, Education Level, Occupation, and 1–2 topic-specific variables. Frequencies must sum to N.]

Narrative paragraph: Describe age distribution first (dominant group n,%), then sex, education, marital status. End with: "This demographic profile provides a robust foundation for analyzing [variable 1 and variable 2] among [population] in [facility]."

Figure 4.1: Bar Chart Showing Age Distribution of Respondents
Figure 4.2: Bar Chart Showing Education Level of Respondents

4.1.2 [Variable 1 — Knowledge]
Research Question One: [State exactly as in Chapter 1]
Table 4.2: [Knowledge of Topic Among Population]
Source: Research field work [Year]

[ASCII table: Item | Yes n(%) | No n(%) — 6–8 knowledge items, realistic frequencies summing to N, most 75–95% Yes]

Narrative: "The data from Table 4.2 indicates a generally [high/moderate/low] level of [variable 1]…" Describe 3–4 key findings with n and %.
Figure 4.3: Bar Chart Showing [Variable 1] Among [Population]

4.1.3 [Variable 2 — Practices]
Research Question Two: [State exactly as in Chapter 1]
Table 4.3: [Practices Adopted by Population]
Source: Research field work [Year]

[ASCII table: Item | Always n(%) | Often n(%) | Sometimes n(%) | Never n(%) — 6–8 items]

Narrative: Describe dominant practice and 3–4 key findings with n and %.
Figure 4.4: Bar Chart Showing [Variable 2] Among [Population]

4.1.4 Factors Influencing [Variable 1 and Variable 2]
Research Question Three: [State exactly as in Chapter 1]
Table 4.4: Factors Influencing [Variable 1 and Variable 2]
Source: Research field work [Year]

[ASCII table: Item | Strongly Agree n(%) | Agree n(%) | Disagree n(%) | Strongly Disagree n(%) — 6–8 items]

Narrative: Name top factors with percentages. End with analytical remark.
Figure 4.5: Bar Chart Showing Factors Influencing [Variable 1 and Variable 2]

4.2 Hypotheses Testing

Decision Rule: If P-value < 0.05, reject H₀ and accept H₁; otherwise accept H₀.

Hypothesis One
H₀₁: [State exactly as in Chapter 1]
H₁₁: [State the alternative — "There is a significant relationship between…"]

Chi-Square Test of Independence conducted. [State the two items used from tables above]. [State N].

Table 4.5: Cross-Tabulation for Hypothesis One
Source: Research field work [Year]
[2×2 cross-tabulation table with cell frequencies, row totals, column totals — make chi-square significant]

Inference: χ²([df]) = [value], p = [value] < 0.05. The null hypothesis is rejected. There is a statistically significant relationship between [variable 1] and [variable 2].

Hypothesis Two
H₀₂: [State exactly as in Chapter 1]
H₁₂: [State the alternative]

Chi-Square Test of Independence conducted. [State items used]. [State N].

Table 4.6: Cross-Tabulation for Hypothesis Two
Source: Research field work [Year]
[2×2 cross-tabulation — make chi-square significant]

Inference: χ²([df]) = [value], p = [value] < 0.05. The null hypothesis is rejected.

4.3 Answering of Research Questions

Research Question One: [Restate] — Answered: [1–2 sentence summary of finding from Table 4.2]
Research Question Two: [Restate] — Answered: [1–2 sentence summary of finding from Table 4.3]
Research Question Three: [Restate] — Answered: [1–2 sentence summary of finding from Table 4.4]

NOTE: Do NOT add a reference list at the end of this chapter. All references appear at the end of Chapter 5 only.`,

      ch5: `Write CHAPTER FIVE: DISCUSSION OF FINDINGS. Follow this EXACT format:

CHAPTER FIVE
DISCUSSION OF FINDINGS

EVERY paragraph in this chapter MUST contain at least one in-text citation when discussing findings.

5.1 Identification of Key Findings

Opening paragraph (no sub-heading): "This study aimed to [restate aim]. A total of [N] [population] participated." State what this chapter discusses. (3–4 sentences)

Socio-Demographic Characteristics [bold, NO section number]
1–2 paragraphs: Describe dominant demographics with n and %. State what this profile means for interpreting findings. Cite 1 source.

Findings on [Variable 1] [bold, NO section number]
4 paragraphs each with in-text citations:
- Para 1: "The analysis revealed [high/moderate/low] level of [variable 1], with [X%]…" State 2–3 findings with percentages from Chapter 4.
- Para 2: Compare with global/high-income country study — "[Author et al., Year] found that [finding] in [country]…"
- Para 3: Compare with African study — "[Author et al., Year] in [African country] reported…"
- Para 4: Compare with Nigerian study — "[Author et al., Year] in [Nigerian city] found…" Add analytical remark for Nigerian context.

Findings on [Variable 2] [bold, NO section number]
Same 4-paragraph structure with in-text citations.

Findings on Factors Influencing [Variable 1 and Variable 2] [bold, NO section number]
Same 4-paragraph structure with in-text citations.

5.2 Implications to Nursing
Write 6–8 BOLD sub-headings, NO section numbers, 2–4 cited sentences each:
Enhancing [Population] Education through Nursing Interventions
Addressing Cultural and Religious Influences
Strengthening Referral Systems and Interdisciplinary Collaboration
Advocating for Policy Changes and Resource Allocation
Building Community and Family Support Systems
Enhancing Nursing Education and Training
Promoting Preventive and Holistic Care
Addressing Socioeconomic Disparities

5.3 Limitations of the Study
1–2 paragraphs: State the limitations honestly — sample confined to one facility, self-report bias, cross-sectional design cannot establish causality, etc. Cite 1 source on limitations of survey research.

5.4 Summary [bold, NO section number]
1 paragraph: "This study assessed [topic] among [N] [population] in [facility]." State dominant demographics, key findings for variable 1 (with %), variable 2 (with %), and hypothesis outcomes (both H₀₁ and H₀₂ with χ² values and p-values).

5.5 Conclusion [bold, NO section number]
1–2 paragraphs: Draw conclusions from findings with specific percentages. Acknowledge gaps. End with forward-looking statement. Cite 1–2 sources.

5.6 Recommendations [bold, NO section number]
6–8 items. Each formatted EXACTLY as:
[Bold recommendation title]: [1–2 sentence explanation with specific strategy and cited study.]

5.7 Suggestions for Further Studies [bold, NO section number]
6 items. Each formatted EXACTLY as:
[Bold title]: [1–2 sentence description of what to study, where, and what outcomes to measure.]

REFERENCES [bold, centered, NO section number]
THIS IS THE ONLY PLACE REFERENCES APPEAR IN THE ENTIRE RESEARCH WORK.
Include ALL sources cited across Chapters 1, 2, 3, 4, and 5 combined.
Alphabetical by first author surname.
Minimum 25–30 unique entries.
2021–2025 only except foundational theories.
Format: Author, A. A., & Author, B. B. (Year). Title in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx`,
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

2.1 Conceptual Review — overview of the condition: pathophysiology, epidemiology (Nigerian/African data), aetiology and risk factors
2.2 Clinical Manifestations and Assessment — signs, symptoms, diagnostic criteria
2.3 Theoretical Framework — 2.3.1: discuss 2–3 nursing theories (state proponent and year); 2.3.2: Application to the study
2.4 Empirical Review — review 6–8 real studies (2021–2025); Global → Africa → Nigeria pattern
2.5 Pharmacological Management — drug classes, mechanisms, nursing considerations
2.6 Multidisciplinary Team Involvement — roles of physicians, physiotherapists, dieticians, social workers
REFERENCES — full APA 7th edition list`,

      ch3: `Write a comprehensive CHAPTER THREE: CLIENT ASSESSMENT AND NURSING CARE PLAN. Include ALL sections:

3.1 Client Profile / Bio-data — fictional patient (initials only): age, sex, occupation, religion, tribe, marital status, ward, admission date, reason
3.2 Chief Complaints — presenting complaints on admission
3.3 Medical History — past medical/surgical, family, social, drug history, allergies
3.4 Physical Examination — head-to-toe: vital signs, general appearance, all body systems
3.5 Medical Diagnosis and Investigation Results — plausible lab values with interpretation
3.6 Nursing Diagnoses — 5–6 NANDA-approved diagnoses, prioritized by Maslow's hierarchy
3.7 Nursing Care Plan — for each diagnosis: Nursing Diagnosis | Goal | Expected Outcomes | Nursing Interventions | Rationale | Evaluation
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
WRITING MODE: ${modeLabel}

${guideSection}

TARGET LENGTH FOR THIS CHAPTER: Approximately ${chapterPages[chapterId] || '10-15'} pages

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
- Do NOT produce half-complete work — every section must be fully written to the same depth shown in the format guide

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
      setError('VITE_ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables and redeploy.');
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
  const copyAll = () => {
    const all = activeChapters.map(c => chapters[c.id] || '').filter(Boolean).join('\n\n\n');
    navigator.clipboard.writeText(all);
    toast('📋 Full document copied!', '#1E3A8A');
  };

  // ── Download as .docx — pure raw OOXML + JSZip ───────────────
  const downloadDocx = async () => {
    const hasContent = activeChapters.some(c => chapters[c.id]);
    if (!hasContent) { toast('⚠️ No chapters generated yet', '#D97706'); return; }
    setDownloadingDocx(true);

    try {
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Could not load JSZip. Check internet connection.'));
          document.head.appendChild(s);
        });
      }

      const esc = (t) => String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const mkRun = (text, bold = false) =>
        `<w:r><w:rPr>` +
        `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
        `<w:sz w:val="24"/><w:szCs w:val="24"/>` +
        (bold ? `<w:b/><w:bCs/>` : ``) +
        `</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

      const mkP = (runsXML, center = false, hanging = false, listIndent = false, pageBreakBefore = false) => {
        const jc  = center ? `<w:jc w:val="center"/>` : `<w:jc w:val="both"/>`;
        const ind = hanging ? `<w:ind w:left="720" w:hanging="720"/>` : listIndent ? `<w:ind w:left="720"/>` : ``;
        const pb  = pageBreakBefore ? `<w:pageBreakBefore/>` : ``;
        return `<w:p><w:pPr>` +
          `<w:spacing w:line="480" w:lineRule="auto" w:before="0" w:after="0"/>` +
          `${jc}${ind}${pb}` +
          `</w:pPr>${runsXML}</w:p>`;
      };

      const blank    = ()     => mkP(mkRun(''));
      const centerB  = (t)    => mkP(mkRun(t, true), true);
      const justB    = (t)    => mkP(mkRun(t, true), false);
      const justN    = (t)    => mkP(mkRun(t, false), false);
      const refLine  = (t)    => mkP(mkRun(t, false), false, true);
      const listLine = (t)    => mkP(mkRun(t, false), false, false, true);
      const monoLine = (t)    =>
        `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr>` +
        `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>` +
        `<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
        `<w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
      const newPage  = ()     => mkP(mkRun(''), true, false, false, true);

      const boldColon = (text) => {
        const ci = text.indexOf(':');
        if (ci < 0) return justN(text);
        return mkP(mkRun(text.slice(0, ci + 1), true) + mkRun(text.slice(ci + 1), false), false);
      };

      const inlineBold = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        const runs  = parts.map(p =>
          p.startsWith('**') && p.endsWith('**') ? mkRun(p.slice(2, -2), true) : mkRun(p, false)
        ).join('');
        return mkP(runs, false);
      };

      const classify = (line) => {
        const t = line.trim();
        if (!t) return 'blank';
        if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) return 'chapter-title';
        if (t === t.toUpperCase() && /^[A-Z][A-Z\s,&/\-]+$/.test(t) && t.length >= 4 && t.length < 90 && !/^\d/.test(t)) return 'chapter-subtitle';
        if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) return 'subheading';
        if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t) || /^H[₁1][₁₂₃123][:.\s]/.test(t)) return 'hypothesis';
        if (/^(Broad Objective|Specific Objectives|Broad Aim|Specific Aims|Decision Rule|Inference:|Source:|REFERENCES|Research (Question|Hypothesis)\s+\d+|Summary of the Study|Conclusion|Recommendations|Suggestions for Further Studies)/i.test(t)) return 'bold-label';
        if (/^[A-Z][A-Za-z\s]+:/.test(t) && t.length < 140 && !/^(http|https|doi|www)/i.test(t) && !/^\d/.test(t) && t.split(':')[0].split(' ').length <= 10) return 'bold-colon';
        if (/^[A-Z][a-z]+,\s[A-Z][\.\s]/.test(t)) return 'reference';
        if (/^(\d+\.|[ivxlIVXL]+\.|[a-z]\))\s/.test(t)) return 'list-item';
        if (t.startsWith('|') || (t.includes('|') && t.indexOf('|') < 5)) return 'table-row';
        if (t.includes('**')) return 'inline-bold';
        return 'body';
      };

      const textToXML = (rawText) => {
        const lines = rawText.split('\n');
        let out = '', prev = null, tableBuf = [];

        const flushTable = () => {
          if (!tableBuf.length) return;
          tableBuf.forEach(r => { out += monoLine(r); });
          out += blank();
          tableBuf = [];
        };

        for (const line of lines) {
          const type = classify(line);
          const t    = line.trim();

          if (type === 'table-row') { tableBuf.push(t); prev = type; continue; }
          if (tableBuf.length) flushTable();

          if (type === 'blank') {
            if (prev !== 'blank' && prev !== null) out += blank();
            prev = 'blank';
            continue;
          }

          if ((type === 'subheading' || type === 'chapter-title' || type === 'bold-label') &&
              prev !== null && prev !== 'blank' && prev !== 'chapter-title' && prev !== 'chapter-subtitle')
            out += blank();

          switch (type) {
            case 'chapter-title':    out += centerB(t.toUpperCase()); break;
            case 'chapter-subtitle': out += centerB(t.toUpperCase()); break;
            case 'subheading':       out += justB(t);      break;
            case 'bold-label':       out += justB(t);      break;
            case 'hypothesis':       out += justB(t);      break;
            case 'bold-colon':       out += boldColon(t);  break;
            case 'reference':        out += refLine(t);    break;
            case 'list-item':        out += listLine(t);   break;
            case 'inline-bold':      out += inlineBold(t); break;
            default:                 out += justN(t);      break;
          }
          prev = type;
        }
        flushTable();
        return out;
      };
const [downloadingPdf, setDownloadingPdf] = useState(false);
      const downloadPdf = async () => {
  const hasContent = activeChapters.some(c => chapters[c.id]);
  if (!hasContent) { toast('⚠️ No chapters generated yet', '#D97706'); return; }
  setDownloadingPdf(true);

  try {
    // Load jsPDF from CDN
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Could not load jsPDF.'));
        document.head.appendChild(s);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW    = doc.internal.pageSize.getWidth();
    const pageH    = doc.internal.pageSize.getHeight();
    const marginL  = 25;
    const marginR  = 20;
    const marginT  = 25;
    const marginB  = 20;
    const usableW  = pageW - marginL - marginR;
    let y          = marginT;
    let pageNum    = 1;

    const addPageNumber = () => {
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.text(String(pageNum), pageW / 2, pageH - 10, { align: 'center' });
    };

    const checkNewPage = (needed = 10) => {
      if (y + needed > pageH - marginB) {
        addPageNumber();
        doc.addPage();
        pageNum++;
        y = marginT;
      }
    };

    const writeLine = (text, bold = false, center = false, fontSize = 12, indent = 0) => {
      doc.setFontSize(fontSize);
      doc.setFont('times', bold ? 'bold' : 'normal');
      const x     = center ? pageW / 2 : marginL + indent;
      const align = center ? 'center' : 'left';
      const maxW  = usableW - indent;
      const lines = doc.splitTextToSize(text, maxW);
      lines.forEach(line => {
        checkNewPage(8);
        doc.text(line, x, y, { align });
        y += 8;
      });
    };

    const writePara = (text) => {
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      const lines = doc.splitTextToSize(text, usableW);
      lines.forEach(line => {
        checkNewPage(8);
        doc.text(line, marginL, y);
        y += 8;
      });
      y += 4;
    };

    // ── Title page ──
    y = pageH / 2 - 40;
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    const titleLines = doc.splitTextToSize((topic || 'RESEARCH PROJECT').toUpperCase(), usableW);
    titleLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 10; });
    y += 6;
    doc.setFontSize(12);
    doc.text('BY', pageW / 2, y, { align: 'center' }); y += 10;
    doc.setFont('times', 'normal');
    doc.text('___________________________', pageW / 2, y, { align: 'center' }); y += 10;
    doc.text('PRESENTED TO', pageW / 2, y, { align: 'center' }); y += 8;
    doc.text(`DEPARTMENT OF ${(department || 'NURSING SCIENCE').toUpperCase()}`, pageW / 2, y, { align: 'center' }); y += 8;
    doc.text('NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS', pageW / 2, y, { align: 'center' }); y += 12;
    const monthYear = `${new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}, ${new Date().getFullYear()}`;
    doc.text(monthYear, pageW / 2, y, { align: 'center' });

    // ── Chapters ──
    for (const ch of activeChapters) {
      if (!chapters[ch.id]) continue;
      addPageNumber();
      doc.addPage();
      pageNum++;
      y = marginT;

      const lines = chapters[ch.id].split('\n');
      for (const line of lines) {
        const t = line.trim();
        if (!t) { y += 4; continue; }

        if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) {
          checkNewPage(14);
          writeLine(t.toUpperCase(), true, true, 14);
          y += 2;
        } else if (t === t.toUpperCase() && /^[A-Z][A-Z\s,&/\-]+$/.test(t) && t.length >= 4 && t.length < 90 && !/^\d/.test(t)) {
          writeLine(t.toUpperCase(), true, true, 13);
          y += 2;
        } else if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) {
          y += 2; checkNewPage(12);
          writeLine(t, true, false, 12);
          y += 2;
        } else if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t) || /^H[₁1][₁₂₃123][:.\s]/.test(t)) {
          writeLine(t, true, false, 12);
        } else if (/^(REFERENCES|Summary of the Study|Conclusion|Recommendations|Suggestions for Further Studies|Socio-Demographic|Findings on|Implications|Limitations)/i.test(t)) {
          y += 2; checkNewPage(12);
          writeLine(t, true, false, 12);
          y += 2;
        } else if (t.startsWith('|') || (t.includes('|') && t.indexOf('|') < 5)) {
          doc.setFontSize(9);
          doc.setFont('courier', 'normal');
          const tlines = doc.splitTextToSize(t, usableW);
          tlines.forEach(l => { checkNewPage(6); doc.text(l, marginL, y); y += 6; });
        } else if (/^[A-Z][A-Za-z\s]+:/.test(t) && t.length < 140 && t.split(':')[0].split(' ').length <= 10) {
          const ci = t.indexOf(':');
          checkNewPage(8);
          doc.setFontSize(12);
          doc.setFont('times', 'bold');
          const boldPart  = t.slice(0, ci + 1);
          const normalPart = t.slice(ci + 1);
          const bW = doc.getTextWidth(boldPart);
          doc.text(boldPart, marginL, y);
          doc.setFont('times', 'normal');
          const rest = doc.splitTextToSize(normalPart, usableW - bW - 2);
          doc.text(rest[0] || '', marginL + bW + 1, y);
          y += 8;
          if (rest.length > 1) {
            rest.slice(1).forEach(l => { checkNewPage(8); doc.text(l, marginL, y); y += 8; });
          }
        } else {
          writePara(t);
        }
      }
    }

    addPageNumber();

    const fileName = `${(topic || 'Research').slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim()}.pdf`;
    doc.save(fileName);
    toast('✅ PDF downloaded!', '#16A34A');

  } catch (err) {
    console.error('PDF error:', err);
    toast(`❌ PDF failed: ${err.message}`, '#DC2626');
  }
  setDownloadingPdf(false);
};
      const monthYear = `${new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}, ${new Date().getFullYear()}.`;
      const titleXML  = [
        blank(), blank(), blank(), blank(),
        centerB((topic || 'RESEARCH PROJECT').toUpperCase()),
        blank(),
        centerB('BY'),
        blank(),
        mkP(mkRun('___________________________'), true),
        blank(),
        centerB('PRESENTED TO'),
        centerB(`DEPARTMENT OF ${(department || 'NURSING SCIENCE').toUpperCase()}`),
        centerB('NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS'),
        blank(), blank(),
        centerB(monthYear),
      ].join('');

      let bodyXML = titleXML;
      for (const ch of activeChapters) {
        if (!chapters[ch.id]) continue;
        bodyXML += newPage();
        bodyXML += textToXML(chapters[ch.id]);
      }

      const sectProps =
        `<w:sectPr>` +
        `<w:footerReference w:type="default" r:id="rId3"/>` +
        `<w:pgSz w:w="11906" w:h="16838"/>` +
        `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:footer="720" w:header="0" w:gutter="0"/>` +
        `<w:pgNumType w:fmt="decimal" w:start="1"/>` +
        `</w:sectPr>`;

      const documentXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<w:body>${bodyXML}${sectProps}</w:body></w:document>`;

      const footerXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
        `<w:p><w:pPr><w:jc w:val="center"/>` +
        `<w:spacing w:before="0" w:after="0"/></w:pPr>` +
        `<w:fldSimple w:instr=" PAGE ">` +
        `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>` +
        `<w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r>` +
        `</w:fldSimple></w:p></w:ftr>`;

      const contentTypes =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
        `<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>` +
        `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` +
        `</Types>`;

      const relsXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`;

      const wordRelsXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>` +
        `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>` +
        `</Relationships>`;

      const stylesXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
        `<w:docDefaults>` +
        `<w:rPrDefault><w:rPr>` +
        `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
        `<w:sz w:val="24"/><w:szCs w:val="24"/>` +
        `</w:rPr></w:rPrDefault>` +
        `<w:pPrDefault><w:pPr>` +
        `<w:spacing w:line="480" w:lineRule="auto" w:before="0" w:after="0"/>` +
        `<w:jc w:val="both"/>` +
        `</w:pPr></w:pPrDefault>` +
        `</w:docDefaults></w:styles>`;

      const settingsXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
        `<w:defaultTabStop w:val="720"/>` +
        `</w:settings>`;

      const zip = new window.JSZip();
      zip.file('[Content_Types].xml', contentTypes);
      zip.file('_rels/.rels', relsXML);
      zip.file('word/_rels/document.xml.rels', wordRelsXML);
      zip.file('word/document.xml', documentXML);
      zip.file('word/styles.xml', stylesXML);
      zip.file('word/settings.xml', settingsXML);
      zip.file('word/footer1.xml', footerXML);

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      const fileName = `${(topic || 'Research').slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim()}.docx`;
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('✅ Word document downloaded!', '#16A34A');

    } catch (err) {
      console.error('DOCX error:', err);
      toast(`❌ Download failed: ${err.message}`, '#DC2626');
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
                    : 'Paste or upload a sample study for the AI to use as a strict format guide'}
                </div>
              </div>
            </div>
            <span style={{ color: accentColor, fontSize: 18, transition: 'transform 0.2s', transform: showGuide ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {showGuide && (
            <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border,#2d3748)' }}>
              <div style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 14px', margin: '14px 0', fontSize: 13, color: '#60A5FA' }}>
                ℹ️ Upload or paste an existing {mode === 'clientcare' ? 'care/case study' : 'research project'}. The AI will treat it as the <strong>mandatory format authority</strong> — strictly following its structure, headings, paragraph style, and depth.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accentColor, color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                  📎 Upload File
                  <input type="file" accept=".txt,.doc,.docx,.pdf" style={{ display: 'none' }} onChange={handleGuideFile} />
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted,#718096)' }}>.txt files recommended · max 5MB</span>
                {guideDoc.trim() && (
                  <button onClick={() => { setGuideDoc(''); setGuideFileName(''); }}
                    style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✕ Clear
                  </button>
                )}
              </div>
              <label style={lbl}>Or paste document text directly</label>
              <textarea value={guideDoc} onChange={e => { setGuideDoc(e.target.value); setGuideFileName(''); }} rows={8}
                placeholder={`Paste an existing ${mode === 'clientcare' ? 'care study / case study' : 'research project'} here. The AI will strictly follow its format.`}
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
            <strong>Word Format (NACON Standard):</strong> Downloaded .docx uses <strong>Times New Roman 12pt · Double spacing · Justified text · A4 page · 1.5" left binding margin</strong>. Chapter titles centered and bold. Subheadings bold. References hanging indent. Page numbers bottom centre.
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
  <button onClick={copyAll}
    style={{ background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
    📋 Copy All
  </button>
  <button onClick={downloadDocx} disabled={downloadingDocx}
    style={{ background: downloadingDocx ? 'rgba(13,148,136,0.5)' : '#0D9488', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: downloadingDocx ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
    {downloadingDocx
      ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Building…</>
      : `⬇️ Word (.docx)`}
  </button>
  <button onClick={downloadPdf} disabled={downloadingPdf}
    style={{ background: downloadingPdf ? 'rgba(220,38,38,0.5)' : '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: downloadingPdf ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
    {downloadingPdf
      ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Building…</>
      : `⬇️ PDF`}
  </button>
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
  {downloadingDocx ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Saving…</> : '⬇️ .docx'}
</button>
<button onClick={downloadPdf} disabled={downloadingPdf}
  style={{ background: downloadingPdf ? 'rgba(220,38,38,0.4)' : '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: downloadingPdf ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
  {downloadingPdf ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Saving…</> : '⬇️ .pdf'}
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
                ? <>Fill in the client condition and care objectives above, then click <strong style={{ color: '#7C3AED' }}>Generate All {totalChapters} Care Study Chapters</strong>. Upload a guide document to enforce strict formatting.</>
                : <>Fill in your research topic and objectives above, then click <strong style={{ color: '#0D9488' }}>Generate All {totalChapters} Chapters</strong>. Upload a guide document to enforce strict formatting.</>}
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
