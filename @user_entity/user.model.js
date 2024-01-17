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
    device_ids: [
      {
        type: String,
      },
    ],
    subscription_plans: {
      plan_name: {
        type: String,
      },
      allow_devices: {
        type: Number,
      },
      plan_type: {
        type: String,
      },
      price: {
        type: Number,
      },
      validity: {
        type: Number,
      },
      expiry_date: {
        type: Date,
      },
    },
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
