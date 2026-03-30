import { useState } from "react";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PAYSTACK_PUBLIC_KEY = "pk_live_25be9012b1233d358dfbab621aac09469f128cd4";

const BANK_ACCOUNT = {
  bank: "Moniepoint",
  accountNumber: "7054641287",
  accountName: "Awarin Elite",
};
// ───────────────────────────────────────────────────────────────────────────

const loadPaystack = () =>
  new Promise((resolve) => {
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => resolve(window.PaystackPop);
    document.body.appendChild(script);
  });

const PaymentComponent = ({ request, paymentType, onPaymentSuccess }) => {
  const [method, setMethod] = useState("paystack"); // "paystack" | "transfer"
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const totalPrice = request.agreedPrice || request.proposedPrice || 0;
  const advanceAmount = Math.ceil(totalPrice * 0.5);
  const finalAmount = totalPrice - (request.advancePaid || 0);
  const amount = paymentType === "advance" ? advanceAmount : finalAmount;

  const description =
    paymentType === "advance"
      ? `50% Advance – ${request.serviceTitle || request.topicTitle || "Service"}`
      : `Final 50% – ${request.serviceTitle || request.topicTitle || "Service"}`;

  // ── Paystack ──────────────────────────────────────────────────────────────
  const handlePaystack = async () => {
    if (!amount || amount <= 0) return alert("Invalid payment amount.");
    setLoading(true);
    try {
      const PaystackPop = await loadPaystack();
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: request.clientEmail || request.email || "client@nurses-companion.app",
        amount: amount * 100, // kobo
        currency: "NGN",
        ref: `NC-${request.id}-${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Request ID", variable_name: "request_id", value: request.id },
            { display_name: "Payment Type", variable_name: "payment_type", value: paymentType },
            { display_name: "Client Name", variable_name: "client_name", value: request.clientName || request.name || "" },
          ],
        },
        callback: async (response) => {
          try {
            const requestRef = doc(db, "requests", request.id);
            if (paymentType === "advance") {
              await updateDoc(requestRef, {
                paymentStatus: "advance_paid",
                paymentMethod: "paystack",
                advancePaid: amount,
                advancePaymentRef: response.reference,
                advancePaymentDate: serverTimestamp(),
                status: "in_progress",
                updatedAt: serverTimestamp(),
              });
            } else {
              await updateDoc(requestRef, {
                paymentStatus: "fully_paid",
                paymentMethod: "paystack",
                finalPaid: amount,
                finalPaymentRef: response.reference,
                finalPaymentDate: serverTimestamp(),
                status: "completed",
                updatedAt: serverTimestamp(),
              });
            }
            onPaymentSuccess && onPaymentSuccess(response);
          } catch (err) {
            console.error("Firestore save error:", err);
            alert("Payment received but failed to save. Contact support with ref: " + response.reference);
          } finally {
            setLoading(false);
          }
        },
        onClose: () => setLoading(false),
      });
      handler.openIframe();
    } catch (err) {
      console.error("Paystack error:", err);
      setLoading(false);
    }
  };

  // ── Manual Transfer ───────────────────────────────────────────────────────
  const copyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferSubmit = async () => {
    if (!proofNote.trim()) return alert("Please describe your transfer (amount, date, or ref).");
    setLoading(true);
    try {
      const requestRef = doc(db, "requests", request.id);
      await updateDoc(requestRef, {
        paymentStatus: paymentType === "advance" ? "advance_pending_verification" : "final_pending_verification",
        paymentMethod: "bank_transfer",
        transferProofNote: proofNote,
        transferSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also log in a separate payments collection for admin review
      await addDoc(collection(db, "pendingTransfers"), {
        requestId: request.id,
        clientName: request.clientName || request.name || "",
        clientEmail: request.clientEmail || request.email || "",
        amount,
        paymentType,
        description,
        proofNote,
        submittedAt: serverTimestamp(),
        verified: false,
      });

      setSubmitted(true);
      onPaymentSuccess && onPaymentSuccess({ method: "bank_transfer", status: "pending" });
    } catch (err) {
      console.error("Transfer submission error:", err);
      alert("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✅</div>
        <p style={styles.successTitle}>Transfer Submitted!</p>
        <p style={styles.successSub}>
          Admin will verify your payment and update your request status within a few hours.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.amountLabel}>
        Amount Due:{" "}
        <strong style={styles.amountValue}>₦{amount.toLocaleString()}</strong>
        <span style={styles.amountType}>
          {paymentType === "advance" ? " · 50% Advance" : " · Final Payment"}
        </span>
      </p>

      {/* Method Toggle */}
      <div style={styles.toggle}>
        <button
          onClick={() => setMethod("paystack")}
          style={{ ...styles.toggleBtn, ...(method === "paystack" ? styles.toggleActive : {}) }}
        >
          💳 Pay with Paystack
        </button>
        <button
          onClick={() => setMethod("transfer")}
          style={{ ...styles.toggleBtn, ...(method === "transfer" ? styles.toggleActive : {}) }}
        >
          🏦 Bank Transfer
        </button>
      </div>

      {/* Paystack */}
      {method === "paystack" && (
        <div style={styles.panel}>
          <p style={styles.panelNote}>
            Card, USSD, and bank transfer accepted. Settlement goes directly to our account daily.
          </p>
          <button
            onClick={handlePaystack}
            disabled={loading}
            style={{ ...styles.primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "⏳ Opening Paystack..." : `💳 Pay ₦${amount.toLocaleString()} via Paystack`}
          </button>
          <p style={styles.secureNote}>🔒 Secured by Paystack · SSL encrypted</p>
        </div>
      )}

      {/* Manual Transfer */}
      {method === "transfer" && (
        <div style={styles.panel}>
          <p style={styles.panelNote}>Transfer the exact amount to the account below, then confirm below.</p>

          <div style={styles.accountBox}>
            <div style={styles.accountRow}>
              <span style={styles.accountLabel}>Bank</span>
              <span style={styles.accountValue}>{BANK_ACCOUNT.bank}</span>
            </div>
            <div style={styles.accountRow}>
              <span style={styles.accountLabel}>Account No.</span>
              <span style={styles.accountValue}>
                {BANK_ACCOUNT.accountNumber}
                <button onClick={copyAccount} style={styles.copyBtn}>
                  {copied ? "✅ Copied" : "📋 Copy"}
                </button>
              </span>
            </div>
            <div style={styles.accountRow}>
              <span style={styles.accountLabel}>Account Name</span>
              <span style={styles.accountValue}>{BANK_ACCOUNT.accountName}</span>
            </div>
            <div style={styles.accountRow}>
              <span style={styles.accountLabel}>Amount</span>
              <span style={{ ...styles.accountValue, color: "var(--gold, #f0a500)", fontWeight: 700 }}>
                ₦{amount.toLocaleString()}
              </span>
            </div>
          </div>

          <p style={{ ...styles.panelNote, marginTop: 16 }}>
            After transferring, describe your payment below so admin can verify it:
          </p>
          <textarea
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            placeholder="e.g. Transferred ₦15,000 on 30 June at 2:15pm · ref: TXN123456"
            rows={3}
            style={styles.textarea}
          />

          <button
            onClick={handleTransferSubmit}
            disabled={loading || !proofNote.trim()}
            style={{
              ...styles.primaryBtn,
              background: "var(--gold, #f0a500)",
              color: "#000",
              opacity: loading || !proofNote.trim() ? 0.5 : 1,
              cursor: loading || !proofNote.trim() ? "not-allowed" : "pointer",
              marginTop: 12,
            }}
          >
            {loading ? "⏳ Submitting..." : "✅ I've Transferred — Notify Admin"}
          </button>
          <p style={styles.secureNote}>Admin will verify and activate your request within a few hours.</p>
        </div>
      )}
    </div>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    marginTop: 16,
    fontFamily: "var(--font-body, sans-serif)",
  },
  amountLabel: {
    fontSize: 14,
    color: "var(--text-muted, #888)",
    marginBottom: 12,
  },
  amountValue: {
    fontSize: 18,
    color: "var(--text, #fff)",
  },
  amountType: {
    fontSize: 12,
    color: "var(--text-muted, #888)",
  },
  toggle: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    padding: "10px 12px",
    border: "1.5px solid var(--border, #333)",
    borderRadius: "var(--radius, 8px)",
    background: "transparent",
    color: "var(--text-muted, #aaa)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-body, sans-serif)",
  },
  toggleActive: {
    border: "1.5px solid var(--gold, #f0a500)",
    color: "var(--gold, #f0a500)",
    background: "rgba(240,165,0,0.08)",
  },
  panel: {
    padding: "16px",
    background: "var(--card-bg, rgba(255,255,255,0.04))",
    borderRadius: "var(--radius, 8px)",
    border: "1px solid var(--border, #2a2a2a)",
  },
  panelNote: {
    fontSize: 13,
    color: "var(--text-muted, #888)",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  primaryBtn: {
    width: "100%",
    padding: "14px 24px",
    background: "var(--gold, #f0a500)",
    color: "#000",
    border: "none",
    borderRadius: "var(--radius, 8px)",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "var(--font-body, sans-serif)",
    transition: "all 0.2s",
  },
  secureNote: {
    textAlign: "center",
    fontSize: 11,
    color: "var(--text-muted, #666)",
    marginTop: 8,
  },
  accountBox: {
    background: "var(--bg, #0f0f0f)",
    border: "1px solid var(--border, #2a2a2a)",
    borderRadius: "var(--radius, 8px)",
    overflow: "hidden",
  },
  accountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid var(--border, #1e1e1e)",
  },
  accountLabel: {
    fontSize: 12,
    color: "var(--text-muted, #777)",
    fontWeight: 500,
  },
  accountValue: {
    fontSize: 14,
    color: "var(--text, #fff)",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  copyBtn: {
    fontSize: 11,
    padding: "3px 8px",
    border: "1px solid var(--border, #333)",
    borderRadius: 4,
    background: "transparent",
    color: "var(--text-muted, #aaa)",
    cursor: "pointer",
    fontFamily: "var(--font-body, sans-serif)",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg, #0f0f0f)",
    border: "1px solid var(--border, #333)",
    borderRadius: "var(--radius, 8px)",
    color: "var(--text, #fff)",
    fontSize: 13,
    fontFamily: "var(--font-body, sans-serif)",
    resize: "vertical",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  successBox: {
    textAlign: "center",
    padding: "24px 16px",
    background: "rgba(0,200,100,0.06)",
    border: "1px solid rgba(0,200,100,0.2)",
    borderRadius: "var(--radius, 8px)",
    marginTop: 16,
  },
  successIcon: { fontSize: 32, marginBottom: 8 },
  successTitle: { fontSize: 16, fontWeight: 700, color: "var(--text, #fff)", margin: "0 0 6px" },
  successSub: { fontSize: 13, color: "var(--text-muted, #888)", lineHeight: 1.5, margin: 0 },
};

export default PaymentComponent;
