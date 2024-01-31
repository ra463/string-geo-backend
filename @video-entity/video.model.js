const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter title"],
    },
    description: {
      type: String,
      required: [true, "Please enter description"],
    },
    thumbnail_url: {
      type: String,
      required: [true, "Please enter thumbnail"],
    },
    video_url: {
      type: String,
      required: [true, "Please enter video url"],
    },
    category: {
      type: String,
      required: [true, "Please enter category"],
    },
    language: {
      type: String,
      required: [true, "Please enter language"],
    },
    keywords: {
      type: String,
      required: [true, "Please enter keywords"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", schema);
