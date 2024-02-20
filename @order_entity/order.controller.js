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
const generateAccessToken = require("../utils/paypal");
const axios = require("axios");

dotenv.config({
  path: "../config/config.env",
});

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const base = "https://api-m.sandbox.paypal.com";

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const { planId, plan_typeId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  let expiry_date = new Date();
  let start_date = new Date();
  let upgrade = false;
  let price = 0;

  const [upcoming, active] = await Promise.all([
    Order.findOne({ user: req.userId, status: "Upcoming" }),
    Order.findOne({ user: req.userId, status: "Active" }),
  ]);

  if (upcoming) {
    return next(new ErrorHandler("You already have one upcoming plan", 400));
  } else if (active) {
    if (
      active.plan_name === "Individual" &&
      active.plan_type === "annual" &&
      plan.name === "Family" &&
      p_type.plan_type === "monthly"
    ) {
      return next(
        new ErrorHandler(
          "You can upgrade your plan from annual to annual only",
          400
        )
      );
    }

    if (active.plan_name === "Family" && plan.name === "Individual") {
      return next(
        new ErrorHandler(
          "You cannot downgrade your active plan of family to individual",
          400
        )
      );
    }

    if (active.plan_name === "Individual" && plan.name === "Family") {
      let expiry = new Date(active.expiry_date);
      let current = Date.now();
      let remaining = expiry - current;
      remaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
      let days = active.plan_type === "monthly" ? 30 : 365;
      price = Math.floor((active.inr_price / days) * remaining);
      expiry_date.setDate(expiry_date.getDate() + p_type.validity);
      upgrade = true;
    } else {
      const startDate = new Date(active.expiry_date.getTime());
      start_date = startDate.setDate(startDate.getDate() + 1);
      expiry_date = new Date(start_date);
      expiry_date = expiry_date.setDate(
        expiry_date.getDate() + p_type.validity - 1
      );
    }
  } else {
    expiry_date = expiry_date.setDate(expiry_date.getDate() + p_type.validity);
  }

  const options = {
    amount: Number(p_type.inr_price * 100 - price * 100).toFixed(0), // amount is in paisa (lowest currency unit)
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  const newOrder = new Order({
    user: req.userId,
    order_id: order.id,
    plan_name: plan.name,
    allow_devices: plan.allow_devices,
    plan_type: p_type.plan_type,
    inr_price: Number(p_type.inr_price - price).toFixed(2),
    start_date,
    is_upgrade: upgrade,
    expiry_date,
    status: "Pending",
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
    const failed_order = await Order.findOne({ order_id: razorpay_order_id });
    const failed_transaction = new Transaction({
      order: failed_order._id,
      user: failed_order.user,
      payment_id: razorpay_payment_id,
      gateway: "Razorpay",
      amount: failed_order.inr_price,
      status: "FAILED",
    });
    await failed_transaction.save();
    await failed_order.deleteOne();
    return next(new ErrorHandler("Invalid Signature: Payment Failed", 400));
  }

  const order = await Order.findOne({ order_id: razorpay_order_id });
  const user = await User.findById(order.user);

  order.razorpay_signature = razorpay_signature;
  await order.save();

  const transaction = new Transaction({
    order: order._id,
    user: order.user,
    payment_id: razorpay_payment_id,
    gateway: "Razorpay",
    amount: order.inr_price,
    status: "PENDING",
  });

  const data = await sendInvoice(user, transaction);
  const result = await s3Uploadv4(data, user._id);
  transaction.invoice_url = result.Location;

  await transaction.save();

  // redirect to success page
  res.redirect("https://string-geo.vercel.app/dashboard/account");

  res.status(200).json({
    success: true,
    message: "Payment Successfull",
  });
});

exports.createPayapalOrder = catchAsyncError(async (req, res, next) => {
  const { planId, plan_typeId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  let expiry_date = new Date();
  let start_date = new Date();
  let upgrade = false;
  let price = 0;

  const [upcoming, active] = await Promise.all([
    Order.findOne({ user: req.userId, status: "Upcoming" }),
    Order.findOne({ user: req.userId, status: "Active" }),
  ]);

  if (upcoming) {
    return next(new ErrorHandler("You already have one upcoming plan", 400));
  } else if (active) {
    if (
      active.plan_name === "Individual" &&
      active.plan_type === "annual" &&
      plan.name === "Family" &&
      p_type.plan_type === "monthly"
    ) {
      return next(
        new ErrorHandler(
          "You can upgrade your plan from annual to annual only",
          400
        )
      );
    }

    if (active.plan_name === "Family" && plan.name === "Individual") {
      return next(
        new ErrorHandler(
          "You cannot downgrade your active plan of family to individual",
          400
        )
      );
    }

    if (active.plan_name === "Individual" && plan.name === "Family") {
      let expiry = new Date(active.expiry_date);
      let current = Date.now();
      let remaining = expiry - current;
      remaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
      let days = active.plan_type === "monthly" ? 30 : 365;
      price = Math.floor((active.inr_price / days) * remaining);
      expiry_date.setDate(expiry_date.getDate() + p_type.validity);
      upgrade = true;
    } else {
      const startDate = new Date(active.expiry_date.getTime());
      start_date = startDate.setDate(startDate.getDate() + 1);
      expiry_date = new Date(start_date);
      expiry_date = expiry_date.setDate(
        expiry_date.getDate() + p_type.validity - 1
      );
    }
  } else {
    expiry_date = expiry_date.setDate(expiry_date.getDate() + p_type.validity);
  }
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;

  const { data } = await axios.post(
    url,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: Number(p_type.usd_price - price).toFixed(2),
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const newOrder = new Order({
    user: req.userId,
    order_id: data.id,
    plan_name: plan.name,
    allow_devices: plan.allow_devices,
    plan_type: p_type.plan_type,
    usd_price: Number(p_type.usd_price - price).toFixed(2),
    start_date,
    is_upgrade: upgrade,
    expiry_date: expiry_date,
    status: "Pending",
  });

  await newOrder.save();

  res.status(201).json({ success: true, order: data });
});

exports.capturePaypalOrder = catchAsyncError(async (req, res, next) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${req.params.orderId}/capture`;

  const { data } = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const order = await Order.findOne({ order_id: req.params.orderId });

  const transaction = new Transaction({
    order: order._id,
    user: order.user,
    payment_id: data.purchase_units[0].payments.captures[0].id,
    gateway: "Paypal",
    amount: order.usd_price,
    status: "PENDING",
  });

  const user = await User.findById(order.user);
  const invoice_data = await sendInvoice(user, transaction);
  const result = await s3Uploadv4(invoice_data, user._id);
  transaction.invoice_url = result.Location;

  await transaction.save();

  res.status(200).json({
    success: true,
    paymentCaptured: data.purchase_units[0].payments.captures[0],
  });
});

exports.paymentWebhook = catchAsyncError(async (req, res, next) => {
  if (req.body.event === "payment.captured") {
    const transaction = await Transaction.findOne({
      payment_id: req.body.payload.payment.entity.id,
    }).populate("order", "order_id");

    const order = await Order.findOne({
      order_id: transaction.order.order_id,
    });

    const active_order = await Order.find({
      user: order.user,
      status: "Active",
    });

    if (active_order.length && !order.is_upgrade) {
      order.status = "Upcoming";
      await order.save();
    }
    if (!active_order.length && !order.is_upgrade) {
      order.status = "Active";
      await order.save();
    }

    if (order.is_upgrade) {
      const orders = await Order.find();
      const delete_order = orders[orders.length - 2];
      await delete_order.deleteOne();
      order.status = "Active";
      await order.save();
    }

    transaction.status = req.body.payload.payment.entity.status;
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Webhook Captured",
    });
  }
});

exports.paypalPaymentWebhook = catchAsyncError(async (req, res, next) => {
  if (req.body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = req.body.resource.supplementary_data.related_ids.order_id;

    const order = await Order.findOne({ order_id: orderId });
    if (!order) return next(new ErrorHandler("Order not found", 404));

    const transaction = await Transaction.findOne({
      order: order._id,
    });
    if (!transaction)
      return next(new ErrorHandler("Transaction not found", 404));

    const active_order = await Order.find({
      user: order.user,
      status: "Active",
    });

    if (active_order.length && !order.is_upgrade) {
      order.status = "Upcoming";
      await order.save();
    }
    if (!active_order.length && !order.is_upgrade) {
      order.status = "Active";
      await order.save();
    }

    if (order.is_upgrade) {
      const orders = await Order.find();
      const delete_order = orders[orders.length - 2];
      await delete_order.deleteOne();
      order.status = "Active";
      await order.save();
    }

    transaction.status = req.body.resource.status;
    await transaction.save();

    return res.status(200).json({ success: true, message: "Webhook Captured" });
  }
});
