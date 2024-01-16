const Transaction = require("../@transaction_entity/transaction.model");
const User = require("../@user_entity/user.model");
const APIFeatures = require("../utils/apiFeatures");
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

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  let query = {};
  if (req.query.plan_name !== "all") query.plan_name = req.query.plan_name;
  if (req.query.plan_type !== "all") query.plan_type = req.query.plan_type;

  const userCount = await User.countDocuments();

  const apiFeatures = new APIFeatures(
    User.find(query).sort({ createdAt: -1 }),
    req.query
  ).search("name");

  let users = await apiFeatures.query;

  const filteredUsers = users.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    let resultPerPage = Number(req.query.resultPerPage);
    let currentPage = Number(req.query.currentPage);

    let skip = resultPerPage * (currentPage - 1);
    users = await users.slice(skip, skip + resultPerPage);
  }

  res.status(200).json({
    success: true,
    filteredUsers,
    users,
    userCount,
  });
});

exports.getUserSubscriptionHistory = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transaction = await Transaction.find({ user: user._id })
    .populate({
      path: "order",
      select: "plan plan_type",
      populate: {
        path: "plan",
        select: "name",
      },
    })
    .lean();

  const userData = {
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    avatar: user.avatar,
    address: user.city + " " + user.district + " " + user.states,
    subscriptionHistory: transaction,
  };

  res.status(200).json({
    success: true,
    data: userData,
  });
});
