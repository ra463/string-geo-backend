const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const couponModel = require("./coupon.model");

exports.createCoupon = catchAsyncError(async (req, res, next) => {
  const { coupon_code, status, allow, uses, expiry,discount } = req.body;

  const coupon = await couponModel.create({
    coupon_code,
    status,
    allow,
    uses,
    discount,
    expiry
  });

  res.status(201).json({
    success: true,
    coupon,
    message: "Coupon Created Successfully",
  });
});

exports.getCoupons = catchAsyncError(async (req, res, next) => {
  const coupons = await couponModel.find().lean();

  res.status(200).json({
    success: true,
    coupons,
    message: "coupons fetch successfully",
  });
});

exports.deleteCoupon = catchAsyncError(async (req, res, next) => {
  const coupon = await couponModel.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  res.status(200).json({
    success: true,
    message: "Coupon Deleted successfully",
  });
});

exports.getCoupon = catchAsyncError(async (req, res, next) => {
  const coupon = await couponModel.findById(req.params.id);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));

  res.status(200).json({
    success: true,
    coupon,
    message: "Coupon find successfully",
  });
});

exports.updateCoupon = catchAsyncError(async (req, res, next) => {
  const coupon = await couponModel.findById(req.params.id);
  if (!coupon) return next(new ErrorHandler("Coupon not found", 404));
  const { coupon_code, status, allow, uses, expiry, discount } = req.body;

  if (coupon_code) coupon.coupon_code = coupon_code;
  if (status) coupon.status = status;
  if (allow) coupon.allow = allow;
  if (uses) coupon.uses = uses;
  if (expiry) coupon.expiry = expiry;
  if(discount) coupon.discount = discount;
  await coupon.save();
  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
  });
});