const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createOrder,
  verifyPayment,
  paymentWebhook,
  sendKey,
} = require("./order.controller");
const router = express.Router();

router.post("/create-order", auth, createOrder);
router.post("/verify-signature", verifyPayment);
router.post("/payment-webhook", paymentWebhook);
router.get("/key", sendKey);

module.exports = router;
