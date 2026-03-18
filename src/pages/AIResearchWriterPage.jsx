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
      ch1: `Write CHAPTER ONE: INTRODUCTION. Follow this EXACT GAMZO format — no deviations whatsoever:

CHAPTER ONE
INTRODUCTION

1.1 Background to the Study
Write FIVE full paragraphs in this exact flow:
- Paragraph 1 — GLOBAL: Define the main concept/condition with a landmark statistic. Cite WHO or major global body. Mention global prevalence, mortality burden, and WHO recommendations. End with the global gap or challenge. (6–8 sentences, multiple APA citations)
- Paragraph 2 — GLOBAL (continued): Discuss high-income country implementation/progress. Cite 2–3 specific countries (USA, UK, Sweden or equivalent) with statistics, policies, and remaining challenges. (6–8 sentences)
- Paragraph 3 — AFRICA: Shift to sub-Saharan Africa. State neonatal/disease burden. Cite 3–4 African country studies (Kenya, Ethiopia, South Africa, Ghana or relevant) each with Author (year) + specific finding + barrier identified. (6–8 sentences)
- Paragraph 4 — NIGERIA: Focus on Nigeria specifically. State national prevalence/mortality figures. Cite 2–3 Nigerian studies with specific percentages, locations, and findings. End with what remains unknown or unaddressed. (6–8 sentences)
- Paragraph 5 — LOCAL/THIS STUDY: Narrow to the specific state/city/facility. Describe the setting briefly (type of facility, population served). State WHY this setting matters. End with: "This study therefore seeks to assess [exact topic] among [population] in [facility]. The findings are expected to [state purpose and expected contribution]." (4–6 sentences)

1.2 Statement of the Problem
Write FIVE paragraphs:
- Paragraph 1: State the global recognition of the problem. Cite WHO or authoritative global source with a specific coverage target/statistic that is NOT being met. State the national gap explicitly (e.g. "fewer than X% of eligible [population] in Nigeria receive/practice [intervention]"). Cite 2 sources. (4–6 sentences)
- Paragraph 2: Describe the consequences in Nigeria — mortality, morbidity, SDG implications. Name the specific SDG goal and target. State how current rates compare to the target. (4–6 sentences)
- Paragraph 3: Cite a specific recent Nigerian or local study (Author et al., year) that found a knowledge or practice gap. State exact percentages. Explain what the gap means for outcomes. (3–5 sentences)
- Paragraph 4: Cite a second study confirming the gap persists. Mention the specific facility/region and what barrier was identified. (3–5 sentences)
- Paragraph 5 (final): Begin with "Therefore, this study aims to assess [topic] among [population] at [facility]. The findings from this study will provide evidence for [list 3–4 specific uses: education, training, policy, intervention]." (3–4 sentences)

1.3 Objectives of the Study

Broad Objective
To [assess/determine/evaluate] the [topic] among [population] in [facility/setting].

Specific Objectives
- To [action verb] the level of [variable 1] among [population] in [facility].
- To [action verb] the level of [variable 2] among [population] in [facility].
- To identify the factors influencing [variable 1 and variable 2] among [population] in [facility].
(Use bullet points — NOT numbered list — exactly as in the GAMZO format)

1.4 Research Questions
- What is the level of [variable 1] among [population] in [facility]?
- What is the level of [variable 2] among [population] in [facility]?
- What are the factors influencing [variable 1 and variable 2] among [population] in [facility]?
(Use bullet points — NOT numbered list)

1.5 Research Hypotheses
H₀₁: There is no relationship between [variable 1] and [variable 2] among [population] in [facility].
H₀₂: There is no relationship between socio-demographic factors (educational qualification) and [variable 2] among [population] in [facility].
(Use bold H₀₁ and H₀₂ labels, NO bullet points or numbering)

1.6 Significance of the Study
Write FOUR paragraphs — NO sub-headings, flowing prose:
- Paragraph 1 (Opening + Nursing Profession): Begin "This research addresses critical gaps in [topic] within [setting], with important implications for nursing, healthcare providers, and society." Then explain significance to the nursing profession — knowledge gaps identified, evidence-based care, culturally sensitive education, specific nursing roles.
- Paragraph 2 (Healthcare Providers): "For healthcare providers—including [list relevant roles]—this study provides actionable data…" Cover clinical practice, health system planning, patient-centred education, standardized protocols.
- Paragraph 3 (Society/Public Health): "From a societal perspective…" Cover public health challenge, neonatal mortality, SDG alignment, health equity, community impact.
- Paragraph 4 (Literature): "Moreover, the study enriches the existing body of literature…" Cover contribution to scholarship, reference for future research, evidence for policy and program evaluation.

1.7 Scope of the Study (Delimitation)
Write THREE paragraphs — NO sub-headings:
- Paragraph 1: State what the study focuses on (topic, population, facility, study period).
- Paragraph 2: State what the scope is confined to — specific dimensions evaluated. State clearly what is NOT included (e.g. "It does not include evaluation of [X], [Y], or [Z]").
- Paragraph 3: State the setting restriction — restricted to [specific facility type], does not extend to [other facility types]. Explain what the findings will therefore reflect.

1.8 Operational Definition of Terms
Define SIX terms. Format each as:
[Bold Term] ([abbreviation if applicable]): [Definition specifically in the context of this study and facility — not a generic dictionary definition. Must reference the population and facility.]
Example: "Knowledge: The level of understanding [population] have about [topic], including [specific dimensions — e.g. benefits, techniques, principles], as assessed among [population] at [facility]."`,

      ch2: `Write CHAPTER TWO: LITERATURE REVIEW. Follow this EXACT GAMZO format:

CHAPTER TWO
LITERATURE REVIEW

2.1 Conceptual Review
Opening paragraph (2–3 sentences): Introduce the main concept as a transformative intervention. State its significance for the study population. Mention the challenge in resource-limited settings and the role of the primary caregiver (the study population).

2.1.1 [Variable 1 — e.g. Knowledge on/of (Topic)]
- Paragraph 1: Define the concept simply and state its origin/history. Cite 1 source. (3–4 sentences)
- Paragraph 2: Describe HOW it is done — the physical process, positioning, mechanics. Cite 1–2 sources. (4–5 sentences)
- Paragraph 3: Describe the components/process in more detail. Use plain language. Cite 1 source. (3–4 sentences)

Then write the following BOLD UNNUMBERED sub-sections, each with 1–2 paragraphs:

Principles of [Topic]
[List the core principles as a flowing sentence or short paragraph. Cite 1 source.]

Types of [Topic] (if applicable)
[Bold sub-label for each type, e.g. "Continuous [Topic]:" and "Intermittent [Topic]:" — each with 2–4 sentences of description. Cite sources.]

Components of [Topic]
[List components briefly, then expand on each as a bold sub-label with 2–3 sentences. Cite sources.]

Positioning / Steps (if applicable)
[Step 1, Step 2, Step 3 format. Brief and practical. Cite 1 source.]

[1 closing paragraph]: Describe the clinical/care context — what neonatal/healthcare setting this applies to, what knowledge enables the caregiver to do, why understanding is essential. Cite 1–2 sources.

Benefits of [Topic]
[1–2 paragraphs on key benefits. Cite 2 sources. End with statement on why equipping the population with this knowledge is important.]

[Topic] Practice: The Role of [Population]
[1–2 paragraphs on what implementation requires from the population — key practices, challenges in resource-constrained settings. Cite 2 sources.]

Knowledge Gaps Among [Population]
[1–2 paragraphs on what gaps persist globally and in Nigeria specifically. Cite 2 studies with findings. End with a statement on what exacerbates these gaps.]

2.1.3 [Variable 2 — e.g. Preventive Measures / Practices Routinely [Done] by [Population] through/regarding [Topic]]
Opening paragraph (2–3 sentences): State why this is a critical responsibility for the population. Mention what this requires in terms of knowledge, commitment, and daily practice.

Then write BOLD UNNUMBERED sub-sections for each KEY PRACTICE, each with 2 paragraphs:
- Paragraph 1: Describe the practice — what it involves, why it matters, how it is done
- Paragraph 2: Cite a specific study (Author et al., year found/reported that…) supporting the practice. Add clinical implication.

Sub-sections should include (adapt to the topic):
[Practice 1 — e.g. Continuous Skin-to-Skin Contact / Supplementation Adherence]
[Practice 2 — e.g. Exclusive Breastfeeding and Nutritional Support / Dietary Modifications]
[Practice 3 — e.g. Monitoring Infant/Patient Vital Signs and Danger Signs]
[Practice 4 — e.g. Adherence to Care Plans]
[Practice 5 — e.g. Family and Healthcare Provider Support]
[Practice 6 — e.g. Collaboration with Healthcare Providers]

2.1.4 Factors Influencing [Population]'s Knowledge and [Practice/Prevention] of [Topic]
Opening paragraph (3–4 sentences): Introduce the multifaceted nature of the factors. State why understanding them is essential. Name the categories that will be discussed.

Then write BOLD UNNUMBERED sub-sections, each with EXACTLY 2 paragraphs:
- Paragraph 1: General discussion of the factor — what it is, how it relates to the topic, what it affects
- Paragraph 2: "A [year] study by [Author et al.] found that…" — cite a specific study with design, sample, finding, and implication

Sub-sections (use all six):
Socioeconomic Factors
Educational Factors and Health Literacy
Cultural and Social Influences
Psychological Factors
Healthcare System and Access to Care
Environmental and Facility-Related Factors

2.2 Theoretical Framework

2.2.1 [Theory Name] ([Original Developer], [Year])

[Draw/describe the theory diagram in text format if possible, or write:]
Figure 1: Diagrammatic Illustration of [Theory Name] ([Developer(s)], [Year])
Source: Researchgate

Opening paragraph (3–4 sentences): State when the theory was developed, by whom (full names of original developers), and its purpose. State that this study is anchored in this theory and why.

"The [Theory Name] is grounded in [number] key constructs:"

Then list each construct as a BOLD LABEL followed by 1 paragraph:
[Construct 1 Name]: [Define the construct. Apply it directly to this study's population and topic — e.g. "In the context of this study, [population]'s perception of…"]
[Construct 2 Name]: [Same structure]
(Continue for all constructs — minimum 5, maximum 8)

Final paragraph: "The [Theory] is therefore suitable for exploring how the interplay of these [beliefs/factors] affects [the practical implementation / the knowledge and practice] of [topic] among [population] in [setting]."

2.2.2 Application of [Theory Name] to the Study

Restate each construct as a BOLD HEADING, then write 1–2 paragraphs applying it specifically to this study's topic, population, and setting. Be concrete — name the facility, the population, and specific examples.

End with:
Figure 2: Application of [Theory Name] to [Topic] among [Population]
Source: Research Fieldwork [Year]

2.3 Empirical Review

2.3.1 [Variable 1 — e.g. Knowledge of [Population] on [Topic]]
Opening paragraph (3–4 sentences): State the global public health challenge. Describe the role of the primary caregiver. State that knowledge is essential but that findings show inconsistencies. Name the factors shaping knowledge levels.

Globally, [opening connector sentence about global variation]:
Write 4 global studies, each as a separate paragraph following this EXACT structure:
"[Connector word], [Author et al. (year)], in a [study design] [published in / conducted in / involving] [sample size and setting], [used method] and [found/reported/revealed] that [specific percentage or finding]. [Additional detail or contrast]. [Implication or recommendation from the study]."
Use varied connectors: "For instance,", "Similarly,", "Moreover,", "Furthermore,"

"In Africa, [opening sentence about Africa-specific burden]:"
Write 3 African studies with the same Author-design-sample-finding-implication structure.
End with: "Encouragingly, intervention-based studies have shown promise…" — mention 1–2 intervention studies.

"In Nigeria, [opening sentence about Nigeria-specific trends]:"
Write 2–3 Nigerian studies with the same structure.

Closing paragraph: Begin "In conclusion, empirical evidence highlights persistent inadequacies in [population]'s [variable] of [topic]…" — summarise the key gaps, contributing factors, and promising strategies identified across the review.

2.3.2 [Variable 2 — e.g. [Practice/Implementation] of [Topic] among [Population]]
Same structure: opening paragraph → Globally → In Africa → In Nigeria → closing paragraph.
Each section: 3–4 studies, each with Author-design-sample-finding-implication pattern.

2.3.3 Factors Influencing [Variable 1 and Variable 2] of [Topic] Among [Population]
Same structure: opening paragraph → Globally (2–3 studies) → In Sub-Saharan Africa (2–3 studies) → In Nigeria (2–3 studies) → closing paragraph.
Final paragraph: "Overall, the literature underscores that [variable 1] and [variable 2] are deeply intertwined with multiple intersecting factors including [list 6–8 factors]. Across diverse settings, [population] who are [positive profile] demonstrate higher levels of [outcomes], whereas those facing [barriers] struggle to [implement/practice] this [life-saving/evidence-based] intervention effectively. Strengthening multi-level interventions that address [individual, family, community, health system, and policy-level factors] are essential strategies for [improving outcomes]."`,

      ch3: `Write CHAPTER THREE: RESEARCH METHODOLOGY. Follow this EXACT GAMZO format:

CHAPTER THREE
RESEARCH METHODOLOGY

3.1 Research Design
1 paragraph: State "This study will use a descriptive quantitative survey design…" Define the design briefly. Justify why it suits this study's objectives (collecting quantifiable data, systematic approach, structured questionnaires, neonatal/healthcare setting).

3.2 Research Setting
1–2 paragraphs: State the full name of the facility, its location (state, LGA), the body it is under (e.g. Nigerian Army Medical Corps), and why it was chosen (high attendance of target population, accessibility, established services relevant to the study).

3.3 Target Population
1 paragraph: Describe who comprises the target population and what brings them to the facility. State: "A total of [N] [population] will be identified as the accessible population for the study."

3.4 Sample Size and Sampling Technique
Write in this EXACT order:
"The sample size will be determined using Slovin's formula for a known population:"

n = N/1 + N(e)^2

Where:
- n = sample size
- N = population size = [state N]
- e = margin of error = 0.05

n = [N]/1 + [N](0.0025) = [N]/[1+N×0.0025] = [result, round down]

"Thus, [result] [population] will be selected as the study sample. A stratified random sampling technique will be used to ensure that [population] from different units ([list strata, e.g. neonatal intensive care, postnatal wards, and outpatient]) are adequately represented. This approach will help reduce selection bias and enhance the generalizability of findings."

3.5 Instrument for Data Collection
"A structured, non-standardized self-administered questionnaire will be used for data collection. The questionnaire will be designed based on a thorough literature review and tailored to address the study's objectives. It will consist of four sections:"

Section A: Demographic Information (e.g., [list 5 demographic items relevant to the population]).
Section B: [Variable 1 — Knowledge] of [topic] among [population] (e.g., [list 3 examples of knowledge items]).
Section C: [Variable 2 — Practice/Prevention] of [topic] among [population] (e.g., [list 3 examples of practice items]).
Section D: Factors influencing [population]'s [variable 1 and variable 2] regarding [topic] (e.g., [list 3 examples of factor items]).

"Items in Section B will be formatted as Yes/No questions, while other sections will use a 4-point Likert scale: Strongly Agree (4), Agree (3), Disagree (2), and Strongly Disagree (1)."

3.6 Validity of the Instrument
1 paragraph: "To ensure face and content validity, the questionnaire will be submitted to the research supervisor for corrections and approval. Each item will be scrutinized to ensure alignment with the research objectives. Questions will be phrased in simple, clear language to ensure [population] of various educational backgrounds can understand and respond accurately."

3.7 Reliability of the Instrument
1 paragraph: "Reliability will be assessed through a pilot study involving [10–15] [population] at a similar [facility type] who will not be part of the main study. The test-retest method will be employed, and the data obtained will be analyzed using Cronbach's Alpha to determine internal consistency. The resulting coefficient is expected to be at least 0.70, indicating an acceptable level of reliability."

3.8 Method of Data Collection
1–2 paragraphs of flowing prose (NO sub-bullets or numbered list):
Cover: ethical approval from [specific ethics committee name], official letter to hospital management, questionnaire distribution during clinic visits, assistance from nurses, informed consent from each participant, researcher available on-site for clarification, immediate collection of completed forms to minimize data loss.

3.9 Method of Data Analysis
"Data will be cleaned, coded, and analyzed using Statistical Package for Social Sciences (SPSS) version 25.0. The analysis will involve:"

Descriptive Statistics: [State exactly what will be used and for what — frequencies, percentages, means, standard deviations for demographics and knowledge/practice items.]

Inferential Statistics: [State exactly — Chi-square tests for associations between categorical variables, significance level p < 0.05.]

3.10 Ethical Considerations
1–2 paragraphs of flowing prose: ethical approval obtained before data collection; participants informed about study objectives; confidentiality assured; right to decline or withdraw without consequences; no names or personal identifiers collected; all responses kept strictly confidential; used solely for academic purposes.

REFERENCES
[Full APA 7th edition reference list — all sources cited in Chapters 1, 2, and 3]
[Alphabetical by first author surname]
[Minimum 25 entries]
[2021–2025 dates only, except foundational theories cited at their original year]
[Format: Author, A. A., & Author, B. B. (Year). Title of article in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx]`,
- Section A: Demographic Information (list 5–6 items)
- Section B: [Variable 1 — Knowledge] (Yes/No questions)
- Section C: [Variable 2 — Practices] (4-point Likert: Strongly Agree=4, Agree=3, Disagree=2, Strongly Disagree=1)
- Section D: [Variable 3 — Factors Influencing] (4-point Likert scale)

3.6 Validity of the Instrument
- 1 paragraph: face and content validity, submitted to supervisor, questions scrutinized for alignment with objectives and clarity

3.7 Reliability of the Instrument
- 1 paragraph: pilot study involving 10 participants at a similar facility not in main study; test-retest or Cronbach's Alpha; resulting coefficient (e.g. r = 0.84); conclusion that instrument is reliable

3.8 Method of Data Collection
- 1–2 paragraphs (flowing prose, no sub-bullets):
  Ethical approval obtained from relevant committee → letter to hospital management → questionnaires distributed during clinic visits → participants briefed → voluntary consent obtained → completed questionnaires collected immediately → data collection period stated

3.9 Method of Data Analysis
- "Data were cleaned, coded, and analyzed using Statistical Package for Social Sciences (SPSS) version 25.0. The analysis involved:"
- Descriptive Statistics: frequencies, percentages, means, standard deviations for demographics, knowledge, practices
- Inferential Statistics: Chi-square tests for associations; significance level p < 0.05

3.10 Ethical Considerations
- 1–2 paragraphs (flowing prose): ethical approval obtained; participants informed of objectives and confidentiality; right to withdraw without consequences; no names/identifiers collected; data used solely for academic purposes`,

      ch4: `Write CHAPTER FOUR: ANALYSIS AND PRESENTATION OF DATA. Follow this EXACT GAMZO format:

CHAPTER FOUR
ANALYSIS AND PRESENTATION OF DATA

Opening paragraph (NO section number, NO heading):
Begin: "A total of [N] respondents were recruited, and all completed the questionnaires with adequate data for analysis, resulting in a 100% response rate." Then state what this chapter presents: "This chapter presents the demographic characteristics of the respondents, answers to the research questions, and hypothesis testing based on the collected data."

4.2 Demographic Characteristics of Respondents

Table 4.2.1: Socio-Demographic Characteristics of Respondents
Source: Research field work [Year]

[Write a plausible ASCII/text table with columns: Variable | Category | Frequency | Percentage. Include: Age groups (18–25, 26–30, 31–35, 36–40, 41+), Sex (Female/Male), Marital Status, Education Level (Primary/Secondary/Tertiary/No formal), Occupation, and 1–2 topic-specific variables. Use realistic Nigerian hospital frequencies that sum to the sample size N.]

Narrative paragraph: Begin "The demographic profile of the [N] respondents reveals…" Describe age distribution FIRST — state the dominant group (n, %), second group (n, %), etc. Then describe sex distribution, education, marital status. End with: "This diverse demographic profile provides a robust foundation for analyzing [variable 1 and variable 2] related to [topic] among [population] in [facility]."

Figure 4.1: Bar Chart Showing Age Distribution of Respondents.
Figure 4.2: Bar Chart Showing Education Level of Respondents.

4.3 Answering of Research Questions

Research Question One: [State the full research question exactly as written in Chapter 1]

Table 4.3.1: [Descriptive title — e.g. Knowledge of [Topic] Among [Population]]
Source: Research field work [Year]

[Write a plausible ASCII/text table. For knowledge items (Yes/No format): columns = Item | Yes n(%) | No n(%). Include 6–8 knowledge items relevant to the topic. Use realistic frequencies summing to N. Most items should show high positive response (75–95%) for face validity.]

Narrative paragraph: Begin "The data from Table 4.3.1 indicates a generally [high/moderate/low] level of [variable 1] about [topic] among the [N] [population]. A significant majority, [n (X%)] [finding from dominant item]. [Second key finding with n and %]. [Third finding]. [Any noteworthy contrast or pattern]. [Closing analytical sentence linking findings to Nigerian context or practice implication]."

Figure 4.3: Bar Chart Showing [Variable 1] Among [Population] (N = [n])

Research Question Two: [State the full research question exactly as written in Chapter 1]

Table 4.3.2: [Descriptive title — e.g. [Practices/Preventive Measures] Adopted by [Population]]
Source: Research field work [Year]

[Write a plausible Likert-scale table. Columns = Item | Always n(%) | Often n(%) | Sometimes n(%) | Never n(%). Include 6–8 practice items. Use realistic frequencies. Dominant response should be "Always" or "Often" for most items, with variation.]

Narrative paragraph: Begin "Table 4.3.2 highlights the [practices/measures] adopted by [population] to [implement/prevent] [topic]. The most frequently [practiced/reported] measure was [item], with [n (X%)] always doing so…" Continue describing 3–4 key findings with n and %. Note any gap between knowledge and practice if relevant.

Figure 4.4: Bar Chart Showing [Variable 2] Among [Population] (N = [n])

Research Question Three: [State the full research question exactly as written in Chapter 1]

Table 4.3.3: Factors Influencing [Variable 1 and Variable 2] of [Topic]
Source: Research field work [Year]

[Write a Likert-scale table. Columns = Item | Strongly Agree n(%) | Agree n(%) | Disagree n(%) | Strongly Disagree n(%). Include 6–8 factor items covering: awareness, access to healthcare, cultural beliefs, socioeconomic factors, healthcare provider support, family support. Use realistic frequencies.]

Narrative paragraph: Begin "Table 4.3.3 identifies factors influencing [population]'s [variable 1 and variable 2] for [topic]." Describe 4–5 key findings with n and %. Name the most strongly endorsed factor first, then others. End with analytical remark on what these factors collectively mean for intervention design.

Figure 4.5: Bar Chart Showing Factors Influencing [Variable 1 and Variable 2] (N = [n])

4.4 Hypothesis Testing

Decision Rule: If the P-value is less than 0.05, the null hypothesis (H₀) is rejected, and the alternative hypothesis (H₁) is accepted; otherwise, the null hypothesis is accepted.

Research Hypothesis 1
H₀: [State H₀₁ exactly as written in Chapter 1 — beginning "There is no relationship between…"]
H₁: [State the alternative — beginning "There is a significant relationship between…"]

To test this hypothesis, a Chi-Square Test of Independence was conducted using responses from the [variable 1] item "[quote a specific knowledge item from Table 4.3.1]" and the [variable 2] item "[quote a specific practice item from Table 4.3.2]." Responses were categorized as [Yes/No] or [High/Low] accordingly. [State N used in the test].

Table 4.4.1: Cross-Tabulation for Hypothesis 1
Source: Research field work [Year]

[Write a simple 2×2 cross-tabulation table: rows = knowledge (Yes/No or High/Low), columns = practice (Yes/No or High/Low), with cell frequencies, row totals, and column totals. Make the chi-square statistically significant.]

Inference: The Chi-Square value ([state χ² value, e.g. 7.89]) exceeds the critical value (3.841), and the P-value ([state p-value, e.g. 0.005]) is less than 0.05. Thus, the null hypothesis is rejected, indicating a statistically significant relationship between [variable 1] and [variable 2] among [population] in [facility].

Research Hypothesis 2
H₀₂: [State H₀₂ exactly as written in Chapter 1]
H₁₂: [State the alternative H₁₂]

A Chi-Square Test of Independence was conducted using responses from the factor item "[quote a specific factor item from Table 4.3.3]" and the [variable 2] item "[quote a specific practice item from Table 4.3.2]." Responses were categorized into High (Strongly Agree, Agree) and Low (Disagree, Strongly Disagree). [State N].

Table 4.4.2: Cross-Tabulation for Hypothesis 2
Source: Research field work [Year]

[Write a 2×2 cross-tabulation table — make the chi-square statistically significant.]

Inference: The Chi-Square value ([state χ² value, e.g. 12.45]) exceeds the critical value (3.841), and the P-value ([state p-value, e.g. 0.0004]) is less than 0.05. Thus, the null hypothesis is rejected, indicating a statistically significant relationship between [factor] and [variable 2] among [population] in [facility].`,

      ch5: `Write CHAPTER FIVE: DISCUSSION OF RESULTS. Follow this EXACT GAMZO format:

CHAPTER FIVE
DISCUSSION OF RESULTS

5.1 Discussion of Findings

Opening paragraph (NO sub-heading): Begin "This study aimed to [restate aim exactly]. [The findings from the socio-demographic characteristics, variable 1 levels, variable 2, and influencing factors provide a comprehensive understanding of the topic]." State sample size. (3–4 sentences)

Socio-Demographic Characteristics  [bold, NO section number — on its own line]
1–2 paragraphs: "The socio-demographic profile of the [N] respondents, as presented in Table 4.2.1, offers critical insights into the factors shaping [variable 1 and variable 2]." Describe dominant age group (n, %), sex distribution, education level, and 1–2 other variables. State what this profile means for interpreting findings in the Nigerian/military/hospital context.

Findings on [Variable 1 — e.g. Knowledge of [Topic] Among [Population]]  [bold, NO section number]
4 paragraphs:
- Para 1: "The analysis revealed [a high/moderate/low] level of [variable 1], with [X%] [key finding from Table 4.3.1]…" State 2–3 specific findings with percentages from Chapter 4. Note any pattern or contrast.
- Para 2: "This [finding] [aligns with / far exceeds / contrasts with] [Author et al., year] who [reported/found] that [specific percentage or finding] in [country/setting]." Add why the comparison is significant.
- Para 3: Compare with an African study: "[Author et al., year] [conducted/reported] in [African country] that [finding]…" State whether your finding is higher, lower, or similar and why.
- Para 4: Compare with a Nigerian study: "[Author et al., year] in [Nigerian city/state] found that [finding]…" Add contextual analytical remark specific to the Nigerian military or urban setting. State what this means for nursing practice.

Findings on [Variable 2 — e.g. [Practices/Preventive Measures] of [Topic] Among [Population]]  [bold, NO section number]
Same 4-paragraph structure:
- Para 1: Key findings from Table 4.3.2 with specific percentages, dominant and notable findings
- Para 2: Comparison with a global/high-income country study
- Para 3: Comparison with an African study
- Para 4: Comparison with a Nigerian study + analytical remark on military/urban context

Findings on Factors Influencing [Variable 1 and Variable 2] of [Topic]  [bold, NO section number]
Same 4-paragraph structure:
- Para 1: Key factor findings from Table 4.3.3 — name top 2–3 factors with percentages
- Para 2: Compare with a global study on factors
- Para 3: Compare with an African study on factors
- Para 4: Compare with a Nigerian study + analytical remark on what the multiple influences mean for intervention design

5.2 Implications of the Study to Nursing

Write 6–8 sub-sections. Each sub-section: BOLD HEADING on its own line, followed by 2–4 sentences of specific, actionable implications. NO section numbers. Use these headings (adapt to the topic):

Enhancing [Population] Education through Nursing Interventions
Addressing Cultural and Religious Influences
Strengthening Referral Systems and Interdisciplinary Collaboration
Advocating for Policy Changes and Resource Allocation
Building Community and Family Support Systems
Enhancing Nursing Education and Training
Promoting Preventive and Holistic Care
Addressing Socioeconomic Disparities

Summary of the Study  [bold, NO section number]
1 paragraph: "This study assessed [topic] among [N] [population] in [facility]." State: dominant demographics (age, tribe/ethnicity, marital status, education), key findings for variable 1 (with %) and variable 2 (with %), and hypothesis outcomes (both H₀₁ and H₀₂ rejected/retained with χ² values and p-values).

Conclusion  [bold, NO section number]
1–2 paragraphs: Draw conclusions directly from findings. Reference specific percentages. Acknowledge what gaps persist despite high overall scores. End with a forward-looking statement about improving practice and neonatal/health outcomes through targeted interventions.

Recommendations  [bold, NO section number]
6–8 items. Each formatted EXACTLY as:
[Bold title of recommendation]: [1–2 sentence explanation referencing a specific strategy and citing a supporting study — e.g. "as seen in [Author et al., year]" or "as recommended by [Author et al., year]".]

Example format:
Implement Targeted [Topic] Education Programs: Develop hospital-based workshops focusing on [specific skills], tailored to address cultural misconceptions, as seen in [Author et al., year].

Suggestions for Further Studies  [bold, NO section number]
6 items. Each formatted EXACTLY as:
[Bold title]: [1–2 sentence description of what to study, where, and what outcomes to measure.]

Example format:
Evaluate Culturally Tailored Interventions: Investigate the effectiveness of [topic] education programs designed for Nigeria's cultural context, focusing on outcomes like [specific measures].

REFERENCES  [bold, centered, NO section number]
Full APA 7th edition reference list for ALL chapters combined.
Alphabetical by first author surname.
Minimum 25–30 entries.
2021–2025 dates only (except foundational theories cited at original year).
Format: Author, A. A., & Author, B. B. (Year). Title of article in sentence case. Journal Name in Italics, Volume(Issue), page–page. https://doi.org/xxxxx`,
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
  // Download as .docx — pure raw OOXML + JSZip (no CDN needed)
  // Works 100% in browser with zero external library dependency.
  //
  //   Font:         Times New Roman 12pt throughout
  //   Line spacing: Double (480 twips)
  //   Alignment:    JUSTIFIED body, CENTER for titles
  //   Bold:         Chapter titles, subtitles, subheadings,
  //                 bold-labels, hypothesis lines, bold-colon titles
  //   Indent:       0.5in hanging for references, 0.5in left for lists
  //   Page:         A4 (11906 × 16838 DXA)
  //   Margins:      1in top/right/bottom, 1.5in left (binding)
  //   Page numbers: Bottom centre
  // ────────────────────────────────────────────────────────────
  const downloadDocx = async () => {
    const hasContent = activeChapters.some(c => chapters[c.id]);
    if (!hasContent) { toast('⚠️ No chapters generated yet', '#D97706'); return; }
    setDownloadingDocx(true);

    try {
      // ── Load JSZip from CDN (tiny, reliable, widely available) ─
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Could not load JSZip. Check internet connection.'));
          document.head.appendChild(s);
        });
      }

      // ── XML helpers ──────────────────────────────────────────
      const esc = (t) => String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Build a single <w:r> run
      const mkRun = (text, bold = false) =>
        `<w:r><w:rPr>` +
        `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
        `<w:sz w:val="24"/><w:szCs w:val="24"/>` +
        (bold ? `<w:b/><w:bCs/>` : ``) +
        `</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

      // Build a <w:p> paragraph
      const mkP = (runsXML, center = false, hanging = false, listIndent = false, pageBreakBefore = false) => {
        const jc  = center ? `<w:jc w:val="center"/>` : `<w:jc w:val="both"/>`;
        const ind = hanging
          ? `<w:ind w:left="720" w:hanging="720"/>`
          : listIndent ? `<w:ind w:left="720"/>` : ``;
        const pb  = pageBreakBefore ? `<w:pageBreakBefore/>` : ``;
        return `<w:p><w:pPr>` +
          `<w:spacing w:line="480" w:lineRule="auto" w:before="0" w:after="0"/>` +
          `${jc}${ind}${pb}` +
          `</w:pPr>${runsXML}</w:p>`;
      };

      const blank     = ()      => mkP(mkRun(''));
      const centerB   = (text)  => mkP(mkRun(text, true),  true);
      const justB     = (text)  => mkP(mkRun(text, true),  false);
      const justN     = (text)  => mkP(mkRun(text, false), false);
      const refLine   = (text)  => mkP(mkRun(text, false), false, true);
      const listLine  = (text)  => mkP(mkRun(text, false), false, false, true);
      const monoLine  = (text)  =>
        `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr>` +
        `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>` +
        `<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
        `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
      const newPage   = ()      => mkP(mkRun(''), true, false, false, true);

      // Bold-colon: "Title: rest of text" → bold title, normal rest
      const boldColon = (text) => {
        const ci = text.indexOf(':');
        if (ci < 0) return justN(text);
        return mkP(mkRun(text.slice(0, ci + 1), true) + mkRun(text.slice(ci + 1), false), false);
      };

      // Inline **bold** markers
      const inlineBold = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        const runs  = parts.map(p =>
          p.startsWith('**') && p.endsWith('**')
            ? mkRun(p.slice(2, -2), true)
            : mkRun(p, false)
        ).join('');
        return mkP(runs, false);
      };

      // ── Line classifier ──────────────────────────────────────
      const classify = (line) => {
        const t = line.trim();
        if (!t) return 'blank';
        if (/^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE)$/i.test(t)) return 'chapter-title';
        if (
          t === t.toUpperCase() &&
          /^[A-Z][A-Z\s,&/\-]+$/.test(t) &&
          t.length >= 4 && t.length < 90 && !/^\d/.test(t)
        ) return 'chapter-subtitle';
        if (/^\d+\.\d+(\.\d+)?\s+\S/.test(t)) return 'subheading';
        if (/^H[₀oO0][₁₂₃123][:.\s]/.test(t) || /^H[₁1][₁₂₃123][:.\s]/.test(t)) return 'hypothesis';
        if (/^(Broad Objective|Specific Objectives|Broad Aim|Specific Aims|Decision Rule|Inference:|Source:|REFERENCES|Research (Question|Hypothesis)\s+\d+|Summary of the Study|Conclusion|Recommendations|Suggestions for Further Studies)/i.test(t))
          return 'bold-label';
        if (
          /^[A-Z][A-Za-z\s]+:/.test(t) && t.length < 140 &&
          !/^(http|https|doi|www)/i.test(t) && !/^\d/.test(t) &&
          t.split(':')[0].split(' ').length <= 10
        ) return 'bold-colon';
        if (/^[A-Z][a-z]+,\s[A-Z][\.\s]/.test(t)) return 'reference';
        if (/^(\d+\.|[ivxlIVXL]+\.|[a-z]\))\s/.test(t)) return 'list-item';
        if (t.startsWith('|') || (t.includes('|') && t.indexOf('|') < 5)) return 'table-row';
        if (t.includes('**')) return 'inline-bold';
        return 'body';
      };

      // ── Convert chapter text → OOXML string ─────────────────
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

          // Breathing space before subheadings and chapter titles
          if (
            (type === 'subheading' || type === 'chapter-title' || type === 'bold-label') &&
            prev !== null && prev !== 'blank' && prev !== 'chapter-title' && prev !== 'chapter-subtitle'
          ) out += blank();

          switch (type) {
            case 'chapter-title':    out += centerB(t.toUpperCase()); break;
            case 'chapter-subtitle': out += centerB(t.toUpperCase()); break;
            case 'subheading':       out += justB(t);       break;
            case 'bold-label':       out += justB(t);       break;
            case 'hypothesis':       out += justB(t);       break;
            case 'bold-colon':       out += boldColon(t);   break;
            case 'reference':        out += refLine(t);     break;
            case 'list-item':        out += listLine(t);    break;
            case 'inline-bold':      out += inlineBold(t);  break;
            default:                 out += justN(t);       break;
          }
          prev = type;
        }
        flushTable();
        return out;
      };

      // ── Title page XML ───────────────────────────────────────
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

      // ── Chapter content XML ──────────────────────────────────
      let bodyXML = titleXML;
      for (const ch of activeChapters) {
        if (!chapters[ch.id]) continue;
        bodyXML += newPage();          // each chapter starts on new page
        bodyXML += textToXML(chapters[ch.id]);
      }

      // ── Section properties (page size, margins, page numbers) ─
      const sectProps =
        `<w:sectPr>` +
        `<w:footerReference w:type="default" r:id="rId3"/>` +
        `<w:pgSz w:w="11906" w:h="16838"/>` +
        `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:footer="720" w:header="0" w:gutter="0"/>` +
        `<w:pgNumType w:fmt="decimal" w:start="1"/>` +
        `</w:sectPr>`;

      // ── Full document.xml ────────────────────────────────────
      const documentXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<w:body>${bodyXML}${sectProps}</w:body></w:document>`;

      // ── Footer with page number ──────────────────────────────
      const footerXML =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
        `<w:p><w:pPr><w:jc w:val="center"/>` +
        `<w:spacing w:before="0" w:after="0"/></w:pPr>` +
        `<w:fldSimple w:instr=" PAGE ">` +
        `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>` +
        `<w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r>` +
        `</w:fldSimple></w:p></w:ftr>`;

      // ── Supporting XML files ─────────────────────────────────
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

      // ── Build ZIP ────────────────────────────────────────────
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

      // ── Trigger download ─────────────────────────────────────
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
