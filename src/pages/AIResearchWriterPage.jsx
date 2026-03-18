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

// ── NACON FORMAT SPECIFICATION ───────────────────────────────────────────────
// Extracted from AGUDA_CHAPTER_1-3.docx and DOC-20260317-WA0000
// Nigerian Army College of Nursing (NACON) / 68 NARH standard format
const NACON_FORMAT_SPEC = `
=============================================================
NACON RESEARCH FORMAT — STRICTLY ENFORCED (Do NOT deviate)
Nigerian Army College of Nursing, Yaba-Lagos
=============================================================

TYPOGRAPHY & LAYOUT RULES (match exactly):
- Font: Times New Roman throughout ALL sections
- Body text font size: 12pt (size: 24 in docx half-points)
- Chapter title font size: 14pt bold, UPPERCASE, centered
- Chapter subtitle font size: 12pt bold, UPPERCASE, centered
- Subheading font size: 12pt bold (e.g. 1.1, 2.3, 3.4)
- Line spacing: Double spacing throughout body text
- Paragraph indent: First line 0.5 inch (720 DXA)
- Margins: 1 inch top/right/bottom, 1.5 inch left (for binding)
- Page numbers: Bottom center, starting from Chapter One
- References: Hanging indent 0.5 inch, APA 7th edition format

=============================================================
CHAPTER ONE — INTRODUCTION
=============================================================
Heading: CHAPTER ONE (centered, bold, 14pt)
Subheading: INTRODUCTION (centered, bold, 12pt)

Required sections IN THIS ORDER with exact numbering:
1.1 Background to the Study
    - Minimum 4 paragraphs
    - Flow: Global → Continental (Africa) → National (Nigeria) → Local (State/City/Facility)
    - Each level supported by APA 7th ed. citations (2021–2025)
    - Final paragraph: state purpose of THIS study

1.2 Statement of Problem
    - 2–3 paragraphs
    - Identify the specific research gap clearly
    - Must reference statistics with citations
    - End with a statement of what the study aims to address

1.3 Objectives of the Study
    Broad Objective:
    - One sentence stating the overall aim
    Specific Objectives:
    - Numbered list, minimum 3 specific objectives
    - Each begins with an action verb (Assess, Determine, Identify, Examine, Evaluate)
    - Mirror the research questions exactly

1.4 Research Questions
    - One question per specific objective
    - Numbered, matching objectives order
    - Begin with "What is/are..." or "What factors..."

1.5 Research Hypotheses
    - At least 2 null hypotheses (H₀₁, H₀₂)
    - Format: "H₀₁: There is no significant relationship between [variable A] and [variable B]..."
    - Each hypothesis testable by Chi-square or similar

1.6 Significance of the Study
    - Minimum 3 paragraphs addressing:
      * Significance to the nursing profession
      * Significance to healthcare providers / other professionals
      * Significance to society / public health / policymakers

1.7 Scope of the Study (Delimitation)
    - 1–2 paragraphs
    - State what is included and excluded from the study
    - Specify the facility, population, time period

1.8 Operational Definition of Terms
    - Define 6–8 key terms used in the study
    - Format: Bold term followed by colon, then definition in context of THIS study
    - Example: "Anaemia: A condition characterized by... as understood by pregnant women attending... at [facility]."

=============================================================
CHAPTER TWO — LITERATURE REVIEW
=============================================================
Heading: CHAPTER TWO (centered, bold, 14pt)
Subheading: LITERATURE REVIEW (centered, bold, 12pt)

Required sections IN THIS ORDER:

2.1 Conceptual Review
    - 1 introductory paragraph defining the main concept
    - Subsections for EACH major variable in the study:
      2.1.1 [First Variable/Concept] — define and discuss in depth
      2.1.2 [Second Variable/Concept] — define and discuss
      2.1.3 [Third Variable/Concept if applicable]
    - Under each subsection: use thematic sub-sub-headings (no numbers, just bold text)
    - Each conceptual section: minimum 3 paragraphs with citations

2.2 Theoretical Framework
    2.2.1 [Name of Theory] ([Proponent], [Year])
    - Include "Figure X: Diagrammatic Illustration of [Theory Name] ([Proponent], [Year])"
    - Explain the theory: its origin, key constructs, and why it applies to this study
    - List ALL constructs of the theory in bold subheadings with explanation
    - Minimum 8–10 constructs explained

    2.2.2 Application of [Theory Name] to the Study
    - Apply EACH construct from 2.2.1 directly to the research topic
    - Use the same construct names as bold subheadings
    - "Fig X Application of [Theory] to the Study — Source: Research Fieldwork [Year]"

2.3 Empirical Review
    - Organized by each research objective:
      2.3.1 [Objective 1 topic] — Review studies at 3 levels:
            Global studies → African studies → Nigerian studies
            Each study: Author(s), year, design, sample, setting, findings, limitations
      2.3.2 [Objective 2 topic] — same Global → Africa → Nigeria structure
      2.3.3 [Objective 3 topic] — same structure
    - Each sub-section ends with a concluding paragraph on gaps in literature

=============================================================
CHAPTER THREE — RESEARCH METHODOLOGY
=============================================================
Heading: CHAPTER THREE (centered, bold, 14pt)
Subheading: RESEARCH METHODOLOGY (centered, bold, 12pt)

Required sections IN THIS ORDER:

3.1 Research Design
    - State design (e.g., "descriptive survey design")
    - Justify why this design is appropriate for the study

3.2 Research Setting
    - Describe the facility in detail: name, location, type, services offered
    - Explain why this facility was chosen

3.3 Target Population
    - Describe who makes up the study population
    - State known or estimated population size (N)

3.4 Sample Size and Sampling Technique
    MUST include Taro Yamane formula:
    n = N / [1 + N(e)²]
    Where: n = sample size, N = population size, e = margin of error (0.05)
    - Show full calculation step by step
    - Add 10% attrition allowance
    - Describe stratified random sampling technique
    - Explain strata (e.g., by trimester, ward, cadre)

3.5 Instrument for Data Collection
    - State: "A structured, self-administered questionnaire"
    - List ALL sections:
      Section A: Demographic Information (list items)
      Section B: [First variable] (describe format: Yes/No or Likert)
      Section C: [Second variable] (describe format)
      Section D: [Third variable/Factors] (describe format)
    - State scoring: "4-point Likert scale: Strongly Agree (4), Agree (3), Disagree (2), Strongly Disagree (1)"
      OR "Yes/No items scored 1 and 0 respectively"

3.6 Validity of the Instrument
    - State face and content validity procedures
    - Mention submission to supervisor and expert reviewers
    - Note corrections incorporated

3.7 Reliability of the Instrument
    - Pilot study: 15 participants (≈10% of sample) at a similar facility NOT in main study
    - Cronbach's Alpha: state coefficient (e.g., α = 0.84 or higher)
    - State threshold: "A Cronbach's Alpha value of 0.70 or above was considered acceptable"
    - State outcome: "All items were retained"

3.8 Method of Data Collection
    Include these sub-points (not numbered, just flow):
    - Ethical Approval procedure
    - Recruitment and Consent process
    - Questionnaire Administration details
    - Data Collection Period (e.g., four weeks)
    - Quality Control measures
    - Research Assistants (number, training)

3.9 Method of Data Analysis
    Data Preparation sub-section:
    - Questionnaires numbered serially
    - Responses coded numerically
    - Data cleaning procedure
    - Entry into SPSS version 25.0

    Descriptive Statistics:
    - Frequencies, percentages, means, standard deviations
    - Used for: demographics, knowledge, practices, factors

    Inferential Statistics:
    - Chi-square test for association between categorical variables
    - Decision rule stated explicitly

    Data Presentation:
    - Tables, charts, and graphs

3.10 Ethical Considerations
    Cover ALL of these (as separate paragraphs):
    - Ethical Approval (from hospital ethics committee)
    - Informed Consent (written, voluntary)
    - Confidentiality and Anonymity (codes not names)
    - Voluntary Participation (right to withdraw)
    - Respect and Dignity
    - Beneficence and Non-maleficence
    - Data Management (stored 5 years)
    - Dissemination (no individual identifiable)

REFERENCES (end of Chapter Three or as separate section):
- Full APA 7th edition reference list
- All sources cited in chapters 1–3
- Format: Author, A. A., & Author, B. B. (Year). Title in sentence case. Journal in Italics, Volume(Issue), page–page. https://doi.org/xxxxx
- Sources: 2021–2025 (except foundational theories)
- Arrange alphabetically by first author surname

=============================================================
CHAPTER FOUR — ANALYSIS AND PRESENTATION OF DATA
=============================================================
Heading: CHAPTER FOUR (centered, bold, 14pt)
Subheading: ANALYSIS AND PRESENTATION OF DATA (centered, bold, 12pt)

Opening paragraph:
- State total respondents recruited and response rate
- State analysis tools used (frequency counts, percentages, mean, chi-square)

4.2 Demographic Characteristics of Respondents
    - "Table 4.2.1: Socio-Demographic Characteristics of Respondents"
    - "Source: Research field work, [Year]" (below every table)
    - Include: age group, sex, education level, marital status, occupation, parity/experience
    - "Figure 4.1: Bar Chart Showing Age Distribution of Respondents." (after table)
    - "Figure 4.3: Bar Chart Showing Qualification Level of Respondents" (if applicable)
    - Interpret table in paragraph: describe dominant groups and percentages

4.3 Answering of Research Questions
    One sub-section per research question:
    Research Question One: [state the question]
    - "Table 4.3.1: [Table Title]"
    - "Source: Research field work, [Year]"
    - "Figure 4.4: Bar Chart Showing [Variable] (N = [n])"
    - Interpret: discuss percentages, note key findings, connect to objective

    Research Question Two: [state the question]
    - Table 4.3.2, Figure 4.5, interpretation paragraph

    Research Question Three: [state the question]
    - Table 4.3.3, Figure 4.6, interpretation paragraph

    (Continue for each research question)

4.4 Hypothesis Testing
    Decision Rule: "If the P-value is less than 0.05, the null hypothesis (H₀) is rejected..."
    
    Research Hypothesis 1:
    - State H₀₁ fully
    - Describe Chi-square procedure and which items were used
    - "Table 4.4.1: Cross-Tabulation for Hypothesis 1 — [Variable A] vs. [Variable B]"
    - "Source: Research field work, [Year]"
    - State: χ² value, critical value (3.841 at df=1), P-value, decision
    - "Inference: The Chi-Square value (χ² = X.XX) exceeds the critical value (3.841 at df = 1), and the P-value (0.00X) is less than 0.05. Therefore, the null hypothesis (H₀₁) is rejected."

    Research Hypothesis 2:
    - Same structure as Hypothesis 1
    - Table 4.4.2

=============================================================
CHAPTER FIVE — DISCUSSION OF RESULTS
=============================================================
Heading: CHAPTER FIVE (centered, bold, 14pt)
Subheading: DISCUSSION OF RESULTS (centered, bold, 12pt)

5.1 Discussion of Findings
    Opening paragraph:
    - Restate study aim, sample size, and design

    Socio-Demographic Characteristics paragraph:
    - Describe dominant demographic groups and what they mean for the study context

    One discussion paragraph per Research Question/Objective:
    Findings on [Research Question 1 Topic]:
    - State what was found (percentages/statistics from Ch. 4)
    - Compare with similar studies (Global → African → Nigerian, 2021–2025)
    - Use pattern: "These findings align with [Author et al., Year]..."
    - OR: "These findings contrast with [Author et al., Year] who found that..."
    - Add analytical commentary on what the finding means for practice

    Findings on [Research Question 2 Topic]: same structure
    Findings on [Research Question 3 Topic]: same structure

5.2 Implications of the Study to Nursing
    Minimum 5 sub-sections with bold headings:
    - Strengthening Nursing Education and In-Service Training
    - Development of Institutional Protocols and Clinical Guidelines
    - Advocacy for Resource Allocation
    - Addressing Workload and Staffing Constraints
    - Promoting Documentation and Interdisciplinary Collaboration
    Each: 2–3 paragraphs

5.3 Summary of the Study
    - 2–3 paragraphs
    - Restate: objectives, design, sample, instrument, key findings
    - Written in past tense

5.4 Conclusion
    - 2–3 paragraphs
    - Draw conclusions directly from findings
    - Do NOT introduce new information
    - Connect back to the study's significance

5.5 Recommendations
    - Numbered list, minimum 6 recommendations
    - Each recommendation: bold heading + 2–3 paragraph explanation
    - Address specific stakeholders: nursing administration, hospital management,
      nursing education, government/policymakers, professional bodies

5.6 Suggestions for Further Studies
    - 4–6 numbered suggestions
    - Each with a bold heading + 1–2 paragraph explanation
    - Suggest: longitudinal studies, observational studies, multi-center studies,
      qualitative perspectives, policy analysis research

PILOT STUDY (append after 5.6):
    Heading: PILOT STUDY (bold, centered)
    Subheading: Reliability Analysis of Structured Questionnaire
    - State: n=15, facility used, sections included
    - Show Cronbach's Alpha formula:
      α = N/(N−1) × (1 − ΣItem Variance / Total Variance)
    - "Table P.1: Pilot Study Reliability Data (n = 15)"
    - "Source: Research field work, [Year]"
    - Show substitution and calculation
    - State computed α value and interpretation
    - State: "All items were retained without modification"

=============================================================
WRITING STANDARDS
=============================================================
- Every paragraph: minimum 5 sentences
- Every citation: APA 7th edition, 2021–2025 (except foundational theories)
- Tables: Source line below every table ("Source: Research field work, [Year]")
- Figures: Figure number and title below every figure
- Hypotheses use subscript notation: H₀₁, H₀₂, H₁₁, H₁₂
- Chi-square symbol: χ²
- Do NOT use: "It is worth noting", "In conclusion it can be seen", "As previously mentioned"
- Nigerian healthcare context throughout
- Write in third person formal academic English
`;

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

  const handleGuideFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert('Guide document must be under 500KB.'); return; }
    setGuideFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setGuideDoc(reader.result || '');
    reader.readAsText(file);
  };

  // ── Build prompt with NACON format enforced ──────────────────
  const buildPrompt = (chapterId) => {
    const ch = activeChapters.find(c => c.id === chapterId);
    const isCC = mode === 'clientcare';

    const guideSection = guideDoc.trim()
      ? `\nGUIDE DOCUMENT (use this as additional structural/stylistic reference — but the NACON FORMAT above takes precedence):\n"""\n${guideDoc.trim().slice(0, 3000)}${guideDoc.length > 3000 ? '\n[...truncated for length]' : ''}\n"""\n`
      : '';

    const citationRules = `
CITATION RULES (STRICTLY ENFORCED):
- Use ONLY real, verifiable academic sources published from 2021 onwards
- Every in-text citation must be in APA 7th edition format: (Author, Year) or Author (Year)
- Do NOT invent or fabricate author names, journal titles, volume numbers, or article titles
- Only cite sources that genuinely exist — preferred journals include:
  * Journal of Advanced Nursing, Nurse Education Today, BMC Nursing, International Journal of Nursing Studies
  * The Lancet, BMJ, JAMA, PLOS ONE
  * African Journal of Nursing and Midwifery, West African Journal of Nursing, Nigerian Journal of Medicine
  * World Health Organization (WHO) reports, Federal Ministry of Health Nigeria reports (2021–2025)
- If uncertain whether a specific source exists, paraphrase without citing
- ALL references: APA 7th edition format:
  Author, A. A., & Author, B. B. (Year). Title of article in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx
- References dated 2021–2025 unless citing foundational nursing theories (e.g. Orem, 1991; Roy, 1984; Pender, 1982)

ANTI-PLAGIARISM RULES (TARGET: 0–5% SIMILARITY):
- NEVER copy, reproduce, or closely paraphrase any sentence from any existing published source
- Express ALL ideas entirely in your own original words and sentence structures
- When referencing a researcher's finding, describe WHAT they found using completely different sentence construction
- Vary sentence length and structure — mix short punchy sentences with longer analytical ones
- Use active AND passive voice strategically
- Avoid formulaic clichés: "It is worth noting", "In the light of the foregoing", "It is evident that", "This study therefore seeks to"
- Write naturally as a knowledgeable clinician explaining to a peer
- Each paragraph must flow organically — use transition phrases that fit the specific content
- Do NOT start multiple consecutive sentences with the same word
- Add analytical commentary after every citation — do not just string citations together
- Do NOT use AI-signature phrases: "It is important to note", "Furthermore it should be noted", "As previously mentioned", "In summary this section has"`;

    // Chapter-specific instructions referencing NACON format
    const researchInstructions = {
      ch1: `Write CHAPTER ONE: INTRODUCTION following the NACON FORMAT SPECIFICATION above EXACTLY.

You must include ALL of these sections with EXACT numbering — no skipping, no reordering:
• 1.1 Background to the Study (4+ paragraphs: Global → Africa → Nigeria → Local/facility level)
• 1.2 Statement of Problem (2–3 paragraphs identifying gap and consequences)
• 1.3 Objectives of the Study (Broad Objective + numbered Specific Objectives starting with action verbs)
• 1.4 Research Questions (one per specific objective, numbered)
• 1.5 Research Hypotheses (H₀₁, H₀₂ null hypotheses, testable format)
• 1.6 Significance of the Study (3 paragraphs: nursing profession, healthcare providers, society)
• 1.7 Scope of the Study (Delimitation) (1–2 paragraphs on what is/isn't included)
• 1.8 Operational Definition of Terms (6–8 terms defined in context of THIS study and facility)

The objectives provided are:
${objectives.trim()}

Use these to derive the exact research questions and hypotheses.`,

      ch2: `Write CHAPTER TWO: LITERATURE REVIEW following the NACON FORMAT SPECIFICATION above EXACTLY.

You must include ALL sections with EXACT numbering:
• 2.1 Conceptual Review (opening paragraph + subsections 2.1.1, 2.1.2, 2.1.3 for each major variable, each with thematic bold sub-headings)
• 2.2 Theoretical Framework:
    2.2.1 [Choose ONE appropriate nursing theory — e.g. Pender's Health Promotion Model, Orem's Self-Care Deficit Theory, or Roy's Adaptation Model — state proponent and year in heading]
    - Figure reference: "Figure 1: Diagrammatic Illustration of [Theory] ([Proponent], [Year])"
    - Explain ALL key constructs with bold subheadings (minimum 8 constructs)
    2.2.2 Application of [Theory] to the Study
    - Apply EACH construct to the research topic specifically
    - Figure reference: "Fig 2 Application of [Theory] to the Study — Source: Research Fieldwork [Year]"
• 2.3 Empirical Review:
    2.3.1 [Objective 1 topic] — Global → African → Nigerian studies
    2.3.2 [Objective 2 topic] — Global → African → Nigerian studies
    2.3.3 [Objective 3 topic] if applicable — same structure
    Each ends with a concluding paragraph on literature gaps`,

      ch3: `Write CHAPTER THREE: RESEARCH METHODOLOGY following the NACON FORMAT SPECIFICATION above EXACTLY.

You must include ALL sections with EXACT numbering:
• 3.1 Research Design (state "descriptive survey design" and justify)
• 3.2 Research Setting (describe facility: name, location, type, services, why chosen)
• 3.3 Target Population (who, estimated N)
• 3.4 Sample Size and Sampling Technique:
    - MUST show Taro Yamane formula: n = N / [1 + N(e)²]
    - Show full calculation step-by-step with N and e values
    - Add 10% attrition → final recruitment number
    - Describe stratified random sampling with named strata
• 3.5 Instrument for Data Collection (structured questionnaire, list ALL sections A–D with descriptions, state Likert scoring)
• 3.6 Validity of the Instrument (face and content validity, supervisor review)
• 3.7 Reliability of the Instrument (pilot study n=15, Cronbach's Alpha formula and value ≥ 0.70)
• 3.8 Method of Data Collection (Ethical Approval → Recruitment/Consent → Administration → Duration → Quality Control → Research Assistants)
• 3.9 Method of Data Analysis (Data Preparation → Descriptive Statistics → Inferential Statistics → Data Presentation, mention SPSS v25)
• 3.10 Ethical Considerations (cover ALL 8 ethical principles listed in NACON format)

End with full REFERENCES section in APA 7th edition, alphabetical order, 2021–2025.`,

      ch4: `Write CHAPTER FOUR: ANALYSIS AND PRESENTATION OF DATA following the NACON FORMAT SPECIFICATION above EXACTLY.

Structure:
• Opening paragraph: total respondents, response rate, analysis tools used

• 4.2 Demographic Characteristics of Respondents:
  - "Table 4.2.1: Socio-Demographic Characteristics of Respondents"
  - Below table: "Source: Research field work, [Year]"
  - Include: age groups, sex, education, marital status, occupation, and relevant clinical variable
  - "Figure 4.1: Bar Chart Showing Age Distribution of Respondents."
  - Interpretation paragraph describing dominant groups

• 4.3 Answering of Research Questions:
  One subsection per research question (use the objectives to derive questions):
  - State the research question in full
  - "Table 4.3.X: [Descriptive title]"
  - "Source: Research field work, [Year]"
  - "Figure 4.X: Bar Chart Showing [Variable] (N = [n])"
  - Interpretation paragraph: key percentages, what they mean

• 4.4 Hypothesis Testing:
  Decision Rule paragraph first: "If the P-value is less than 0.05..."
  For each hypothesis:
  - State H₀ in full
  - Describe Chi-square test conducted and items used
  - "Table 4.4.X: Cross-Tabulation for Hypothesis X — [Variable A] vs. [Variable B]"
  - "Source: Research field work, [Year]"
  - Inference statement: χ² value, critical value (3.841 at df=1), P-value, decision (reject/retain H₀)

Use plausible fictional data. Format all tables clearly in plain text with | separators.`,

      ch5: `Write CHAPTER FIVE: DISCUSSION OF RESULTS following the NACON FORMAT SPECIFICATION above EXACTLY.

Structure:
• 5.1 Discussion of Findings:
  - Opening paragraph: restate aim, sample, design
  - "Socio-Demographic Characteristics" paragraph: dominant groups and contextual meaning
  - One discussion section per research question with bold heading "Findings on [Topic]":
    * State finding (statistics from Ch. 4)
    * Compare with global studies (Author et al., Year)
    * Compare with African studies
    * Compare with Nigerian studies
    * Add analytical commentary for Nigerian/clinical context

• 5.2 Implications of the Study to Nursing:
  Minimum 5 subsections with bold headings matching NACON format:
  - Strengthening Nursing Education and In-Service Training
  - Development of Institutional Protocols and Clinical Guidelines
  - Advocacy for Resource Allocation
  - Addressing Workload and Staffing Constraints
  - Promoting Documentation and Interdisciplinary Collaboration

• 5.3 Summary of the Study (2–3 paragraphs, past tense, restate objectives/design/findings)

• 5.4 Conclusion (2–3 paragraphs, drawn strictly from findings, no new info)

• 5.5 Recommendations:
  - Numbered 1–6+, each with bold heading + 2–3 paragraph explanation
  - Address: nursing administration, hospital management, education, government

• 5.6 Suggestions for Further Studies:
  - 4–6 numbered suggestions, each with bold heading + 1–2 paragraphs
  - Include: longitudinal, observational, multi-center, qualitative, policy analysis

• PILOT STUDY section:
  - Heading: PILOT STUDY (bold)
  - Subheading: Reliability Analysis of Structured Questionnaire
  - State n=15, facility, sections covered
  - Show Cronbach's Alpha formula: α = N/(N−1) × (1 − ΣItem Variance / Total Variance)
  - Define: N = number of items, ΣItem Variance, Total Variance
  - "Table P.1: Pilot Study Reliability Data (n = 15)"
  - "Source: Research field work, [Year]"
  - Show calculation and substitution
  - State α value and interpretation
  - "All items were retained without modification"`,
    };

    const clientCareInstructions = {
      ch1: `Write CHAPTER ONE: INTRODUCTION for a Client Care Study following the NACON FORMAT SPECIFICATION where applicable.
Sections:
• 1.1 Background of the Case (4+ paragraphs: Global burden → Africa → Nigeria → facility)
• 1.2 Statement of the Problem (2–3 paragraphs: patient's presenting problems and nursing gap)
• 1.3 Purpose of the Study (1 paragraph)
• 1.4 Objectives of the Care Study (numbered, action verbs)
• 1.5 Scope of the Study (assessment through evaluation)
• 1.6 Significance of the Study (nursing practice, patient outcomes, education)
• 1.7 Limitation of the Study (1 paragraph)
• 1.8 Operational Definition of Terms (6–8 clinical/nursing terms)`,

      ch2: `Write CHAPTER TWO: LITERATURE REVIEW for a Client Care Study following the NACON FORMAT SPECIFICATION where applicable.
Sections:
• 2.1 Overview of the Condition (pathophysiology, epidemiology — Nigerian/African data, aetiology)
• 2.2 Clinical Manifestations and Assessment
• 2.3 Nursing Theories and Models (2–3 theories: proponent, year, relevance)
• 2.4 Evidence-Based Nursing Interventions (6–8 real peer-reviewed studies 2021–2025)
• 2.5 Pharmacological Management (drug classes, mechanisms, nursing considerations)
• 2.6 Multidisciplinary Team Involvement
• 2.7 Summary of Literature Review (gaps and what this study addresses)
• References (APA 7th edition, 2021–2025, alphabetical)`,

      ch3: `Write CHAPTER THREE: CLIENT ASSESSMENT AND NURSING CARE PLAN following the NACON FORMAT SPECIFICATION where applicable.
Sections:
• 3.1 Introduction
• 3.2 Client Profile / Bio-data (initials only, plausible fictional patient)
• 3.3 Chief Complaints
• 3.4 Medical History (past, family, social, drug history, allergies)
• 3.5 Physical Examination (head-to-toe: vital signs, each body system)
• 3.6 Medical Diagnosis and Investigation Results (plausible lab values with interpretation)
• 3.7 Nursing Diagnoses (5–6 NANDA-approved, prioritized by Maslow's hierarchy)
• 3.8 Nursing Care Plan (table format: Nursing Diagnosis | Goal | Expected Outcomes | Nursing Interventions | Rationale | Evaluation — with APA citations)
• 3.9 Discharge Plan (medications, diet, lifestyle, follow-up, referrals)
• 3.10 References (APA 7th edition)`,
    };

    const instructions = isCC ? clientCareInstructions : researchInstructions;
    const modeLabel = isCC ? 'Client Care Study (Case Study)' : 'Academic Research Project';
    const topicLbl  = isCC ? 'CARE STUDY TOPIC / CLIENT CONDITION' : 'RESEARCH TOPIC';
    const objLbl    = isCC ? 'CARE STUDY OBJECTIVES' : 'RESEARCH OBJECTIVES';

    return `You are a highly experienced Nigerian nursing and healthcare academic writer with 20 years of research and clinical experience at the Nigerian Army College of Nursing (NACON), Yaba, Lagos. You write entirely in your own natural, human voice — never using AI-sounding sentence patterns.

Your writing philosophy: original thought expressed clearly, evidence used to support YOUR analysis (not replace it), every sentence crafted fresh for this specific topic. A plagiarism checker must return 0–5% similarity.

You write at ${level} level for the ${department || 'Nursing Science'} department.

${NACON_FORMAT_SPEC}

Write ${ch.title.toUpperCase()}: ${ch.subtitle.toUpperCase()} for the following ${modeLabel}.

${topicLbl}: ${topic}

${objLbl}:
${objectives.trim()}

ACADEMIC LEVEL: ${level}
DEPARTMENT/FIELD: ${department || 'Nursing Science'}
TARGET LENGTH FOR THIS CHAPTER: Approximately ${chapterPages[chapterId] || '10-15'} pages (double-spaced, Times New Roman 12pt)
WRITING MODE: ${modeLabel}
${guideSection}

CHAPTER-SPECIFIC INSTRUCTIONS (follow these in addition to the NACON FORMAT above):
${instructions[chapterId]}

${citationRules}

WRITING STANDARDS:
- Write entirely in formal academic English, third person throughout
- Nigerian healthcare and educational context throughout
- Minimum 2,000–3,000 words for this chapter
- Use EXACT subheading numbers as specified (1.1, 1.2 etc. — never skip or reorder)
- Never start with preamble like "Here is your chapter" — begin DIRECTLY with: CHAPTER [NUMBER] then newline then [SUBTITLE]
- Tables: always include "Source: Research field work, [Year]" below each table
- Figures: always include "Figure X.X: [Description]" as caption
- Hypotheses: use H₀₁, H₀₂ notation (subscript numbers)
- Chi-square: use χ² symbol

HUMAN WRITING STYLE:
- Write exactly as a highly educated human Nigerian nurse/researcher
- Every sentence freshly constructed — no recycled templates
- Vary sentence openings: never start more than 2 consecutive sentences with same word
- After every citation, add brief analytical remark about meaning for Nigerian context
- Use natural connectives: "This pattern suggests...", "What emerges from these findings is...", "A closer look reveals..."
- Write background like a storyteller building context — not a list of facts
- Do NOT use: "It is important to note", "Furthermore it should be noted", "In conclusion it can be seen", "As previously mentioned"

Begin now with:
CHAPTER ${ch.id === 'ch1' ? 'ONE' : ch.id === 'ch2' ? 'TWO' : ch.id === 'ch3' ? 'THREE' : ch.id === 'ch4' ? 'FOUR' : 'FIVE'}
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
          max_tokens: 8000,
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
            max_tokens: 8000,
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

  const toastMsg = (msg, bg = '#0D9488') => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  const copyChapter = (id) => { navigator.clipboard.writeText(chapters[id] || ''); toastMsg('📋 Chapter copied!'); };
  const copyAll = () => {
    const all = activeChapters.map(c => chapters[c.id] || '').filter(Boolean).join('\n\n\n');
    navigator.clipboard.writeText(all);
    toastMsg('📋 Full document copied!', '#1E3A8A');
  };
  const downloadTxt = () => {
    const all = activeChapters.map(c => chapters[c.id] || '').filter(Boolean).join('\n\n\n');
    if (!all) return;
    const blob = new Blob([all], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${topic.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim()}_${mode}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Download as .docx — NACON format ─────────────────────────
  // Times New Roman 12pt, double spaced, 0.5" first-line indent,
  // 1.5" left margin, 1" others, page numbers bottom center
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
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, PageNumber, NumberFormat, Footer,
        WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat,
      } = window.docx;

      // ── NACON formatting constants ───────────────────────────
      const TNR = 'Times New Roman';
      const BODY_SIZE = 24;        // 12pt in half-points
      const HEADING_SIZE = 28;     // 14pt
      const SUB_SIZE = 24;         // 12pt bold
      const LINE_SPACING = 480;    // double spacing (240 = single)
      const FIRST_INDENT = 720;    // 0.5 inch first-line indent
      const HANGING = 720;         // 0.5 inch hanging indent for references
      const PARA_AFTER = 0;        // no extra space after paragraphs (pure double spacing)
      const PARA_BEFORE = 0;

      // Page: A4, 1.5" left (binding), 1" top/right/bottom
      // 1440 DXA = 1 inch
      const PAGE_WIDTH = 11906;    // A4
      const PAGE_HEIGHT = 16838;
      const MARGIN_LEFT = 2160;    // 1.5 inch
      const MARGIN_OTHER = 1440;   // 1 inch

      // Content width for tables: 11906 - 2160 - 1440 = 8306 DXA
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_OTHER;

      const borderCell = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
      const cellBorders = { top: borderCell, bottom: borderCell, left: borderCell, right: borderCell };

      // ── Paragraph builders ───────────────────────────────────

      // Body paragraph: TNR 12pt, double spaced, 0.5" first-line indent, justified
      const bodyPara = (text, opts = {}) => new Paragraph({
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: opts.bold || false })],
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { line: LINE_SPACING, before: PARA_BEFORE, after: PARA_AFTER },
        indent: opts.noIndent ? {} : opts.hanging ? { left: HANGING, hanging: HANGING } : { firstLine: FIRST_INDENT },
      });

      // Chapter title: CHAPTER ONE — 14pt bold centered, no indent
      const chapterTitle = (text) => new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: HEADING_SIZE, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE_SPACING, before: 480, after: 240 },
        indent: {},
      });

      // Chapter subtitle: INTRODUCTION — 12pt bold centered
      const chapterSubtitle = (text) => new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: SUB_SIZE, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE_SPACING, before: 0, after: 480 },
        indent: {},
      });

      // Numbered subheading: 1.1 Background to the Study — 12pt bold, left aligned, no indent
      const subheading = (text) => new Paragraph({
        children: [new TextRun({ text, font: TNR, size: SUB_SIZE, bold: true })],
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE_SPACING, before: 480, after: 120 },
        indent: {},
      });

      // Bold label (non-numbered subheading like "Broad Objective:")
      const boldLabel = (text) => new Paragraph({
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })],
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE_SPACING, before: 240, after: 0 },
        indent: {},
      });

      // Source line below tables/figures — italic, 12pt
      const sourceLine = (text) => new Paragraph({
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE, italics: true })],
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE_SPACING, before: 60, after: 240 },
        indent: {},
      });

      // Reference entry — hanging indent
      const refEntry = (text) => new Paragraph({
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_SPACING, before: 0, after: 120 },
        indent: { left: HANGING, hanging: HANGING },
      });

      // Empty line
      const emptyLine = () => new Paragraph({
        children: [new TextRun({ text: '', font: TNR, size: BODY_SIZE })],
        spacing: { line: LINE_SPACING, before: 0, after: 0 },
      });

      // Page break
      const pageBreak = () => new Paragraph({
        children: [new TextRun({ text: '', break: 1 })],
        pageBreakBefore: true,
        spacing: { before: 0, after: 0 },
      });

      // ── Smart text → docx paragraphs converter ───────────────
      const textToParas = (rawText) => {
        const lines = rawText.split('\n');
        const paras = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();
          i++;

          if (!trimmed) {
            // skip excessive blanks — double spacing handles spacing
            continue;
          }

          // Chapter title: CHAPTER ONE / TWO / THREE / FOUR / FIVE
          if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(trimmed)) {
            paras.push(chapterTitle(trimmed));
            continue;
          }

          // Chapter subtitle (short ALL CAPS line after chapter title)
          const subtitlePhrases = [
            'INTRODUCTION', 'LITERATURE REVIEW', 'RESEARCH METHODOLOGY',
            'ANALYSIS AND PRESENTATION OF DATA', 'DATA PRESENTATION',
            'DISCUSSION OF RESULTS', 'SUMMARY', 'CLIENT ASSESSMENT',
            'NURSING CARE PLAN', 'REFERENCES', 'PILOT STUDY',
          ];
          const isSubtitle = subtitlePhrases.some(p => trimmed.toUpperCase().startsWith(p))
            && trimmed === trimmed.toUpperCase()
            && trimmed.length < 80
            && !/^\d/.test(trimmed);
          if (isSubtitle) {
            paras.push(chapterSubtitle(trimmed));
            continue;
          }

          // Numbered subheading: 1.1, 2.3.1, 3.10, 4.4, 5.2 etc.
          if (/^\d+\.\d+[\d.]*\s+\S/.test(trimmed)) {
            paras.push(subheading(trimmed));
            continue;
          }

          // Bold label lines (e.g. "Broad Objective:", "Specific Objectives:", "Decision Rule:")
          if (/^(Broad Objective|Specific Objectives|Decision Rule|Research Hypothesis \d|H₀\d|H[₀₁₂₃][\d₀-₉]|PILOT STUDY|Reliability Analysis|Data Preparation|Descriptive Statistics|Inferential Statistics|Data Presentation)/i.test(trimmed)) {
            paras.push(boldLabel(trimmed));
            continue;
          }

          // Numbered list item (1. To assess... or i. ...)
          if (/^(\d+\.|[a-z]\.|[ivxlc]+\.)[\s]/.test(trimmed) && trimmed.length < 300) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: TNR, size: BODY_SIZE })],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_SPACING, before: 0, after: 0 },
              indent: { left: 720, hanging: 360 },
            }));
            continue;
          }

          // Hypothesis line (H₀₁:, H₀₂:)
          if (/^H[₀₁₂₃O][\d₀-₉]*[\s:]/.test(trimmed)) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: TNR, size: BODY_SIZE })],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_SPACING, before: 120, after: 0 },
              indent: { firstLine: FIRST_INDENT },
            }));
            continue;
          }

          // Table row (contains |)
          if (trimmed.startsWith('|') && trimmed.includes('|')) {
            // Build a simple bordered table row as a paragraph (monospace-style)
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: 'Courier New', size: 18 })],
              spacing: { line: 240, before: 0, after: 0 },
              indent: {},
            }));
            continue;
          }

          // Source / Figure / Table caption lines
          if (/^(Source:|Figure \d|Fig \d|Table \d)/i.test(trimmed)) {
            paras.push(sourceLine(trimmed));
            continue;
          }

          // Reference entry — starts with Author surname, capital letter, then comma
          if (/^[A-Z][a-záéíóú\-]+,\s[A-Z]\./.test(trimmed) || /^[A-Z][a-z]+,\s[A-Z][a-z]*\./.test(trimmed)) {
            paras.push(refEntry(trimmed));
            continue;
          }

          // Formula lines (n = or α =)
          if (/^[nNαχ²]\s*=/.test(trimmed) || /^Where:/.test(trimmed) || /^Calculation:/.test(trimmed)) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: 'Courier New', size: BODY_SIZE })],
              alignment: AlignmentType.LEFT,
              spacing: { line: LINE_SPACING, before: 60, after: 60 },
              indent: { left: FIRST_INDENT },
            }));
            continue;
          }

          // Inference / Interpretation lines
          if (/^(Inference:|Interpretation:|Thus,|Therefore,|Note:)/i.test(trimmed)) {
            paras.push(new Paragraph({
              children: [new TextRun({ text: trimmed, font: TNR, size: BODY_SIZE, italics: true })],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_SPACING, before: 120, after: 0 },
              indent: { firstLine: FIRST_INDENT },
            }));
            continue;
          }

          // Default: body paragraph
          paras.push(bodyPara(trimmed));
        }

        return paras;
      };

      // ── Title page ───────────────────────────────────────────
      const titlePageParas = [
        emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: (topic || 'Research Project').toUpperCase(), font: TNR, size: HEADING_SIZE, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 0, after: 720 },
          indent: {},
        }),
        new Paragraph({
          children: [new TextRun({ text: 'BY', font: TNR, size: BODY_SIZE, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 0, after: 480 },
          indent: {},
        }),
        emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: 'PRESENTED TO', font: TNR, size: BODY_SIZE })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 480, after: 120 },
          indent: {},
        }),
        new Paragraph({
          children: [new TextRun({ text: `DEPARTMENT OF ${(department || 'NURSING').toUpperCase()}`, font: TNR, size: BODY_SIZE, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 0, after: 120 },
          indent: {},
        }),
        new Paragraph({
          children: [new TextRun({ text: 'NIGERIAN ARMY COLLEGE OF NURSING, YABA-LAGOS', font: TNR, size: BODY_SIZE, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 0, after: 480 },
          indent: {},
        }),
        emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: new Date().toLocaleString('en-NG', { month: 'long', year: 'numeric' }).toUpperCase(), font: TNR, size: BODY_SIZE })],
          alignment: AlignmentType.CENTER,
          spacing: { line: LINE_SPACING, before: 480, after: 0 },
          indent: {},
        }),
      ];

      // ── Build all chapter paragraphs ─────────────────────────
      const allParas = [...titlePageParas, pageBreak()];

      for (const ch of activeChapters) {
        if (chapters[ch.id]) {
          allParas.push(...textToParas(chapters[ch.id]));
          allParas.push(pageBreak());
        }
      }

      // ── Build document ───────────────────────────────────────
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: TNR, size: BODY_SIZE },
            },
          },
          paragraphStyles: [
            {
              id: 'Normal', name: 'Normal', quickFormat: true,
              run: { font: TNR, size: BODY_SIZE },
              paragraph: {
                spacing: { line: LINE_SPACING, before: PARA_BEFORE, after: PARA_AFTER },
                alignment: AlignmentType.JUSTIFIED,
              },
            },
            {
              id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { font: TNR, size: HEADING_SIZE, bold: true, color: '000000' },
              paragraph: {
                spacing: { line: LINE_SPACING, before: 480, after: 240 },
                alignment: AlignmentType.CENTER,
                outlineLevel: 0,
              },
            },
            {
              id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { font: TNR, size: SUB_SIZE, bold: true, color: '000000' },
              paragraph: {
                spacing: { line: LINE_SPACING, before: 480, after: 120 },
                outlineLevel: 1,
              },
            },
          ],
        },
        sections: [{
          properties: {
            page: {
              size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
              margin: {
                top: MARGIN_OTHER,
                right: MARGIN_OTHER,
                bottom: MARGIN_OTHER,
                left: MARGIN_LEFT,    // 1.5 inch left for binding
              },
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
            },
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: BODY_SIZE }),
                ],
                spacing: { before: 0, after: 0 },
              })],
            }),
          },
          children: allParas,
        }],
      });

      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(topic || 'document').slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, '').trim()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toastMsg('✅ Downloaded as .docx (NACON format)!', '#16A34A');

    } catch (e) {
      console.error(e);
      toastMsg('❌ DOCX failed — downloading .txt instead', '#DC2626');
      downloadTxt();
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
                NACON format · Times New Roman 12pt · Double spaced · APA 7th ed. (2021–2025)
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
                  : 'e.g. Knowledge and Prevention of Anaemia Among Pregnant Women Attending Antenatal Clinic at 68 Nigerian Army Reference Hospital, Yaba, Lagos'}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              <div style={{ fontSize: 11, color: topic.length >= 10 ? '#16A34A' : 'var(--text-muted,#718096)', marginTop: 4 }}>
                {topic.length >= 10 ? '✅ Good' : `${topic.length}/10 min`}
              </div>
            </div>

            <div>
              <label style={lbl}>{mode === 'clientcare' ? 'Care Study Objectives *' : 'Research Objectives *'}</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={5}
                placeholder={mode === 'clientcare'
                  ? '1. To assess the health status and care needs of the client\n2. To identify nursing diagnoses using NANDA taxonomy\n3. To plan and implement evidence-based nursing interventions\n4. To evaluate effectiveness of nursing care provided'
                  : '1. To assess the level of knowledge on anaemia among pregnant women attending antenatal clinic\n2. To assess the prevention practices regarding anaemia among pregnant women\n3. To identify factors influencing the knowledge and prevention practices'}
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
                ℹ️ The NACON format is already built-in. Upload a guide only if you want the AI to also match a specific writing style or additional structural detail.
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
                placeholder="Paste an existing research project here. The AI will follow its writing style in addition to the built-in NACON format."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
            </div>
          )}
        </div>

        {/* ── Format Badge ── */}
        <div style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
          <div style={{ fontSize: 12, color: 'rgba(22,163,74,0.9)', lineHeight: 1.6 }}>
            <strong>NACON Format Enforced:</strong> Times New Roman 12pt · Double spaced · 0.5" first-line indent · 1.5" left margin (binding) · Page numbers bottom center · APA 7th ed. citations (2021–2025) · Taro Yamane sampling · Cronbach's Alpha reliability · Chi-square hypothesis testing
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
                      : '⬇️ Download .docx (NACON Format)'}
                  </button>
                  <button onClick={downloadTxt}
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
              {mode === 'clientcare' ? 'Ready to Write Care Study' : 'NACON Format Ready'}
            </h3>
            <p style={{ color: 'var(--text-muted,#718096)', fontSize: 14, maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.7 }}>
              {mode === 'clientcare'
                ? <>Fill in the client condition and objectives, then generate. Output follows <strong style={{color:'#7C3AED'}}>NACON nursing format</strong>.</>
                : <>Fill in your research topic and objectives, then generate. All chapters strictly follow <strong style={{color:'#0D9488'}}>NACON format</strong> — Times New Roman 12pt, double-spaced, APA 7th edition, Taro Yamane sampling, Cronbach's Alpha reliability, Chi-square hypothesis testing.</>}
            </p>
            {/* Format summary chips */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              {['TNR 12pt','Double Spaced','1.5" Left Margin','APA 7th Ed.','Taro Yamane','Chi-Square'].map(tag => (
                <span key={tag} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(13,148,136,0.4)', fontSize: 11, fontWeight: 600, color: '#0D9488', background: 'rgba(13,148,136,0.08)' }}>{tag}</span>
              ))}
            </div>
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
