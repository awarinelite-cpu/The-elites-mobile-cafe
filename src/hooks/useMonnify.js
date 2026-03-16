const useMonnify = () => {
  const initializePayment = ({
    amount,
    customerName,
    customerEmail,
    customerPhone,
    description,
    metadata = {},
    onSuccess,
    onClose,
  }) => {
    if (!window.MonnifySDK) {
      alert("Payment system not ready. Please refresh and try again.");
      return;
    }

    const reference = `ELITES_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    window.MonnifySDK.initialize({
      amount: amount,
      currency: "NGN",
      reference: reference,
      customerFullName: customerName,
      customerEmail: customerEmail,
      customerMobileNumber: customerPhone || "",
      apiKey: import.meta.env.VITE_MONNIFY_API_KEY,
      contractCode: import.meta.env.VITE_MONNIFY_CONTRACT_CODE,
      paymentDescription: description,
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
      metadata: { ...metadata, reference },
      onLoadStart: () => console.log("Monnify loading..."),
      onLoadComplete: () => console.log("Monnify ready"),
      onComplete: (response) => {
        console.log("Payment response:", response);
        if (response.paymentStatus === "PAID" || response.paymentStatus === "OVERPAID") {
          onSuccess && onSuccess({ ...response, localReference: reference });
        } else {
          alert(`Payment not completed. Status: ${response.paymentStatus}`);
        }
      },
      onClose: (data) => {
        console.log("Modal closed:", data);
        onClose && onClose(data);
      },
    });
  };

  return { initializePayment };
};

export default useMonnify;
