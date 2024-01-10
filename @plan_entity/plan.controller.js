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

exports.getAllPlan = catchAsyncError(async (req, res, next) => {
  const plans = await Plan.find();
  res.status(200).json({
    success: true,
    plans,
  });
});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, allow_devices, description } = req.body;
  if (!price) {
    return next(new ErrorHandler("Please enter price", 400));
  }

  // await Plan.findByIdAndUpdate(req.params.planId, req.body, {
  //   new: true,
  // });

  const old_plan = await Plan.findOne({ price });
  if (!old_plan) return next(new ErrorHandler("Plan not found", 404));

  if (old_plan && old_plan._id != req.params.planId) {
    return next(
      new ErrorHandler("Plan with this Price tag already exists", 400)
    );
  }

  if (price) old_plan.price = price;
  if (validity) old_plan.validity = validity;
  if (allow_devices) old_plan.allow_devices = allow_devices;
  if (description) old_plan.description = description;

  await old_plan.save();

  res.status(200).json({
    success: true,
    message: "Plan Updated",
  });
});

exports.deletePlan = catchAsyncError(async (req, res, next) => {
  await Plan.findByIdAndDelete(req.params.planId);
  res.status(200).json({
    success: true,
    message: "Plan Deleted",
  });
});
