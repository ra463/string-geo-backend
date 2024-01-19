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
        price: monthly_price,
        usd_price: usd_price_monthly,
        validity: 30,
      },
      {
        plan_type: "annual",
        price: yearly_price,
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

// exports.addMorePlanTypeToPlan = catchAsyncError(async (req, res, next) => {
//   const { plan_type, price, validity } = req.body;
//   if (!price || !validity || !plan_type) {
//     return next(new ErrorHandler("Please enter all fields", 400));
//   }
//   const plan = await Plan.findById(req.params.planId);
//   plan.prices.push({
//     plan_type: plan_type,
//     price: price,
//     validity: validity,
//   });

//   await plan.save();

//   res.status(201).json({
//     success: true,
//     message: "New plan type created",
//   });
// });

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
  if (monthly_price) plan.prices[0].price = monthly_price;
  if (yearly_price) plan.prices[1].price = yearly_price;
  if (usd_price_monthly) plan.prices[0].usd_price = usd_price_monthly;
  if (usd_price_yearly) plan.prices[1].usd_price = usd_price_yearly;

  await plan.save();

  res.status(200).json({
    success: true,
    message: "Plan Updated",
  });
});

// exports.updatePlanType = catchAsyncError(async (req, res, next) => {
//   const { planId, plan_typeId } = req.params;
//   const { price } = req.body;

//   const plan = await Plan.findById(planId);
//   if (!plan) return next(new ErrorHandler("Plan not found", 404));

//   const p_type = plan.prices.find((item) => {
//     if (item._id.toString() === plan_typeId.toString()) return item;
//   });
//   if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

//   if (price) p_type.price = price;
//   await plan.save();

//   res.status(200).json({
//     success: true,
//     message: "Plan Updated",
//   });
// });

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

// exports.deletePlanType = catchAsyncError(async (req, res, next) => {
//   const { planId, plan_typeId } = req.params;

//   const plan = await Plan.findById(planId);
//   if (!plan) return next(new ErrorHandler("Plan not found", 404));

//   const p_type = plan.prices.find((item) => {
//     if (item._id.toString() === plan_typeId.toString()) return item;
//   });
//   if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

//   // remove the plan_type from the array of prices
//   plan.prices = plan.prices.filter((item) => {
//     if (item._id.toString() !== plan_typeId.toString()) return item;
//   });

//   await plan.save();

//   res.status(200).json({
//     success: true,
//     message: "Deleted successfully",
//   });
// });
