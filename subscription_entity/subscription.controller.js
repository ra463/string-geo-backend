const Subscription = require("./subscription.model");
const User = require("../user_entity/user.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createSubscription = catchAsyncError(async (req, res, next) => {
  const { plan } = req.body;
  if (!plan) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const subscription = await Subscription.create({
    plan,
    subscribeBy:req.userId
  });
  const user = await User.findById(req.userId);
  user.subscriptionPlans = subscription._id;
  await user.save();
  res.status(201).json({
    success: true,
    message: "Subscription completed successfully",
    subscription
  });
});
