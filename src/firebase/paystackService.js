// src/firebase/paystackService.js
// Paystack inline payment integration

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export const loadPaystack = () => {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

export const initiatePayment = async ({ email, amount, orderId, type, onSuccess, onClose }) => {
  await loadPaystack();
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_KEY,
    email,
    amount: amount * 100, // Paystack uses kobo
    currency: 'NGN',
    ref: `${orderId}_${type}_${Date.now()}`,
    metadata: { orderId, paymentType: type },
    callback: (response) => onSuccess(response),
    onClose: () => onClose && onClose(),
  });
  handler.openIframe();
};
