const User = require("./user.model");
const { generateCode } = require("../utils/generateCode");
// const ip = require("ip");
const {
  sendVerificationCode,
  sendForgotPasswordCode,
} = require("../utils/sendEmail");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const userModel = require("./user.model");

const sendData = async (res, statusCode, user, message) => {
  const accessToken = await user.getAccessToken();
  const refreshToken = await user.getRefreshToken();
  if (user.subscription_plans.plan_name) {
    user.device_ids.push(refreshToken);
    await user.save();
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
  } = req.body;
  if (
    !name ||
    !email ||
    !password ||
    !confirmPassword ||
    !mobile ||
    !states ||
    !country ||
    !city
  ) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  if (password.length < 8)
    return next(new ErrorHandler("Password must be atleast 8 characters", 400));
  if (mobile.length !== 10)
    return next(new ErrorHandler("Mobile number must be 10 digits", 400));

  if (password !== confirmPassword)
    return next(new ErrorHandler("Confirm Password does not match", 400));

  let user1 = await User.findOne({
    email: { $regex: new RegExp(email, "i") },
  });
  if (user1) return next(new ErrorHandler("Email already exists", 400));
  let user2 = await User.findOne({ mobile });
  if (user2) return next(new ErrorHandler("Mobile number already exists", 400));
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    mobile,
    states,
    country,
    city,
  });

  const code = generateCode();
  await sendVerificationCode(user.email, code);

  user.temp_code = code;
  await user.save();

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

  if (
    user.subscription_plans.plan_name &&
    user.subscription_plans.allow_devices <= user.device_ids.length
  ) {
    return next(
      new ErrorHandler(
        "Maximum device login limit is reached, please Logout from one of your device",
        429
      )
    );
  }

  //set unsuccessfull attempts to 0 as user login successfully
  if (user.attempts) {
    user.attempts = 0;
    await user.save();
  }

  sendData(res, 200, user, `Hey ${user.name}! Welcome Back`);
};

exports.loginUser = catchAsyncError(async (req, res, next) => {
  // console.log(req.ip, req.connection.remoteAddress);
  // const clientIp = req.clientIp;
  // console.log("in this route")
  const { email, mobile, password, google_login, logout_from_other_device } =
    req.body;

  if (google_login) return await loginGoogle(req, res, next);
  if (!email && !mobile)
    return next(new ErrorHandler("Please Enter Email or Mobile Number", 400));
  if (!password) return next(new ErrorHandler("Please Enter Password", 400));
  const user = await User.findOne({
    $or: [{ email: { $regex: new RegExp(`^${email}$`, "i") } }, { mobile }],
  }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid Credentials", 400));

  //check if user try to login with new device & the max device login acc to subscription plan
  // if (
  //   user.subscription_plans &&
  //   !user.device_ids.includes(clientIp) &&
  //   user.subscription_plans.allow_devices == user.device_ids.length
  // ) {
  //   return next(new ErrorHandler("Maximum device login limit is reached", 429));
  // }

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

  if (
    user.subscription_plans.plan_name &&
    user.subscription_plans.allow_devices <= user.device_ids.length
  ) {
    return next(
      new ErrorHandler(
        "Maximum device login limit is reached, please Logout from one of your device",
        429
      )
    );
  }

  //set unsuccessfull attempts to 0 as user login successfully
  if (user.attempts) {
    user.attempts = 0;
    await user.save();
  }

  sendData(res, 200, user, `Hey ${user.name}! Welcome Back`);
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

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword)
    return next(new ErrorHandler("Please enter all fields", 400));

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
    mobile: user.mobile,
    avatar: user.avatar,
    role: user.role,
    dob: user.dob,
    states: user.states,
    country: user.country,
    city: user.city,
    subscription_plans: user.subscription_plans,
  };
  res.status(200).json({
    success: true,
    data,
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email, mobile, dob } = req.body;

  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  const user_1 = await User.findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });
  if (user_1 && user_1._id.toString() !== user._id.toString())
    return next(new ErrorHandler("User with this email already exists", 400));

  const user_2 = await User.findOne({ mobile });
  if (user_2 && user_2._id.toString() !== user._id.toString()) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (mobile) user.mobile = mobile;
  if (dob) user.dob = dob;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User Updated Successfully",
  });
});

exports.getMyPlan = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return next(new ErrorHandler("User not Found", 400));

  if (!user.subscription_plans.plan_name) {
    return res.status(200).json({
      success: true,
      data: null,
    });
  } else {
    return res.status(200).json({
      success: true,
      data: user.subscription_plans,
    });
  }
});

exports.logout = catchAsyncError(async (req, res, next) => {
  // const clientIp = req.clientIp;
  const { refreshToken } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("Unauthorize", 401));

  // pull the clientId from the user devices_id array
  // console.log(req.headers.authorization.split(" ")[1]);
  if (user.subscription_plans.plan_name) {
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

  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not Found", 400));

  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: "Account Deleted Successfully",
  });
});
