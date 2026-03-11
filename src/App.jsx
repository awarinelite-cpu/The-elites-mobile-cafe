/* ============================================================
   RESEARCH REQUEST WEBSITE — ACADEMIC DEEP BLUE THEME
   Font: Times New Roman (serif) | Palette: Deep Blue + White
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

/* ── CSS Variables ────────────────────────────────────────── */
:root {
  /* Core Palette */
  --blue-deep:        #1E3A8A;   /* Deep Blue — primary brand */
  --blue-mid:         #1D4ED8;   /* Bright blue — hover/accent */
  --blue-dark:        #172554;   /* Darkest blue — nav bg, footer */
  --blue-light:       #DBEAFE;   /* Light blue — subtle backgrounds */
  --blue-muted:       #EFF6FF;   /* Very light tint — section bg */

  --green-action:     #16A34A;   /* Payment / success button */
  --green-hover:      #15803D;   /* Payment button hover */

  --white:            #FFFFFF;
  --gray-body:        #1F2937;   /* Main body text */
  --gray-muted:       #6B7280;   /* Captions, secondary text */
  --gray-border:      #D1D5DB;   /* Light borders */
  --gray-bg:          #F9FAFB;   /* Subtle page background tint */

  --red-error:        #DC2626;
  --red-light:        #FEE2E2;

  /* Typography */
  --font-serif:       'Times New Roman', 'EB Garamond', Georgia, serif;
  --font-ui:          'Times New Roman', Georgia, serif;

  /* Spacing & Shape */
  --radius-sm:        4px;
  --radius:           8px;
  --radius-lg:        12px;
  --radius-xl:        16px;

  /* Shadows */
  --shadow-sm:        0 1px 3px rgba(30, 58, 138, 0.08);
  --shadow-md:        0 4px 16px rgba(30, 58, 138, 0.12);
  --shadow-lg:        0 8px 32px rgba(30, 58, 138, 0.18);
  --shadow-card:      0 2px 12px rgba(30, 58, 138, 0.10);

  /* Legacy aliases — keeps old var(--gold) etc. from breaking */
  --dark:             var(--blue-dark);
  --dark-elevated:    #1e3a8a;
  --gold:             #F59E0B;
  --border:           var(--gray-border);
  --border-gold:      #F59E0B;
  --text-primary:     var(--gray-body);
  --text-muted:       var(--gray-muted);
  --font-display:     var(--font-serif);
  --font-body:        var(--font-serif);
}

/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 400;
  line-height: 1.7;
  color: var(--gray-body);
  background-color: var(--white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Headings ─────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
  color: var(--blue-deep);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}

h1 { font-size: clamp(32px, 5vw, 42px); margin-bottom: 0.5em; }
h2 { font-size: clamp(24px, 3.5vw, 30px); margin-bottom: 0.45em; }
h3 { font-size: clamp(19px, 2.5vw, 22px); margin-bottom: 0.4em; }
h4 { font-size: 18px; font-weight: 600; margin-bottom: 0.35em; }

/* Headings on dark/blue backgrounds */
.on-blue h1, .on-blue h2, .on-blue h3,
.on-blue h4, .on-blue h5, .on-blue h6 {
  color: var(--white);
}

/* ── Paragraphs & Text ────────────────────────────────────── */
p {
  color: var(--gray-body);
  line-height: 1.75;
  margin-bottom: 1em;
}

p:last-child { margin-bottom: 0; }

.on-blue p, .on-blue span, .on-blue li {
  color: rgba(255, 255, 255, 0.92);
}

.text-muted {
  color: var(--gray-muted);
  font-size: 14px;
}

.text-white  { color: var(--white); }
.text-blue   { color: var(--blue-deep); }
.text-center { text-align: center; }

/* ── Links ────────────────────────────────────────────────── */
a {
  color: var(--blue-mid);
  text-decoration: none;
  transition: color 0.2s;
}

a:hover { color: var(--blue-deep); text-decoration: underline; }

/* ── Buttons ──────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  padding: 12px 28px;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:disabled:active { transform: none; }

/* Primary — Request Research */
.btn-primary {
  background: var(--blue-deep);
  color: var(--white);
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
}
.btn-primary:hover {
  background: var(--blue-mid);
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.30);
  text-decoration: none;
  color: var(--white);
}

/* Payment / Make Payment — green */
.btn-payment {
  background: var(--green-action);
  color: var(--white);
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
}
.btn-payment:hover {
  background: var(--green-hover);
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.30);
  text-decoration: none;
  color: var(--white);
}

/* Outline variant */
.btn-outline {
  background: transparent;
  color: var(--blue-deep);
  border: 2px solid var(--blue-deep);
}
.btn-outline:hover {
  background: var(--blue-deep);
  color: var(--white);
  text-decoration: none;
}

/* Ghost on dark/blue backgrounds */
.btn-ghost-white {
  background: transparent;
  color: var(--white);
  border: 2px solid rgba(255, 255, 255, 0.6);
}
.btn-ghost-white:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--white);
  color: var(--white);
  text-decoration: none;
}

/* Sizes */
.btn-sm  { font-size: 13px; padding: 8px 18px; }
.btn-lg  { font-size: 16px; padding: 14px 36px; }
.btn-xl  { font-size: 17px; padding: 16px 42px; }
.btn-full{ width: 100%; }

/* ── Cards ────────────────────────────────────────────────── */
.card {
  background: var(--white);
  border: 1px solid var(--gray-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--shadow-md); }

.card-blue {
  background: var(--blue-deep);
  border-color: var(--blue-deep);
  color: var(--white);
}

.card-tint {
  background: var(--blue-muted);
  border-color: var(--blue-light);
}

/* ── Forms ────────────────────────────────────────────────── */
input, textarea, select {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--gray-body);
  background: var(--white);
  border: 1.5px solid var(--gray-border);
  border-radius: var(--radius);
  padding: 10px 14px;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--blue-deep);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

input::placeholder, textarea::placeholder {
  color: var(--gray-muted);
  font-style: italic;
}

label {
  display: block;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 600;
  color: var(--blue-deep);
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}

.form-group { margin-bottom: 20px; }

.field-error {
  color: var(--red-error);
  font-size: 13px;
  margin-top: 5px;
}

/* ── Navigation ───────────────────────────────────────────── */
.navbar {
  background: var(--blue-dark);
  border-bottom: 3px solid var(--blue-mid);
  box-shadow: 0 2px 12px rgba(23, 37, 84, 0.4);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-brand {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--white) !important;
  letter-spacing: -0.02em;
  text-decoration: none !important;
}
.navbar-brand:hover { color: var(--blue-light) !important; }

.nav-link {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85) !important;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background 0.2s;
  text-decoration: none;
}
.nav-link:hover, .nav-link.active {
  color: var(--white) !important;
  background: rgba(255, 255, 255, 0.1);
  text-decoration: none;
}

/* ── Sections / Page Layout ───────────────────────────────── */
.section {
  padding: 80px 16px;
}

.section-blue {
  background: var(--blue-deep);
  color: var(--white);
}

.section-tint {
  background: var(--blue-muted);
}

.section-dark {
  background: var(--blue-dark);
  color: var(--white);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.container-sm {
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

/* ── Hero ─────────────────────────────────────────────────── */
.hero {
  background: linear-gradient(135deg, var(--blue-dark) 0%, var(--blue-deep) 60%, var(--blue-mid) 100%);
  color: var(--white);
  padding: 100px 16px 80px;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 80% 40%, rgba(255,255,255,0.04) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.hero h1 {
  color: var(--white);
  font-size: clamp(34px, 5.5vw, 52px);
  text-shadow: 0 2px 12px rgba(0,0,0,0.25);
}

.hero p {
  color: rgba(255, 255, 255, 0.88);
  font-size: clamp(16px, 2vw, 19px);
}

/* ── Badges & Tags ────────────────────────────────────────── */
.badge {
  display: inline-block;
  font-family: var(--font-serif);
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-blue    { background: var(--blue-light); color: var(--blue-deep); }
.badge-green   { background: #DCFCE7; color: #15803D; }
.badge-red     { background: var(--red-light); color: var(--red-error); }
.badge-gray    { background: #F3F4F6; color: var(--gray-muted); }

/* ── Dividers ─────────────────────────────────────────────── */
hr {
  border: none;
  border-top: 1.5px solid var(--gray-border);
  margin: 32px 0;
}

.divider-blue {
  border-top-color: var(--blue-light);
}

/* ── Tables ───────────────────────────────────────────────── */
table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-serif);
  font-size: 15px;
}

thead th {
  background: var(--blue-deep);
  color: var(--white);
  font-weight: 700;
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-border);
  color: var(--gray-body);
}

tbody tr:hover { background: var(--blue-muted); }
tbody tr:last-child td { border-bottom: none; }

/* ── Footer ───────────────────────────────────────────────── */
.footer {
  background: var(--blue-dark);
  color: rgba(255, 255, 255, 0.80);
  padding: 48px 16px 24px;
  font-family: var(--font-serif);
}

.footer a {
  color: rgba(255, 255, 255, 0.70);
  font-size: 14px;
}
.footer a:hover { color: var(--white); text-decoration: underline; }

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 20px;
  margin-top: 32px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.50);
}

/* ── Auth / Form Pages ────────────────────────────────────── */
.auth-page {
  min-height: 100vh;
  background: linear-gradient(160deg, var(--blue-dark) 0%, var(--blue-deep) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.auth-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 44px 40px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(23, 37, 84, 0.35);
}

.auth-card h1, .auth-card h2 {
  text-align: center;
  margin-bottom: 4px;
}

.auth-card .subtitle {
  text-align: center;
  color: var(--gray-muted);
  font-size: 15px;
  margin-bottom: 32px;
}

/* ── Dashboard / Admin ────────────────────────────────────── */
.dashboard-layout {
  display: flex;
  min-height: calc(100vh - 64px);
}

.sidebar {
  width: 240px;
  background: var(--blue-dark);
  border-right: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  font-family: var(--font-serif);
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.sidebar-link:hover, .sidebar-link.active {
  background: rgba(255,255,255,0.08);
  color: var(--white);
  border-left-color: var(--blue-light);
  text-decoration: none;
}

/* ── Alerts ───────────────────────────────────────────────── */
.alert {
  padding: 14px 18px;
  border-radius: var(--radius);
  font-family: var(--font-serif);
  font-size: 15px;
  border-left: 4px solid;
  margin-bottom: 20px;
}

.alert-info    { background: var(--blue-muted); border-color: var(--blue-mid); color: var(--blue-deep); }
.alert-success { background: #F0FDF4; border-color: var(--green-action); color: #14532D; }
.alert-error   { background: var(--red-light); border-color: var(--red-error); color: #7F1D1D; }

/* ── Loading ──────────────────────────────────────────────── */
.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(30,58,138,0.2);
  border-top-color: var(--blue-deep);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.spinner-white {
  border-color: rgba(255,255,255,0.3);
  border-top-color: var(--white);
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Utility ──────────────────────────────────────────────── */
.flex        { display: flex; }
.flex-col    { flex-direction: column; }
.items-center{ align-items: center; }
.justify-center{ justify-content: center; }
.justify-between{ justify-content: space-between; }
.gap-8       { gap: 8px; }
.gap-12      { gap: 12px; }
.gap-16      { gap: 16px; }
.gap-24      { gap: 24px; }
.mt-8        { margin-top: 8px; }
.mt-16       { margin-top: 16px; }
.mt-24       { margin-top: 24px; }
.mb-8        { margin-bottom: 8px; }
.mb-16       { margin-bottom: 16px; }
.mb-24       { margin-bottom: 24px; }
.w-full      { width: 100%; }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 768px) {
  .section   { padding: 52px 16px; }
  .auth-card { padding: 32px 20px; }
  .card      { padding: 20px; }
  .sidebar   { display: none; }
  h1 { font-size: 28px; }
  h2 { font-size: 22px; }
  .btn-xl { font-size: 15px; padding: 13px 28px; }
}

@media (max-width: 480px) {
  .auth-card { padding: 28px 16px; }
}
