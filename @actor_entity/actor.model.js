const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    profile_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Actor", schema);
