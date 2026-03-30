// src/pages/NMCNAdminView.jsx
export default function NMCNAdminView({ request }) {
  const d = request.extraData || {};

  const copyField = (val) => {
    navigator.clipboard.writeText(val || '').then(() => {}).catch(() => {});
    const el = document.createElement('div');
    el.textContent = '📋 Copied!';
    el.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#0D9488;color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:9999;pointer-events:none;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  };

  const downloadPassport = () => {
    if (!d.passport) return alert('No passport photo uploaded.');
    const a = document.createElement('a');
    a.href = d.passport;
    a.download = `passport_${request.name || 'client'}_${request.id?.slice(0,6)}.jpg`;
    a.click();
  };

  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  const Section = ({ title, fields }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(([label, key]) => {
          const val = d[key] || request[key] || '';
          if (!val) return null;
          const isPassport = key === 'passport';
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
                {!isPassport && (
                  <button onClick={() => copyField(val)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 11, fontWeight: 700, padding: '2px 6px' }}>
                    📋 Copy
                  </button>
                )}
              </div>
              {isPassport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={val} alt="Passport"
                    style={{ width: 70, height: 85, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--teal)' }} />
                  <button onClick={downloadPassport}
                    style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⬇️ Download Passport
                  </button>
                </div>
              ) : (
                <input readOnly value={val} style={inp}
                  onFocus={e => e.target.select()}
                  title="Click to select all, then copy" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const docs = [
    ['WAEC / NECO Certificate', 'hasWaecNeco'],
    ['Admission Letter',         'hasAdmissionLetter'],
    ['Testimonial',              'hasTestimonial'],
    ['Birth Certificate',        'hasBirthCert'],
  ];

  const uploadedDocs = Object.entries(d).filter(([k]) => k.startsWith('docFile_'));

  return (
    <div>
      {/* Header badge */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>NMCN</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{request.nmcnType} — {request.nmcnSubType}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{request.name} · {request.email}</div>
      </div>

      {/* Copy All button */}
      <button onClick={() => {
        const lines = [];
        lines.push(`=== NMCN ${request.nmcnType} (${request.nmcnSubType}) ===`);
        lines.push(`Client: ${request.name} | ${request.email} | ${request.phone}`);
        lines.push('');
        lines.push('--- SECTION A ---');
        [['Institution',d.institutionName],['Exam No',d.examNumber],['Surname',d.surname],['Email',d.emailA||request.email],['Phone',d.phoneA||request.phone],['App No',d.applicationNumber],['Indexing No',d.indexingNumber],['Admission Date',d.admissionDate],['DOB',d.dobA],['Gender',d.genderA],['Marital Status',d.maritalStatusA]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION B ---');
        [['First Name',d.firstName],['Middle Name',d.middleName],['Last Name',d.lastName],['DOB',d.dob],['Gender',d.gender],['Phone',d.phone],['Email',d.email],['Nationality',d.nationality],['State of Origin',d.stateOfOrigin],['LGA',d.lga],['Permanent Address',d.permanentAddress],['Marital Status',d.maritalStatus],['Country',d.country],['Residential Address',d.residentialAddress],['Res LGA',d.residentialLGA],['Res State',d.residentialState],['Res Town',d.residentialTown]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION C ---');
        [['NOK Name',d.nokName],['NOK Phone',d.nokPhone],['NOK Address',d.nokAddress],['Relationship',d.nokRelationship]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION E ---');
        [['NIN',d.nin],['Sponsor Name',d.sponsorName],['Sponsor Address',d.sponsorAddress],['Sponsor Phone',d.sponsorPhone],['Sponsor Email',d.sponsorEmail]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        lines.push('');
        lines.push('--- SECTION F ---');
        [['Exam Body',d.examBody],['Exam Type',d.examType],['Exam No',d.examinationNumber],['Exam Year',d.examYear],['Scratch Serial',d.scratchSerial],['Scratch PIN',d.scratchPin],['NECO Token',d.necoToken]].forEach(([l,v])=>{ if(v) lines.push(`${l}: ${v}`); });
        navigator.clipboard.writeText(lines.join('\n'));
        copyField('copied');
      }} style={{ width: '100%', background: '#1E3A8A', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        📋 Copy All Data (for NMCN Website)
      </button>

      <Section title="Section A — Institution & Admission" fields={[
        ['Institution Name','institutionName'],['Exam Number','examNumber'],['Surname','surname'],
        ['Email','emailA'],['Phone','phoneA'],['Application Number','applicationNumber'],
        ['Indexing Number','indexingNumber'],['Admission Date','admissionDate'],
        ['Date of Birth','dobA'],['Gender','genderA'],['Marital Status','maritalStatusA'],
      ]} />

      <Section title="Section B — Personal Information" fields={[
        ['First Name','firstName'],['Middle Name','middleName'],['Last Name','lastName'],
        ['Date of Birth','dob'],['Gender','gender'],['Phone','phone'],['Email','email'],
        ['Nationality','nationality'],['State of Origin','stateOfOrigin'],['LGA','lga'],
        ['Permanent Address','permanentAddress'],['Marital Status','maritalStatus'],
        ['Country','country'],['Residential Address','residentialAddress'],
        ['Res. LGA','residentialLGA'],['Res. State','residentialState'],['Res. Town','residentialTown'],
      ]} />

      <Section title="Section C — Next of Kin" fields={[
        ['NOK Name','nokName'],['NOK Phone','nokPhone'],
        ['NOK Address','nokAddress'],['Relationship','nokRelationship'],
      ]} />

      {/* Section D — Documents checklist */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          Section D — Documents Checklist
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.map(([label, key]) => {
            const has = d[key] === 'yes';
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: has ? 'rgba(22,163,74,0.08)' : 'var(--bg-tertiary)', borderRadius: 8, border: `1px solid ${has ? 'rgba(22,163,74,0.3)' : 'var(--border)'}` }}>
                <span style={{ fontSize: 16 }}>{has ? '✅' : '❌'}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: has ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{has ? 'Confirmed' : 'Not uploaded'}</span>
              </div>
            );
          })}
        </div>

        {uploadedDocs.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>UPLOADED FILES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploadedDocs.map(([key, val]) => {
                const docName = key.replace('docFile_', '').replace(/_/g, ' ');
                const isImage = val.startsWith('data:image');
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(13,148,136,0.06)', borderRadius: 8, border: '1px solid rgba(13,148,136,0.2)' }}>
                    <span style={{ fontSize: 20 }}>{isImage ? '🖼️' : '📄'}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{docName}</span>
                    <button onClick={() => {
                      const a = document.createElement('a');
                      a.href = val;
                      a.download = `${docName}_${request.id?.slice(0,6)}`;
                      a.click();
                    }} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                      ⬇️ Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Section title="Section E — Sponsor Information" fields={[
        ['NIN','nin'],['Sponsor Name','sponsorName'],['Sponsor Address','sponsorAddress'],
        ['Sponsor Phone','sponsorPhone'],['Sponsor Email','sponsorEmail'],
      ]} />

      <Section title="Section F — Examination Body & Passport" fields={[
        ['Exam Body','examBody'],['Exam Type','examType'],['Examination Number','examinationNumber'],
        ['Exam Year','examYear'],['Scratch Card Serial','scratchSerial'],
        ['Scratch Card PIN','scratchPin'],['NECO Token','necoToken'],
        ['Passport Photo','passport'],
      ]} />
    </div>
  );
}
