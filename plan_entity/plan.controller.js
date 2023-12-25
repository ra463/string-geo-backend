const Plan = require("./plan.model");

const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, allowDevices, validity } = req.body;
  if (!price || !validity) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const plan = await Plan.create({
    price,
    validity,
    allowDevices,
  });

  res.status(201).json({
    success: true,
    message: "New Plan created successfully",
    plan
  });
});
