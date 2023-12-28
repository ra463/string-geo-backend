const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createOrder,
  verifyPayment,
  paymentWebhook,
} = require("./order.controller");
const router = express.Router();

router.post("/create-order", auth, createOrder);
router.post("/verify-signature", auth, verifyPayment);
router.post("/payment-webhook", paymentWebhook);

module.exports = router;
