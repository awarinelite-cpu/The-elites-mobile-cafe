// src/firebase/paystackService.js
// ── Now powered by Monnify for instant settlement ──
// All existing imports of loadPaystack / initiatePayment work unchanged

const MONNIFY_API_KEY  = import.meta.env.VITE_MONNIFY_API_KEY;   // MK_PROD_XXXXXXXXXX
const MONNIFY_CONTRACT = import.meta.env.VITE_MONNIFY_CONTRACT;  // your contract code
const IS_TEST          = import.meta.env.VITE_MONNIFY_TEST === 'true';

// ── Load Monnify SDK (exported as loadPaystack so no imports break) ──────
export const loadPaystack = () => {
  return new Promise((resolve, reject) => {
    if (window.MonnifySDK) { resolve(); return; }
    const script    = document.createElement('script');
    script.src      = 'https://sdk.monnify.com/plugin/monnify.js';
    script.onload   = resolve;
    script.onerror  = () => reject(new Error('Failed to load Monnify SDK'));
    document.head.appendChild(script);
  });
};

// ── Initiate payment — same signature as before ──────────────────────────
export const initiatePayment = async ({
  email, amount, orderId, type, onSuccess, onClose,
  customerName = '',   // optional: pass client full name if available
}) => {
  await loadPaystack();

  if (!MONNIFY_API_KEY || !MONNIFY_CONTRACT) {
    alert('Payment is not configured. Please contact admin.');
    return;
  }

  window.MonnifySDK.initialize({
    amount,                     // ✅ Naira directly — Monnify does NOT use kobo
    currency:           'NGN',
    reference:          `${orderId}_${type}_${Date.now()}`,
    customerFullName:   customerName || email.split('@')[0],
    customerEmail:      email,
    apiKey:             MONNIFY_API_KEY,
    contractCode:       MONNIFY_CONTRACT,
    paymentDescription: `${type} — Order ${orderId}`,
    isTestMode:         IS_TEST,

    // Accept cards, bank transfer, USSD and mobile money
    paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD', 'PHONE_NUMBER'],

    onLoadStart:    () => {},
    onLoadComplete: () => {},

    onComplete: (response) => {
      if (response.paymentStatus === 'PAID') {
        // Normalised to match Paystack shape so all existing onSuccess handlers work
        onSuccess({
          reference:     response.paymentReference,
          trans:         response.transactionReference,
          status:        'success',
          message:       'Approved',
          // Monnify-specific extras (useful for admin records)
          monnifyRef:    response.transactionReference,
          paymentMethod: response.paymentMethod,
          amountPaid:    response.amountPaid,
          paidOn:        response.paidOn,
        });
      }
    },

    onClose: (data) => {
      onClose && onClose(data);
    },
  });
};
