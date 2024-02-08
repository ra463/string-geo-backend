const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Query = require("./query.model");

exports.createQuery = catchAsyncError(async (req, res, next) => {
  const { name, email, mobile, company_name, address, message } = req.body;

  await Query.create({
    name,
    email,
    mobile,
    company_name,
    address,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Query submitted successfully",
  });
});

exports.getQueries = catchAsyncError(async (req, res, next) => {
  const { keyword, resultPerPage, currentPage } = req.query;
  const query = {};
  if (keyword) {
    const keywordRegExp = new RegExp(keyword, "i");
    query.$or = [
      { name: { $regex: keywordRegExp } },
      { email: { $regex: keywordRegExp } },
    ];
  }
  const totalQueryCount = await Query.countDocuments(query);

  const limit = Number(resultPerPage);
  const page = Number(currentPage);
  const skip = (page - 1) * limit;

  let queries = await Query.find(query).skip(skip).limit(limit).lean();

  res.status(200).json({
    success: true,
    queries,
    totalQueryCount,
  });
});

exports.getQuery = catchAsyncError(async (req, res, next) => {
  const query = await Query.findById(req.params.id);
  if (!query) return next(new ErrorHandler("Query not found", 404));

  res.status(200).json({
    success: true,
    query,
  });
});

exports.deleteQuery = catchAsyncError(async (req, res, next) => {
  const query = await Query.findById(req.params.id);
  if (!query) return next(new ErrorHandler("Query not found", 404));

  await query.deleteOne();
  res.status(200).json({
    success: true,
    message: "Query Deleted successfully",
  });
});
