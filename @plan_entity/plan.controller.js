const Plan = require("./plan.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const { name, allow_devices, description, plan_type, price, validity } =
    req.body;
  if (
    !name ||
    !price ||
    !validity ||
    !description ||
    !allow_devices ||
    !plan_type
  ) {
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
    name: name,
    allow_devices: allow_devices,
    description: description,
    prices: {
      plan_type: plan_type,
      price: price,
      validity: validity,
    },
  });

  res.status(201).json({
    success: true,
    message: "Plan Created Successfully",
  });
});

exports.addMorePlanTypeToPlan = catchAsyncError(async (req, res, next) => {
  const { plan_type, price, validity } = req.body;
  if (!price || !validity || !plan_type) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  const plan = await Plan.findById(req.params.planId);
  plan.prices.push({
    plan_type: plan_type,
    price: price,
    validity: validity,
  });

  await plan.save();

  res.status(201).json({
    success: true,
    message: "New plan type created",
  });
});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;

  const plan = await Plan.findById(req.params.planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const old_plan = await Plan.findOne({
    name: { $regex: new RegExp(name, "i") },
  });
  if (old_plan && old_plan._id.toString() !== plan._id.toString()) {
    return next(new ErrorHandler("Plan with this name already exists", 400));
  }

  if (name) plan.name = name;

  await plan.save();

  res.status(200).json({
    success: true,
    message: "Plan Updated",
  });
});

exports.updatePlanType = catchAsyncError(async (req, res, next) => {
  const { planId, plan_typeId } = req.params;
  const { price } = req.body;

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  if (price) p_type.price = price;
  await plan.save();

  res.status(200).json({
    success: true,
    message: "Plan Updated",
  });
});

exports.getAllPlan = catchAsyncError(async (req, res, next) => {
  const plans = await Plan.find().lean();

  res.status(200).json({
    success: true,
    plans,
  });
});

exports.deletePlan = catchAsyncError(async (req, res, next) => {
  await Plan.findByIdAndDelete(req.params.planId);
  res.status(200).json({
    success: true,
    message: "Plan Deleted",
  });
});

exports.deletePlanType = catchAsyncError(async (req, res, next) => {
  const { planId, plan_typeId } = req.params;

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  // remove the plan_type from the array of prices
  plan.prices = plan.prices.filter((item) => {
    if (item._id.toString() !== plan_typeId.toString()) return item;
  });

  await plan.save();

  res.status(200).json({
    success: true,
    message: "Deleted successfully",
  });
});
