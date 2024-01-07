const Transaction = require("../@transaction_entity/transaction.model");
const User = require("../@user_entity/user.model");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getUserTransactions = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transactions = await Transaction.find({ user: user._id })
    .sort({
      createdAt: -1,
    })
    .lean();

  res.status(200).json({
    success: true,
    transactions,
  });
});

exports.getTransactionDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transaction = await Transaction.findById(req.params.transactionId)
    .populate("order", "-razorpay_signature")
    .lean();
  if (!transaction) return next(new ErrorHandler("Transaction not found", 404));

  if (transaction.user.toString() !== user._id.toString())
    return next(
      new ErrorHandler("You are not authorized to access this Transaction", 401)
    );

  res.status(200).json({
    success: true,
    transaction,
  });
});
