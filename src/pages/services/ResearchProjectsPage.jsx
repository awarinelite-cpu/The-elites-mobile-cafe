// src/pages/services/ResearchProjectsPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function ResearchProjectsPage() {
  return (
    <ServiceRequestPage
      serviceKey="research_projects"
      serviceTitle="Research Projects"
      serviceIcon="🔬"
      serviceDesc="Complete research assistance from topic selection to final write-up. We handle literature reviews, methodology, data collection, analysis, and full project documentation."
      extraFields={[
        { name: 'topic', label: 'Research Topic / Area', type: 'text', placeholder: 'e.g. Effect of malaria on under-5 children in Lagos', required: true },
        { name: 'level', label: 'Academic Level', type: 'select', required: true,
          options: ['OND', 'HND', 'BSc / B.Tech', 'PGD', 'MSc / MBA', 'PhD', 'Other'] },
        { name: 'chapters', label: 'Chapters Needed', type: 'select', required: false,
          options: ['Chapter 1 only', 'Chapters 1–3', 'Chapters 1–5 (Full)', 'Data Analysis only', 'Full Project + Defence Slides'] },
        { name: 'subject', label: 'Course / Department', type: 'text', placeholder: 'e.g. Nursing Science, Public Health', required: false },
      ]}
    />
  );
}
