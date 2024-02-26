const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trailer", schema);
