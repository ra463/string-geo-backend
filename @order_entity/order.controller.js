const Order = require("./order.model");
const Transaction = require("../@transaction_entity/transaction.model");
const Plan = require("../@plan_entity/plan.model");
const User = require("../@user_entity/user.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");

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

  if (user.subscription_plans && user.subscription_plans.length > 0)
    return next(
      new ErrorHandler("You already have an active Subscription Plan", 400)
    );

  const { planId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const options = {
    amount: Number(req.body.amount * 100), // amount is in paisa (lowest currency unit)
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  const newOrder = new Order({
    user: req.userId,
    plan: plan._id,
    razorpay_order_id: order.id,
    amount: order.amount,
    status: order.status,
  });

  await newOrder.save();

  res.status(200).json({
    success: true,
    order,
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

  const order = await Order.findOne({ razorpay_order_id });
  order.razorpay_signature = razorpay_signature;
  await order.save();

  // push object id of plan in subscription_plans of user
  const user = await User.findOne({ _id: order.user });
  user.subscription_plans = order.plan;
  await user.save();

  const transaction = new Transaction({
    order: order._id,
    user: order.user,
    razorpay_payment_id,
    amount: order.amount,
    status: "Created",
  });

  await transaction.save();

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
    order.status = "Success";

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
