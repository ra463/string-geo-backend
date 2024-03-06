const Plan = require("./plan.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPlan = catchAsyncError(async (req, res, next) => {
  const {
    name,
    allow_devices,
    monthly_price,
    yearly_price,
    usd_price_monthly,
    usd_price_yearly,
  } = req.body;

  await Plan.create({
    name: name,
    allow_devices: allow_devices,
    prices: [
      {
        plan_type: "monthly",
        inr_price: monthly_price,
        usd_price: usd_price_monthly,
        validity: 30,
      },
      {
        plan_type: "annual",
        inr_price: yearly_price,
        usd_price: usd_price_yearly,
        validity: 365,
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Plan Created Successfully",
  });
});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const {
    name,
    monthly_price,
    yearly_price,
    usd_price_monthly,
    usd_price_yearly,
  } = req.body;

  const plan = await Plan.findById(req.params.planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  if (name) plan.name = name;
  if (monthly_price) plan.prices[0].inr_price = monthly_price;
  if (yearly_price) plan.prices[1].inr_price = yearly_price;
  if (usd_price_monthly) plan.prices[0].usd_price = usd_price_monthly;
  if (usd_price_yearly) plan.prices[1].usd_price = usd_price_yearly;

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

exports.getPlanById = catchAsyncError(async (req, res, next) => {
  const plan = await Plan.findById(req.params.planId).lean();
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  res.status(200).json({
    success: true,
    plan,
  });
});

exports.deletePlan = catchAsyncError(async (req, res, next) => {
  await Plan.findByIdAndDelete(req.params.planId);
  res.status(200).json({
    success: true,
    message: "Plan Deleted",
  });
});