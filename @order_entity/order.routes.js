const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createOrder,
  verifyPayment,
  paymentWebhook,
  getAPIKey,
} = require("./order.controller");
const router = express.Router();

router.post("/create-order", auth, createOrder);
router.get("/get-key", auth, getAPIKey);
router.post("/verify-signature", verifyPayment);
router.post("/payment-webhook", paymentWebhook);

module.exports = router;
