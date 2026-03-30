// src/pages/adminConstants.js
// Shared constants used across AdminPage and its sub-components

export const STATUS_OPTIONS = ['pending','reviewing','accepted','priced','in_progress','completed','rejected'];

export const STATUS_COLORS = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  reviewing:   { bg: 'rgba(37,99,235,0.12)',   color: '#2563EB' },
  accepted:    { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
  in_progress: { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  completed:   { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  priced:      { bg: 'rgba(201,168,76,0.12)', color: '#C9A84C' },
};

export const CATEGORIES = [
  // Health Sciences
  'Nursing Science','Midwifery','Medicine & Surgery','Public Health','Community Health',
  'Mental Health','Pharmacology','Medical Laboratory Science','Physiotherapy','Radiography',
  'Nutrition & Dietetics','Environmental Health','Health Information Management',
  'Optometry','Dental Surgery','Medical Rehabilitation','Veterinary Medicine',
  // Education
  'Education','Educational Management','Guidance & Counselling','Early Childhood Education',
  'Special Education','Curriculum Studies','Educational Psychology',
  // Business & Social Sciences
  'Business Administration','Accounting','Economics','Marketing','Banking & Finance',
  'Public Administration','Sociology','Psychology','Political Science','Mass Communication','Social Work',
  // Sciences & Technology
  'Computer Science','Information Technology','Electrical Engineering','Civil Engineering',
  'Mechanical Engineering','Agricultural Science','Biochemistry','Microbiology',
  'Chemistry','Physics','Environmental Science',
  // Law & Humanities
  'Law','English Language','History','Philosophy','Religious Studies','Linguistics',
  'Other',
];

export const NAV = [
  { key: 'dashboard',   label: '🏠 Dashboard',       group: 'main'    },
  { key: 'requests',    label: '📋 Service Requests', group: 'main'    },
  { key: 'topics',      label: '📚 Research Topics',  group: 'main'    },
  { key: 'messages',    label: '💬 Messages',          group: 'comms'   },
  { key: 'withdrawals', label: '💸 Withdrawals',       group: 'finance' },
  { key: 'payments',    label: '💰 Payment Splits',    group: 'finance' },
  { key: 'users',       label: '👥 Users',             group: 'manage'  },
  { key: 'ai_writer',   label: '🤖 AI Writer',         group: 'tools'   },
];
