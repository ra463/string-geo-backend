const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    order_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    plan_type_id: {
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
    price: {
      type: Number,
    },
    validity: {
      type: Number,
    },
    expiry_date: {
      type: Date,
    },
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", schema);
