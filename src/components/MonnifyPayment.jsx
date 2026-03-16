import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config"; // ← adjust if your firebase config path is different
import useMonnify from "../hooks/useMonnify";

const MonnifyPayment = ({ request, paymentType, onPaymentSuccess }) => {
  const { initializePayment } = useMonnify();
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const totalPrice = request.agreedPrice || request.proposedPrice || 0;
  const advanceAmount = Math.ceil(totalPrice * 0.5);
  const finalAmount = totalPrice - (request.advancePaid || 0);
  const amount = paymentType === "advance" ? advanceAmount : finalAmount;

  const description =
    paymentType === "advance"
      ? `50% Advance - ${request.serviceTitle || request.topicTitle || "Research Service"}`
      : `Final 50% - ${request.serviceTitle || request.topicTitle || "Research Service"}`;

  const handlePayment = () => {
    if (!amount || amount <= 0) {
      alert("Invalid payment amount.");
      return;
    }
    setLoading(true);
    try {
      initializePayment({
        amount,
        customerName: request.clientName || request.name || "Client",
        customerEmail: request.clientEmail || request.email || "",
        customerPhone: request.clientPhone || "",
        description,
        metadata: {
          requestId: request.id,
          paymentType,
          clientId: request.clientId || request.userId,
        },
        onSuccess: async (response) => {
          try {
            const requestRef = doc(db, "requests", request.id);
            if (paymentType === "advance") {
              await updateDoc(requestRef, {
                paymentStatus: "advance_paid",
                advancePaid: amount,
                advancePaymentRef: response.transactionReference,
                advancePaymentDate: serverTimestamp(),
                status: "in_progress",
                updatedAt: serverTimestamp(),
              });
            } else {
              await updateDoc(requestRef, {
                paymentStatus: "fully_paid",
                finalPaid: amount,
                finalPaymentRef: response.transactionReference,
                finalPaymentDate: serverTimestamp(),
                status: "completed",
                updatedAt: serverTimestamp(),
              });
            }
            onPaymentSuccess && onPaymentSuccess(response);
          } catch (err) {
            console.error("Error saving payment:", err);
            alert(
              "Payment received but failed to save. Contact support with ref: " +
              response.transactionReference
            );
          } finally {
            setLoading(false);
          }
        },
        onClose: () => setLoading(false),
      });
    } catch (err) {
      console.error("Payment error:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: loading ? "var(--border)" : "var(--gold)",
          color: loading ? "var(--text-muted)" : "#000",
          border: "none",
          borderRadius: "var(--radius)",
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "var(--font-body)",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {loading
          ? "⏳ Opening payment..."
          : `💳 Pay ₦${amount.toLocaleString()} ${paymentType === "advance" ? "(50% Advance)" : "(Final Payment)"}`}
      </button>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        Secured by Monnify · Card & Bank Transfer accepted
      </p>
    </div>
  );
};

export default MonnifyPayment;
