const mongoose = require("mongoose");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required:[true,'Please enter price of plan.'],
    },
    allowDevices: {
        type: Number,
        default:1
    },
    validity: {
      type: Number,
      required:[true,'Please provide validity of plan.']
    },
  },
  { 
    timestamps: true,
  }
);

module.exports = mongoose.model("Plan", schema);
