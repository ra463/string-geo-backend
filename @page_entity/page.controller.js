const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const pageModel = require("./page.model");

exports.createPage = catchAsyncError(async (req, res, next) => {
  const { title, description, status, type } = req.body;

  const page = await pageModel.create({
    title,
    description,
    status,
    type,
  });

  res.status(201).json({
    success: true,
    page,
    message: "Page Created Successfully",
  });
});

exports.getPages = catchAsyncError(async (req, res, next) => {
  const pages = await pageModel.find().lean();

  res.status(200).json({
    success: true,
    pages,
    message: "pages fetch successfully",
  });
});

exports.deletePage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findByIdAndDelete(req.params.id);
  if (!page) return next(new ErrorHandler("Page not found", 404));

  res.status(200).json({
    success: true,
    message: "Page Deleted successfully",
  });
});

exports.getPage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findById(req.params.id);
  if (!page) return next(new ErrorHandler("Page not found", 404));

  res.status(200).json({
    success: true,
    page,
    message: "Page find successfully",
  });
});

exports.updatePage = catchAsyncError(async (req, res, next) => {
  const page = await pageModel.findById(req.params.id);
  if (!page) return next(new ErrorHandler("page not found", 404));
  const { title, description, status, type } = req.body;

  if (title) page.title = title;
  if (description) page.description = description;
  if (status) page.status = status;
  if (type) page.type = type;
  await page.save();
  res.status(200).json({
    success: true,
    message: "Page updated successfully",
  });
});
