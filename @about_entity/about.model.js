const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    image_url: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("About", schema);
