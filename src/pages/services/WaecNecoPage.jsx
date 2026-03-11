// src/pages/services/WaecNecoPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function WaecNecoPage() {
  return (
    <ServiceRequestPage
      serviceKey="waec_neco_scratch_cards"
      serviceTitle="WAEC / NECO Scratch Card Sales"
      serviceIcon="🎫"
      serviceDesc="Quick, reliable scratch card purchase for checking your WAEC or NECO results. Cards are delivered promptly after confirmation."
      extraFields={[
        { name: 'cardType', label: 'Card Type', type: 'select', required: true,
          options: ['WAEC Result Checker', 'NECO Result Checker', 'Both WAEC & NECO'] },
        { name: 'quantity', label: 'Number of Cards', type: 'select', required: true,
          options: ['1 card', '2 cards', '3 cards', '4 cards', '5+ cards'] },
        { name: 'examYear', label: 'Exam Year', type: 'text', placeholder: 'e.g. 2024', required: false },
        { name: 'deliveryMethod', label: 'Delivery Method', type: 'select', required: true,
          options: ['WhatsApp (image)', 'Email', 'Pick up in person (Yaba, Lagos)'] },
      ]}
    />
  );
}
