const User = require("../@user_entity/user.model");
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

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter email & password", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  if (user.role !== "admin")
    return next(
      new ErrorHandler("You are not authorized to access this route", 403)
    );

  const isPasswordMatched = await user.matchPassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password", 401));

  sendData(res, 200, user, "Admin Logged In");
});
