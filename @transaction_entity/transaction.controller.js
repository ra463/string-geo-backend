const Transaction = require("../@transaction_entity/transaction.model");
const User = require("../@user_entity/user.model");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getAllTransaction = catchAsyncError(async (req, res, next) => {
  let query = {};
  if (req.query.gateway && req.query.gateway != "all") {
    query["gateway"] = req.query.gateway;
  }

  // filter by createdAt
  if (req.query.from !== null) {
    const f = new Date(req.query.from);
    if (!isNaN(f)) {
      const startDay = new Date(f.getFullYear(), f.getMonth(), f.getDate());
      const endDay = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1);

      query["createdAt"] = {
        $gte: startDay,
        $lt: endDay,
      };
    }
  }

  const transactionCount = await Transaction.countDocuments();

  const apiFeatures = new APIFeatures(
    Transaction.find(query)
      .populate("order", "-razorpay_signature")
      .populate("user", "name email")
      .sort({ createdAt: -1 }),
    req.query
  ).search("razorpay_payment_id");

  let transactions = await apiFeatures.query;

  if (req.query.email) {
    transactions = await transactions.filter(
      (t) => t.user && t.user.email === req.query.email
    );
  }

  const filteredTransactions = transactions.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    let resultPerPage = Number(req.query.resultPerPage);
    let currentPage = Number(req.query.currentPage);

    let skip = resultPerPage * (currentPage - 1);
    transactions = await transactions.slice(skip, skip + resultPerPage);
  }

  res.status(200).json({
    success: true,
    transactionCount,
    filteredTransactions,
    transactions,
  });
});

exports.getTransactionById = catchAsyncError(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.transactionId)
    .populate("order", "-razorpay_signature")
    .lean();
  if (!transaction) return next(new ErrorHandler("Transaction not found", 404));
  res.status(200).json({
    success: true,
    transaction,
  });
});

exports.getUserTransactions = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const transactions = await Transaction.find({ user: user._id })
    .sort({
      createdAt: -1,
    })
    .populate("user", "name email")
    .populate({
      path: "order",
      select: "plan_type validity",
      populate: {
        path: "plan",
        select: "name",
      },
    })
    .lean();

  res.status(200).json({
    success: true,
    transactions,
  });
});

exports.getUserTransactionDetails = catchAsyncError(async (req, res, next) => {
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

exports.test = catchAsyncError(async (req, res, next) => {
  const transcation = await User.find();
  transcation.forEach(async (t) => {
    if (t.role === "User") {
      t.role = "user";
      t.save();
    } else if (t.role === "Admin") {
      t.role = "admin";
      t.save();
    }
  });
  res.status(200).json({
    succes: true,
  });
});
