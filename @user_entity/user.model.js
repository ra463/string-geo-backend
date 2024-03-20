const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: [true, "Email already exists"],
      validate: [validator.isEmail, "Please enter valid email address"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password must be atleast 8 characters"],
      trim: true,
      select: false,
    },
    country_code: {
      type: String,
      required: [true, "Please enter your country code"],
    },
    mobile: {
      type: Number,
      trim: true,
    },
    avatar: {
      type: String,
      default:
        "uploads/user-65e5b4c51dec04256212b52d/profile/1710134355730-images.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: String,
    },
    address: {
      type: String,
    },
    states: {
      type: String,
      // required: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      // required: true,
    },
    temp_code: {
      type: String,
    },
    device_ids: [{ type: String }],
    watch_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    attempts: {
      type: Number,
      default: 0,
    },
    is_frozen: {
      type: Boolean,
      default: false,
    },
    last_attempt: {
      type: Date,
    },
    pincode: { type: Number },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

schema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

schema.methods.getAccessToken = async function () {
  if (this.role === "user") {
    return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  } else {
    return jwt.sign({ userId: this._id }, process.env.JWT_SECRET);
  }
};

schema.methods.getRefreshToken = async function () {
  return jwt.sign({ userId: this._id }, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE,
  });
};

module.exports = mongoose.model("User", schema);
