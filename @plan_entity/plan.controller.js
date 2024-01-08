const Plan = require("./plan.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, allow_devices, description } = req.body;
  if (!price || !validity || !description || !allow_devices) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  if (price < 0 || isNaN(price))
    return next(new ErrorHandler("Price must be a positive number", 400));

  if (validity < 0 || isNaN(validity))
    return next(new ErrorHandler("Validity must be a positive number", 400));

  if (allow_devices < 0 || isNaN(allow_devices))
    return next(new ErrorHandler("Devices must be a positive number", 400));

  const plan = await Plan.findOne({ price });
  if (plan)
    return next(
      new ErrorHandler("Plan with this Price tag already exists", 400)
    );

  await Plan.create({
    price,
    validity,
    allow_devices,
    description,
  });

  res.status(201).json({
    success: true,
    message: "Plan Created Successfully",
  });
});
