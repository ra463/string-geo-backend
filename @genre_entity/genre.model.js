const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique:true
    },
    status: {
      type: String,
      default:"Active",
      enum:["Active","Inactive"]
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Genre", schema);
