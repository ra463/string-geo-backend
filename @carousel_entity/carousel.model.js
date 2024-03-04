const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    poster_url: {
      type: String,
      required: [true, "Please provide poster"],
    },
    video_id: {
      type: mongoose.Types.ObjectId,
      ref: "Video",
      required: [true, "Please provide video_id"],
      unique: [true, "Video already exists"],
    },
    tag: {
      required: [true, "Please provide type"],
      type: String,
      enum: ["Inner", "Outer"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Carousel", schema);
