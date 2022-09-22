const TAG = 'paymentHelper';

const crypto = require("crypto");

const RAZORPAY_CREDENTIALS = {
  key_id: "rzp_test_PUvUpKOg1jmmRK",
  key_secret: "DWduw4GkifH4sfzorCX5pJRi",
  merchant_id: "G5M2x5GFf5LDai"
};

const generateTransactionPayload = (data) => {
  let payload = {
    key: RAZORPAY_CREDENTIALS.key_id, // Enter the Key ID generated from the Dashboard
    amount: data.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: data.cuurency,
    name: "Consumer Purchase",
    description: "Alias Transaction",
    image: "https://3iomailerz.com/eximpediacms/assets/website-assets/img/sticky-logo.png",
    order_id: data.order_ref_id, // Pass the `id` obtained in the response of Step 1
    handler: null,
    prefill: {
      name: "Alex Broma",
      email: "eximpedia@gmail.com",
      contact: "8104648504"
    },
    notes: {
      order_id: data.order_id,
      receipt_uid: data.receipt_uid
    },
    theme: {
      color: "#3399cc"
    }
  };
  return payload;
};

const verifyTransactionSignature = (order_ref_id, transaction_id, signature, secret) => {
  let message = order_ref_id + '|' + transaction_id;
  let computedSignature = crypto.createHmac("sha256", secret).update(message).digest("hex");
  logger.info(">>>>>>>>>>>>>>>>>>>");
  logger.info(computedSignature);
  logger.info("<<<<<<<<<<<<<<<<<<<<");
  logger.info(signature);
  return (signature === computedSignature);
};


module.exports = {
  RAZORPAY_CREDENTIALS,
  generateTransactionPayload,
  verifyTransactionSignature
};
