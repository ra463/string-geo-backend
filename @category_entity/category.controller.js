const catchAsyncError = require("../utils/catchAsyncError");
const Category = require("./category.model");
const ErrorHandler = require("../utils/errorHandler");

exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name, status } = req.body;
  const category = await Category.create({ name, status });

  res.status(201).json({
    success: true,
    category,
    message: "New Category Created Successfully",
  });
});

exports.getCategories = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find().lean();

  res.status(200).json({
    success: true,
    categories,
  });
});

exports.getCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if(!category) return next(new ErrorHandler("Category not found", 404));

  res.status(200).json({
    success: true,
    category,
  });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const { name,status } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));

  if (name) category.name = name;
  if (status) category.status = status;

  await category.save();
  res.status(200).json({
    success: true,
    category,
    message: "Category Updated successfully",
  });
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ErrorHandler("Category not found", 404));

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category Deleted successfully",
  });
});
