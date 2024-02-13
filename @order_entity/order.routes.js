const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createOrder,
  verifyPayment,
  paymentWebhook,
  getAPIKey,
  createPayapalOrder,
  capturePaypalOrder,
  paypalPaymentWebhook,
} = require("./order.controller");
const router = express.Router();

router.post("/create-order", auth, createOrder);
router.get("/get-key", auth, getAPIKey);
router.post("/verify-signature", verifyPayment);
router.post("/create-paypal-order", auth, createPayapalOrder);
router.post("/capture-payment/:orderId", auth, capturePaypalOrder);
router.post("/payment-webhook", paymentWebhook);
router.post("/paypal-payment-webhook", paypalPaymentWebhook);

module.exports = router;
