const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide genre name"],
      unique: [true, "Genre already exists"],
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Genre", schema);
