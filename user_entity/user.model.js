const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      trim: true,
      select: false,
    },
    mobile: {
      type: Number,
      required: [true, "Please enter your mobile number"],
      unique: true,
    },
    avatar: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh1MxDvWeEQ39D04ETGLuJ_pnSkd_gZf47R7qkQaxbHotxVs-aBvYjsHmbvxcKhTGn9gI&usqp=CAU",
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: String,
    },
    states: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    temp_code: {
      type: String,
    },
    deviceIds: [
      {
        type: String,
      },
    ],
    subscriptionPlans: {
      type: mongoose.Types.ObjectId,
      ref: "Subscription",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    lastAttempt: {
      type: Date,
    },
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
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

schema.methods.getRefreshToken = async function () {
  return jwt.sign({ userId: this._id }, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE,
  });
};

module.exports = mongoose.model("User", schema);
