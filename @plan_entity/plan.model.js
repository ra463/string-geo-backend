const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: [true, "Please enter price of plan"],
    },
    allow_devices: {
      type: Number,
      required: [true, "Please provide number of devices allowed"],
    },
    validity: {
      type: Number,
      required: [true, "Please provide validity of plan"],
    },
    description: {
      type: String,
      required: [true, "Please provide description of plan"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plan", schema);
