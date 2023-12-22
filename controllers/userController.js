const User = require("../models/User");
const { generateCode } = require("../utils/generateCode");
const {
  sendVerificationCode,
  sendForgotPasswordCode,
} = require("../utils/sendEmail");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

const sendData = async (res, statusCode, user, message) => {
  const accessToken = await user.getAccessToken();
  const refreshToken = await user.getRefreshToken();
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
    district,
    city,
  } = req.body;
  if (
    !name ||
    !email ||
    !password ||
    !confirmPassword ||
    !mobile ||
    !states ||
    !district ||
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

  let user = await User.findOne({ email });
  let user2 = await User.findOne({ mobile });
  if (user) return next(new ErrorHandler("Email address already exists", 400));
  if (user2) return next(new ErrorHandler("Mobile number already exists", 400));
  user = await User.create({
    name,
    email,
    password,
    mobile,
    states,
    district,
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

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, mobile, password } = req.body;

  if (!email && !mobile)
    return next(new ErrorHandler("Please Enter Email or Mobile Number", 400));
  if (!password) return next(new ErrorHandler("Please Enter Password", 400));

  const isEmail = email ? true : false;
  const isMobile = mobile ? true : false;

  let user = null;

  if (isEmail === true) {
    user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("Invalid Credentials", 400));

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return next(new ErrorHandler("Invalid Credentials", 400));
  } else if (isMobile === true) {
    user = await User.findOne({ mobile }).select("+password");
    if (!user) return next(new ErrorHandler("Invalid Credentials", 400));

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return next(new ErrorHandler("Invalid Credentials", 400));
  }

  user.password = undefined;
  sendData(res, 200, user, `Hey ${user.name}! Welcome Back`);
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please enter your email", 400));

  const user = await User.findOne({ email });
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
