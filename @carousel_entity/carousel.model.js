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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Carousel", schema);
