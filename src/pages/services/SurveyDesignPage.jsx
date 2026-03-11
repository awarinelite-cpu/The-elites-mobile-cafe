// src/pages/services/SurveyDesignPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function SurveyDesignPage() {
  return (
    <ServiceRequestPage
      serviceKey="survey_design_analysis"
      serviceTitle="Survey Design & Analysis"
      serviceIcon="📋"
      serviceDesc="End-to-end survey support — questionnaire design, Google Forms / paper setup, data collection strategy, and full statistical analysis of results."
      extraFields={[
        { name: 'surveyTopic', label: 'Survey Topic / Research Area', type: 'text', placeholder: 'e.g. Patient satisfaction in primary health centres', required: true },
        { name: 'service', label: 'What Do You Need?', type: 'select', required: true,
          options: ['Design questionnaire only', 'Analyse existing data only', 'Both design & analysis', 'Google Form setup', 'Full survey package'] },
        { name: 'targetGroup', label: 'Target Respondents', type: 'text', placeholder: 'e.g. Final year nursing students', required: false },
        { name: 'sampleSize', label: 'Expected Sample Size', type: 'text', placeholder: 'e.g. 100–200', required: false },
      ]}
    />
  );
}
