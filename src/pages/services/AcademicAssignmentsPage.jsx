// src/pages/services/AcademicAssignmentsPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function AcademicAssignmentsPage() {
  return (
    <ServiceRequestPage
      serviceKey="academic_assignments"
      serviceTitle="Academic Assignments"
      serviceIcon="📝"
      serviceDesc="Well-researched, properly formatted assignments for any course or level. We cover essays, reports, case studies, term papers, and more."
      extraFields={[
        { name: 'assignmentType', label: 'Assignment Type', type: 'select', required: true,
          options: ['Essay', 'Term Paper', 'Case Study', 'Lab Report', 'Course Work', 'Other'] },
        { name: 'course', label: 'Course / Subject', type: 'text', placeholder: 'e.g. Community Health Nursing', required: true },
        { name: 'wordCount', label: 'Word / Page Count', type: 'text', placeholder: 'e.g. 1500 words or 5 pages', required: false },
        { name: 'level', label: 'Academic Level', type: 'select', required: false,
          options: ['OND', 'HND', 'BSc / B.Tech', 'PGD', 'MSc / MBA', 'PhD', 'Other'] },
      ]}
    />
  );
}
