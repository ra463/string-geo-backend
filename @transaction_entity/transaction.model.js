const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    razorpay_payment_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", schema);
