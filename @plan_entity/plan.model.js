const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide plan type"],
      unique: [true, "Plan Name already exist!"],
    },
    allow_devices: {
      type: Number,
      required: [true, "Please provide number of devices allowed"],
    },
    prices: [
      {
        plan_type: {
          type: String,
          enum: ["monthly", "annual"],
          required: true,
        },
        inr_price: {
          type: Number,
          required: true,
        },
        usd_price: {
          type: Number,
        },
        validity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plan", schema);
