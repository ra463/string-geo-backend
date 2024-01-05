const Plan = require("./plan.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, description } = req.body;
  if (!price || !validity || !description) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  await Plan.create({
    price,
    validity,
    // allow_devices,
    description,
  });

  res.status(201).json({
    success: true,
    message: "New Plan Created Successfully",
  });
});
