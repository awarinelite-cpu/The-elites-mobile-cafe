// src/pages/services/OnlineRegistrationPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function OnlineRegistrationPage() {
  return (
    <ServiceRequestPage
      serviceKey="online_registration"
      serviceTitle="Online Registration"
      serviceIcon="🖥️"
      serviceDesc="Fast and accurate online registration assistance for JAMB, WAEC, NECO, Post-UTME, school portals, professional bodies, and more."
      extraFields={[
        { name: 'regType', label: 'Registration Type', type: 'select', required: true,
          options: ['JAMB / UTME', 'WAEC', 'NECO', 'Post-UTME', 'School Portal', 'NIN / BVN', 'Professional Body', 'Other'] },
        { name: 'candidateName', label: "Candidate's Full Name (if different)", type: 'text', placeholder: 'Leave blank if same as above', required: false },
      ]}
    />
  );
}
