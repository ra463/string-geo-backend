const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    order_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    plan_name: {
      type: String,
    },
    allow_devices: {
      type: Number,
    },
    plan_type: {
      type: String,
    },
    usd_price: {
      type: Number,
    },
    inr_price: {
      type: Number,
    },
    expiry_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Expire", "Pending", "Upcoming"],
    },
    start_date: {
      type: Date,
    },
    is_upgrade: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", schema);
