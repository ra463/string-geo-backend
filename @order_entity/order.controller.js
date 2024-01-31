const Order = require("./order.model");
const Transaction = require("../@transaction_entity/transaction.model");
const Plan = require("../@plan_entity/plan.model");
const User = require("../@user_entity/user.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { sendInvoice } = require("../utils/sendEmail");
const { s3Uploadv4 } = require("../utils/s3");

dotenv.config({
  path: "../config/config.env",
});

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.subscription_plans.plan_name) {
    return next(new ErrorHandler("You already have an active plan", 400));
  }

  const { planId, plan_typeId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  const options = {
    amount: p_type.price * 100, // amount is in paisa (lowest currency unit)
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  const newOrder = new Order({
    user: req.userId,
    plan: plan._id,
    razorpay_order_id: order.id,
    plan_type_id: plan_typeId,
    plan_type: p_type.plan_type,
    validity: p_type.validity,
    amount: order.amount,
    status: order.status,
  });

  await newOrder.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getAPIKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

exports.verifyPayment = catchAsyncError(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const isAuthentic = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (isAuthentic !== razorpay_signature) {
    await Order.findOneAndUpdate(
      { razorpay_order_id },
      {
        status: "Failed",
        razorpay_signature,
      }
    );
    return next(new ErrorHandler("Invalid Signature: Payment Failed", 400));
  }

  const order = await Order.findOne({ razorpay_order_id }).populate("plan");
  order.razorpay_signature = razorpay_signature;
  await order.save();

  // push object id of plan in subscription_plans of user
  const user = await User.findOne({ _id: order.user });
  user.subscription_plans.plan_name = order.plan.name;
  user.subscription_plans.allow_devices = order.plan.allow_devices;

  // find the plan_type from Prices array
  // const p_type = order.plan.prices.find((item) => {
  //   if (item._id.toString() === order.plan_type_id.toString()) return item;
  // });
  let expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + order.validity);
  user.subscription_plans.plan_type = order.plan_type;
  user.subscription_plans.price = order.amount / 100;
  user.subscription_plans.validity = order.validity;
  user.subscription_plans.expiry_date = expiry_date;

  await user.save();

  const transaction = new Transaction({
    order: order._id,
    user: order.user,
    razorpay_payment_id,
    amount: order.amount,
    status: "Created",
    gateway: "Razorpay",
  });

  const data = await sendInvoice(user, transaction);
  const result = await s3Uploadv4(data, user._id);
  transaction.invoice_url = result.Location;

  await transaction.save();

  // redirect to success page
  res.redirect("https://string-geo.vercel.app");

  res.status(200).json({
    success: true,
    message: "Payment Successfull",
  });
});

exports.paymentWebhook = catchAsyncError(async (req, res, next) => {
  if (req.body.event === "payment.captured") {
    const transaction = await Transaction.findOne({
      razorpay_payment_id: req.body.payload.payment.entity.id,
    }).populate("order", "razorpay_order_id");

    const order = await Order.findOne({
      razorpay_order_id: transaction.order.razorpay_order_id,
    });

    transaction.status = req.body.payload.payment.entity.status;
    order.status = "success";

    await transaction.save();
    await order.save();

    // send mail to user is pending
    // ------------> <--------------

    res.status(200).json({
      success: true,
      message: "Payment Captured",
    });
  }
});
