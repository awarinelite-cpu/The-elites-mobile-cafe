// src/pages/services/DataAnalysisPage.jsx
import ServiceRequestPage from './ServiceRequestPage';
export default function DataAnalysisPage() {
  return (
    <ServiceRequestPage
      serviceKey="data_analysis"
      serviceTitle="Data Analysis"
      serviceIcon="📊"
      serviceDesc="Professional statistical analysis using SPSS, Excel, or other tools. We handle data cleaning, descriptive and inferential statistics, charts, and interpretation."
      extraFields={[
        { name: 'software', label: 'Preferred Software', type: 'select', required: false,
          options: ['SPSS', 'Microsoft Excel', 'R', 'Stata', 'Any / Not Sure'] },
        { name: 'dataType', label: 'Type of Data', type: 'select', required: true,
          options: ['Questionnaire / Survey data', 'Secondary / Existing data', 'Clinical / Lab data', 'Financial data', 'Other'] },
        { name: 'sampleSize', label: 'Sample Size (approx.)', type: 'text', placeholder: 'e.g. 150 respondents', required: false },
        { name: 'analysisType', label: 'Analysis Needed', type: 'textarea', placeholder: 'e.g. Frequency tables, chi-square, regression, charts', required: false },
      ]}
    />
  );
}
