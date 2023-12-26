const mongoose = require("mongoose");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Plan",
    },
    subscribe_by: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    subscribe_on: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", schema);
