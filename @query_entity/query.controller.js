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
