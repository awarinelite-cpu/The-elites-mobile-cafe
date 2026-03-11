// src/pages/services/ClientCarePage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function ClientCarePage() {
  return (
    <ServiceRequestPage
      serviceKey="client_care"
      serviceTitle="Client Care Support"
      serviceIcon="🤝"
      serviceDesc="Personalised academic and administrative support. We guide you through school processes, form submissions, documentation, and any other challenges you face."
      extraFields={[
        { name: 'supportType', label: 'Type of Support Needed', type: 'select', required: true,
          options: ['School registration guidance', 'Document processing', 'Academic counselling', 'Form filling assistance', 'Result checking', 'Other'] },
        { name: 'institution', label: 'School / Institution', type: 'text', placeholder: 'e.g. UNILAG, LASU, Polytechnic Yaba', required: false },
      ]}
    />
  );
}
