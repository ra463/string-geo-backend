const User = require("./user.model");
const Video = require("../@video-entity/video.model");
const { generateCode } = require("../utils/generateCode");
const {
  sendVerificationCode,
  sendForgotPasswordCode,
  sendInvoice,
} = require("../utils/sendEmail");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const userModel = require("./user.model");
const { s3Uploadv4 } = require("../utils/s3");
const dotenv = require("dotenv");
const Order = require("../@order_entity/order.model");

dotenv.config({ path: "../config/config.env" });

const isStrongPassword = (password) => {
  const uppercaseRegex = /[A-Z]/;
  const lowercaseRegex = /[a-z]/;
  const numericRegex = /\d/;
  const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;

  if (
    uppercaseRegex.test(password) &&
    lowercaseRegex.test(password) &&
    numericRegex.test(password) &&
    specialCharRegex.test(password)
  ) {
    return true;
  } else {
    return false;
  }
};

const sendData = async (res, statusCode, user, message, isActivePlan) => {
  const accessToken = await user.getAccessToken();
  const refreshToken = await user.getRefreshToken();
  if (isActivePlan) {
    user.device_ids.push(refreshToken);
    await user.save();
    user.isActivePlan = isActivePlan;
  }

  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    refreshToken,
    message,
  });
};

exports.registerUser = catchAsyncError(async (req, res, next) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    mobile,
    states,
    country,
    city,
    country_code,
  } = req.body;

  if (!isStrongPassword(password)) {
    return next(
      new ErrorHandler(
        "Password must contain one Uppercase, Lowercase, Numeric and Special Character",
        400
      )
    );
  }

  if (password !== confirmPassword)
    return next(new ErrorHandler("Confirm Password does not match", 400));

  const user_exist = await User.findOne({
    $or: [{ email: { $regex: new RegExp(email, "i") } }, { mobile }],
  });

  if (user_exist && user_exist.is_verified) {
    return next(
      new ErrorHandler(
        `${user_exist.email ? "Email" : "Mobile"} already exists`,
        400
      )
    );
  }

  let user;
  if (!user_exist) {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      mobile,
      states,
      country,
      city,
      country_code,
    });
  } else {
    user_exist.name = name;
    user_exist.password = password;
    user_exist.mobile = mobile;
    user_exist.states = states;
    user_exist.country = country;
    user_exist.city = city;
    user_exist.country_code = country_code;
    user = user_exist;
  }

  const code = generateCode();
  user.temp_code = code;
  await user.save();
  await sendVerificationCode(user.email, code);

  user.password = undefined;
  res.status(200).json({
    success: true,
    message: "Account Verification Code sent successfully",
  });
});

exports.verifyAccount = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  if (!email || !code)
    return next(new ErrorHandler("Please enter all fields", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User does not exist", 400));

  if (user.is_verified === true)
    return next(new ErrorHandler("Account already verified", 400));

  if (user.temp_code !== code)
    return next(new ErrorHandler("Invalid/Expired Code", 400));

  user.is_verified = true;
  user.temp_code = null;
  await user.save();

  sendData(res, 200, user, `Account Verified successfully`);
});

const loginGoogle = async (req, res, next) => {
  const { email, logout_from_other_device } = req.body;
  if (!email) return next(new ErrorHandler("Please enter email", 400));

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });

  if (!user) return next(new ErrorHandler("User not found", 404));
  if (!user.is_verified) {
    return next(new ErrorHandler("Account Not Found", 400));
  }
  if (user.is_frozen) {
    const last_attempt = user.last_attempt.getTime();
    const current = Date.now();
    if (current - last_attempt > parseInt(process.env.FROZEN_TIME)) {
      user.is_frozen = false;
      user.attempts = 0;
      user.last_attempt = null;
      await user.save();
    } else {
      return next(
        new ErrorHandler(
          "Your Account is temporary freeze due to too many unsuccessfull attempt, try after 5 minutes",
          423
        )
      );
    }
  }

  if (logout_from_other_device) {
    if (user.device_ids.length > 0) user.device_ids.shift();
    await user.save();
  }

  const order = await Order.findOne({ user: user._id, status: "Active" });
  if (order && order.allow_devices === user.device_ids.length) {
    return next(
      new ErrorHandler(
        "Maximum device login limit is reached, please Logout from one of your device",
        429
      )
    );
  }

  let isActivePlan = false;
  if (order) {
    isActivePlan = true;
  }

  //set unsuccessfull attempts to 0 as user login successfully
  if (user.attempts) {
    user.attempts = 0;
    await user.save();
  }

  sendData(res, 200, user, `Hey ${user.name}! Welcome Back`, isActivePlan);
};

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, mobile, password, google_login, logout_from_other_device } =
    req.body;

  if (google_login) return await loginGoogle(req, res, next);

  if (!email && !mobile)
    return next(new ErrorHandler("Please Enter Email or Mobile Number", 400));
  if (!password) return next(new ErrorHandler("Please Enter Password", 400));

  const user = await User.findOne({
    $or: [{ email: { $regex: new RegExp(`^${email}$`, "i") } }, { mobile }],
  }).select("+password");
  if (!user) return next(new ErrorHandler("Account Not Found", 400));
  if (!user.is_verified) {
    return next(new ErrorHandler("Account Not Found", 400));
  }

  //check if user account is freeze
  if (user.is_frozen) {
    const last_attempt = user.last_attempt.getTime();
    const current = Date.now();
    if (current - last_attempt > parseInt(process.env.FROZEN_TIME)) {
      user.is_frozen = false;
      user.attempts = 0;
      user.last_attempt = null;
      await user.save();
    } else {
      return next(
        new ErrorHandler(
          "Your Account is temporary freeze due to too many unsuccessfull attempt, try after 5 minutes",
          423
        )
      );
    }
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    user.attempts += 1;
    await user.save();
    if (user.attempts === parseInt(process.env.MAX_UNSUCCESSFULL_ATTEMPT)) {
      user.is_frozen = true;
      user.last_attempt = new Date();
      await user.save();
      return next(new ErrorHandler("Too many unsuccessfull attempt", 423));
    }
    return next(new ErrorHandler("Invalid Credentials", 400));
  }

  if (logout_from_other_device) {
    if (user.device_ids.length > 0) user.device_ids.shift();
    await user.save();
  }

  const order = await Order.findOne({ user: user._id, status: "Active" });
  if (order && order.allow_devices === user.device_ids.length) {
    return next(
      new ErrorHandler(
        "Maximum device login limit is reached, please Logout from one of your device",
        429
      )
    );
  }

  let isActivePlan = false;
  if (order) {
    isActivePlan = true;
  }

  //set unsuccessfull attempts to 0 as user login successfully
  if (user.attempts) {
    user.attempts = 0;
    await user.save();
  }

  sendData(res, 200, user, `Hey ${user.name}! Welcome Back`, isActivePlan);
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please enter your email", 400));

  const user = await User.findOne({ email }).lean();
  if (!user) return next(new ErrorHandler("User does not exist", 400));

  const code = generateCode();

  await User.findOneAndUpdate({ email }, { temp_code: code });
  await sendForgotPasswordCode(user.name, user.email, code);

  res.status(200).json({
    success: true,
    message: "Password Reset Code sent successfully",
  });
});

exports.validateCode = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  if (!email || !code) return next(new ErrorHandler("Code is required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User does not exist", 400));

  if (user.temp_code !== code)
    return next(new ErrorHandler("Invalid/Expired Code", 400));

  user.temp_code = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Code Validated successfully",
  });
});

exports.resendOtp = catchAsyncError(async (req, res, next) => {
  const { email, forgotPassword } = req.body;
  if (!email) return next(new ErrorHandler("Please enter email", 400));

  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("User does not exist", 400));
  if (!user.is_verified && forgotPassword) {
    return next(new ErrorHandler("Account Not Found", 400));
  }

  if (user.is_verified === true && !forgotPassword)
    return next(new ErrorHandler("Account already verified", 400));

  const code = generateCode();
  user.temp_code = code;
  await user.save();
  await sendVerificationCode(user.email, code);
  res.status(200).json({
    success: true,
    message: "Code send Successfully",
  });
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword)
    return next(new ErrorHandler("Please enter all fields", 400));

  if (!isStrongPassword(password)) {
    return next(
      new ErrorHandler(
        "Password must contain one Uppercase, Lowercase, Numeric and Special Character",
        400
      )
    );
  }

  if (password.length < 8)
    return next(new ErrorHandler("Password must be atleast 8 characters", 400));

  if (password !== confirmPassword)
    return next(new ErrorHandler("Confirm Password does not match", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("User does not exist", 400));

  const isMatch = await user.matchPassword(password);

  if (isMatch) {
    return next(
      new ErrorHandler("New Password cannot be same as old password", 400)
    );
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Reset successfully",
  });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword)
    return next(new ErrorHandler("Please enter all fields", 400));

  if (!isStrongPassword(newPassword)) {
    return next(
      new ErrorHandler(
        "Password must contain one Uppercase, Lowercase, Numeric and Special Character",
        400
      )
    );
  }

  if (newPassword.length < 8)
    return next(new ErrorHandler("Password must be atleast 8 characters", 400));

  if (newPassword !== confirmPassword)
    return next(new ErrorHandler("Confirm Password does not match", 400));

  const user = await User.findById(req.userId).select("+password");
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const isMatch = await user.matchPassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid Old Password", 400));
  }

  if (isMatch && oldPassword === newPassword)
    return next(
      new ErrorHandler("New Password cannot be same as old password", 400)
    );

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated successfully",
  });
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const data = {
    name: user.name,
    email: user.email,
    country_code: user.country_code,
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role,
    dob: user.dob,
    states: user.states,
    country: user.country,
    city: user.city,
  };

  res.status(200).json({
    success: true,
    data,
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email, mobile, dob, country_code } = req.body;

  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const existing_user = await User.findOne({
    $or: [{ email: { $regex: new RegExp(`^${email}$`, "i") } }, { mobile }],
  });

  if (existing_user && existing_user._id.toString() !== user._id.toString()) {
    return next(
      new ErrorHandler(
        `${existing_user.email ? "Email" : "Mobile number"} already exists`,
        400
      )
    );
  }

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (mobile) user.mobile = mobile;
  if (dob) user.dob = dob;
  if (country_code) user.country_code = country_code;

  await user.save();

  const data = {
    name: user.name,
    email: user.email,
    country_code: user.country_code,
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role,
    dob: user.dob,
    states: user.states,
    country: user.country,
    city: user.city,
  };

  res.status(200).json({
    success: true,
    message: "User Updated Successfully",
    data,
  });
});

exports.getMyPlan = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const active_plan = await Order.findOne({ user: user._id, status: "Active" });

  return res.status(200).json({
    success: true,
    data: active_plan ? active_plan : null,
  });
});

exports.updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const file = req.file;
  if (!file) return next(new ErrorHandler("Please upload an image", 400));

  const result = await s3Uploadv4(file, user._id);
  const location = result.Location && result.Location;

  user.avatar = location;
  await user.save();

  const data = {
    name: user.name,
    email: user.email,
    country_code: user.country_code,
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role,
    dob: user.dob,
    states: user.states,
    country: user.country,
    city: user.city,
  };

  res.status(200).json({
    success: true,
    message: "Profile Picture Uploaded successfully",
    data,
  });
});

exports.addVideoToWatchlist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const { videoId } = req.body;
  if (!videoId) return next(new ErrorHandler("Please provide video id", 400));

  const video = await Video.findById(videoId);
  if (!video) return next(new ErrorHandler("Video not Found", 400));

  if (user.watch_list.length === 0) {
    user.watch_list.push(video._id);
  } else {
    if (user.watch_list.includes(video._id)) {
      return next(new ErrorHandler("Video already in watch list", 400));
    }
    user.watch_list.push(video._id);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Video added to watch list",
  });
});

exports.removeVideoFromWatchlist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const { videoId } = req.body;
  if (!videoId) return next(new ErrorHandler("Please provide video id", 400));

  const video = await Video.findById(videoId);
  if (!video) return next(new ErrorHandler("Video not Found", 400));

  if (!user.watch_list.includes(video._id)) {
    return next(new ErrorHandler("Video not in watch list", 400));
  }

  user.watch_list = user.watch_list.filter(
    (data) => data.toString() !== video._id.toString()
  );

  await user.save();

  res.status(200).json({
    success: true,
    message: "Video removed from watch list",
  });
});

exports.getWatchList = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId).populate({
    path: "watch_list",
    select:
      "category title description thumbnail_url createdAt category genres language keywords",
    populate: [
      {
        path: "category",
        select: "name",
      },
      {
        path: "genres",
        select: "name",
      },
      {
        path: "language",
        select: "name",
      },
    ],
  });
  if (!user) return next(new ErrorHandler("User not Found", 400));

  res.status(200).json({
    success: true,
    watch_list: user.watch_list,
  });
});

exports.logout = catchAsyncError(async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("Unauthorize", 401));

  const order = await Order.findOne({ user: user._id, status: "Active" });
  if (order) {
    user.device_ids = user.device_ids.filter((data) => data != refreshToken);
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

exports.logoutFromFirstDevice = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $pop: { arrayField: -1 } },
    { new: true }
  );

  if (!user) return next(new ErrorHandler("User Not Found", 404));

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  res.status(200).json({
    success: true,
    message: "Account Deleted Successfully",
  });
});

exports.sendInvoice = catchAsyncError(async (req, res, next) => {
  req.userId = "Rachit Patel";
  const data = await sendInvoice(
    {
      name: "Shobhit",
      email: "shobhitchoudhary745@gmail.com",
      _id: "demoidvgvgvg",
    },
    { amount: 99, razorpay_payment_id: "randomid" }
  );

  const location = await s3Uploadv4(data, "dummyuserid");
  res.status(200).json({
    success: true,
    location,
    data,
  });
});
