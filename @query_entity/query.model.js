const mongoose = require("mongoose");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: [validator.isEmail, "Please enter valid email address"],
    },
    mobile: {
      type: Number,
      required: [true, "Please enter your mobile number"],
    },
    company_name: {
      type: String,
    },
    address: {
      type: String,
      required: [true, "Please enter your address"],
    },
    message: {
      type: String,
      required: [true, "Please enter your message/query"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Query", schema);
