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
    categories: {
      type: Array,
      required: [true, "Please enter category"],
    },
    language: {
      type: String,
      required: [true, "Please enter language"],
    },
    keywords: {
      type: Array,
      required: [true, "Please enter keywords"],
    },
    views: {
      type: Number,
      default: 0,
    },
    access: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", schema);
