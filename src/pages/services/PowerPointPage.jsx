// src/pages/services/PowerPointPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function PowerPointPage() {
  return (
    <ServiceRequestPage
      serviceKey="powerpoint_presentation"
      serviceTitle="PowerPoint Presentation"
      serviceIcon="📑"
      serviceDesc="Professional, visually appealing presentation slides for seminars, defence, business pitches, conferences, and lectures."
      extraFields={[
        { name: 'topic', label: 'Presentation Topic', type: 'text', placeholder: 'e.g. Effect of hypertension in elderly patients', required: true },
        { name: 'slideCount', label: 'Number of Slides (approx.)', type: 'text', placeholder: 'e.g. 20 slides', required: false },
        { name: 'purpose', label: 'Purpose', type: 'select', required: true,
          options: ['Project Defence', 'Seminar / Class presentation', 'Conference', 'Business Pitch', 'Teaching / Lecture', 'Other'] },
        { name: 'hasContent', label: 'Do you have existing content / notes?', type: 'select', required: false,
          options: ['Yes — I will provide the write-up', 'Partial — some notes available', 'No — please research and create'] },
      ]}
    />
  );
}
