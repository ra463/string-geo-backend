const Plan = require("./plan.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, allow_devices, description, plan_type } = req.body;
  if (!price || !validity || !description || !allow_devices) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  if (price < 0 || isNaN(price))
    return next(new ErrorHandler("Price must be a positive number", 400));

  if (validity < 0 || isNaN(validity))
    return next(new ErrorHandler("Validity must be a positive number", 400));

  if (allow_devices < 0 || isNaN(allow_devices))
    return next(new ErrorHandler("Devices must be a positive number", 400));

  if (!plan_type) {
    return next(new ErrorHandler("Please provide plan type", 400));
  }

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
    plan_type,
  });

  res.status(201).json({
    success: true,
    message: "Plan Created Successfully",
  });
});

exports.getAllPlan = catchAsyncError(async (req, res, next) => {
  const plan_individual = await Plan.find({ plan_type: "Individual" })
    .sort({ price: 1 })
    .lean();
  const plan_multiuser = await Plan.find({ plan_type: "Multi-User" })
    .sort({ price: 1 })
    .lean();

  res.status(200).json({
    success: true,
    plan_individual,
    plan_multiuser,
  });
});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const { price, validity, allow_devices, description, plan_type } = req.body;
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
  if (plan_type) old_plan.plan_type = plan_type;

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
