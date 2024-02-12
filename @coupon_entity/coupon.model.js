const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    coupon_code: {
      type: String,
      required: [true, "Please provide coupon code"],
      unique: true,
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
    allow: {
      type: Number,
    },
    uses: {
      type: Number,
      default: 0,
    },
    expiry: {
      type: Date,
    },
    discount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", schema);
