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

  const options = {
    amount: p_type.price * 100, // amount is in paisa (lowest currency unit)
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  const newOrder = new Order({
    user: req.userId,
    plan: plan._id,
    order_id: order.id,
    plan_type_id: plan_typeId,
    // status: order.status,
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
    await Order.findOneAndUpdate(
      { order_id: razorpay_order_id },
      {
        status: "Failed",
        razorpay_signature,
      }
    );
    return next(new ErrorHandler("Invalid Signature: Payment Failed", 400));
  }

  const order = await Order.findOne({ order_id: razorpay_order_id }).populate(
    "plan"
  );
  const user = await User.findById(order.user);
  const plan = await Plan.findById(order.plan._id);
  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === order.plan_type_id.toString()) return item;
  });

  let expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + p_type.validity);
  order.razorpay_signature = razorpay_signature;
  order.plan_name = order.plan.name;
  order.allow_devices = order.plan.allow_devices;
  order.plan_type = p_type.plan_type;
  order.price = p_type.price / 100;
  order.validity = p_type.validity;
  order.expiry_date = expiry_date;

  await order.save();

  const transaction = new Transaction({
    order: order._id,
    user: order.user,
    payment_id: razorpay_payment_id,
    amount: order.price,
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

exports.createPayapalOrder = catchAsyncError(async (req, res, next) => {
  const { planId, plan_typeId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const plan = await Plan.findById(planId);
  if (!plan) return next(new ErrorHandler("Plan not found", 404));

  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === plan_typeId.toString()) return item;
  });
  if (!p_type) return next(new ErrorHandler("Plan type not found", 404));

  const price = p_type.usd_price;
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
            value: price.toFixed(2),
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

  res.status(201).json({ success: true, order: data });
});

exports.capturePaypalOrder = catchAsyncError(async (req, res, next) => {
  const { planId, plan_typeId } = req.body;
  if (!planId) return next(new ErrorHandler("PlanId is Required", 404));

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${req.body.orderId}/capture`;

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

  const plan = await Plan.findById(planId);
  const p_type = plan.prices.find((item) => {
    if (item._id.toString() === order.plan_type_id.toString()) return item;
  });

  let expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + p_type.validity);

  const order = new Order({
    user: req.userId,
    plan: planId,
    order_id: data.id,
    plan_type_id: plan_typeId,
    plan_name: plan.name,
    allow_devices: plan.allow_devices,
    plan_type: p_type.plan_type,
    price: p_type.usd_price,
    validity: p_type.validity,
    expiry_date: expiry_date,
    status: "Pending",
  });

  const newOrder = await order.save();

  const transaction = new Transaction({
    order: newOrder._id,
    user: req.userId,
    payment_id: data.purchase_units[0].payments.captures[0].id,
    amount: p_type.usd_price,
    gateway: "Paypal",
    status: "Pending",
  });

  const user = await User.findById(newOrder.user);
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

    order.status = "Success";
    await order.save();

    transaction.status = req.body.resource.status;
    await transaction.save();

    // send mail to user is pending
    // ------------> <--------------
  }

  res.status(200).json({ success: true, message: "Webhook closes working" });
});
