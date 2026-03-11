// src/pages/services/ProofreadingPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function ProofreadingPage() {
  return (
    <ServiceRequestPage
      serviceKey="proofreading_editing"
      serviceTitle="Proofreading & Editing"
      serviceIcon="✏️"
      serviceDesc="Thorough proofreading and editing for grammar, spelling, clarity, structure, and academic tone. We handle projects, theses, essays, and any written document."
      extraFields={[
        { name: 'docType', label: 'Document Type', type: 'select', required: true,
          options: ['Research Project / Thesis', 'Essay / Assignment', 'CV / Cover Letter', 'Business Document', 'Article / Blog', 'Other'] },
        { name: 'pageCount', label: 'Approximate Number of Pages', type: 'text', placeholder: 'e.g. 30 pages', required: false },
        { name: 'editingLevel', label: 'Level of Editing Needed', type: 'select', required: false,
          options: ['Light proofread (grammar & spelling only)', 'Standard edit (grammar + clarity)', 'Deep edit (structure + rewrite where needed)'] },
      ]}
    />
  );
}
