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
    genres: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
      required: [true, "Please select genres"],
    },
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: [true, "Please select language"],
    },
    category: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
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
      default: "paid",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", schema);
