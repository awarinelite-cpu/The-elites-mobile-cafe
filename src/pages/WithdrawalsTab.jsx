// src/pages/WithdrawalsTab.jsx
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function WithdrawalsTab({ withdrawalRequests, users, s, showToast }) {
  const pending      = withdrawalRequests.filter(w => w.status === 'pending');
  const processed    = withdrawalRequests.filter(w => w.status !== 'pending');
  const totalPending = pending.reduce((sum, w) => sum + (w.amount || 0), 0);

  const markPaid = async (id, writerId, amount) => {
    await updateDoc(doc(db, 'withdrawalRequests', id), { status: 'paid', paidAt: serverTimestamp() });
    if (writerId) {
      await addDoc(collection(db, 'notifications'), {
        userId: writerId,
        title: '✅ Withdrawal Processed',
        body: `Your withdrawal of ₦${Number(amount).toLocaleString()} has been paid to your account.`,
        type: 'payment', read: false, createdAt: serverTimestamp(),
      });
    }
    showToast('✅ Marked as paid — writer notified');
  };

  const reject = async (id, writerId, amount) => {
    await updateDoc(doc(db, 'withdrawalRequests', id), { status: 'rejected', rejectedAt: serverTimestamp() });
    if (writerId) {
      await addDoc(collection(db, 'notifications'), {
        userId: writerId,
        title: '❌ Withdrawal Rejected',
        body: `Your withdrawal request of ₦${Number(amount).toLocaleString()} was not processed. Contact admin for details.`,
        type: 'payment', read: false, createdAt: serverTimestamp(),
      });
    }
    showToast('✅ Request rejected — writer notified');
  };

  const Row = ({ w }) => {
    const writerUser = users.find(u => (u.uid || u.id) === w.writerId);
    return (
      <div style={{ ...s.card, border: w.status === 'pending' ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--border-card)', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
              {w.writerName || writerUser?.name || 'Writer'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.writerEmail}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.createdAt?.toDate?.()?.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#16A34A' }}>₦{Number(w.amount).toLocaleString()}</div>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              background: w.status === 'paid' ? 'rgba(22,163,74,0.12)' : w.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
              color: w.status === 'paid' ? '#16A34A' : w.status === 'rejected' ? '#EF4444' : '#D97706' }}>
              {w.status}
            </span>
          </div>
        </div>

        {/* Bank details */}
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Bank', w.bankName], ['Account Name', w.accountName], ['Account No.', w.bankAccount]].map(([label, val]) => val ? (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {val}
                <button onClick={() => { navigator.clipboard.writeText(val); showToast('📋 Copied!'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 11, fontWeight: 700, padding: 0 }}>copy</button>
              </div>
            </div>
          ) : null)}
        </div>

        {w.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>"{w.note}"</div>}

        {w.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => markPaid(w.id, w.writerId, w.amount)}
              style={{ ...s.btn('#16A34A'), flex: 1, padding: '10px' }}>
              ✅ Mark as Paid
            </button>
            <button onClick={() => reject(w.id, w.writerId, w.amount)}
              style={{ ...s.btn('#EF4444'), padding: '10px 20px' }}>
              ❌ Reject
            </button>
          </div>
        )}
        {w.status === 'paid'     && <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Paid on {w.paidAt?.toDate?.()?.toLocaleDateString()}</div>}
        {w.status === 'rejected' && <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>❌ Rejected</div>}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>💸 Withdrawal Requests</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Process writer payout requests. Bank details included for direct transfer.</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Pending Requests', value: pending.length,                          color: '#D97706', bg: 'rgba(217,119,6,0.08)'  },
          { label: 'Amount Due',       value: `₦${totalPending.toLocaleString()}`,     color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
          { label: 'Processed',        value: processed.length,                        color: '#16A34A', bg: 'rgba(22,163,74,0.08)'  },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            🟡 Pending ({pending.length})
          </div>
          {pending.map(w => <Row key={w.id} w={w} />)}
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            History ({processed.length})
          </div>
          {processed.map(w => <Row key={w.id} w={w} />)}
        </div>
      )}

      {withdrawalRequests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💸</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>No withdrawal requests yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Writers will submit requests from their Wallet tab.</div>
        </div>
      )}
    </div>
  );
}
