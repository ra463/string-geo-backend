const mongoose = require("mongoose");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Types.ObjectId,
      required:[true,'Please provide reference of plan.'],
      ref:"Plan",
    },
    subscribeBy: {
        type: mongoose.Types.ObjectId,
        required:[true,'Please provide reference of subscriber.'],
        ref:"User",
    },
    subscribeOn: {
      type: Date,
      default:Date.now
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", schema);
