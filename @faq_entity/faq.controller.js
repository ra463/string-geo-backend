const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const faqModel = require("./faq.model");

exports.createFaq = catchAsyncError(async (req, res, next) => {
  const { title, description, status } = req.body;

  const faq = await faqModel.create({ title, description, status });

  res.status(201).json({
    success: true,
    faq,
    message: "New Faq Created Successfully",
  });
});

exports.getFaqs = catchAsyncError(async (req, res, next) => {
  const faqs = await faqModel.find().lean();
  res.status(200).json({
    success: true,
    faqs,
    message: "Faqs fetch successfully",
  });
});

exports.deleteFaq = catchAsyncError(async (req, res, next) => {
  const faq = await faqModel.findByIdAndDelete(req.params.id);
  if (!faq) {
    return next(new ErrorHandler("Faq not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Faq Deleted successfully",
  });
});

exports.getFaq = catchAsyncError(async (req, res, next) => {
  const faq = await faqModel.findById(req.params.id);
  if (!faq) {
    return next(new ErrorHandler("Faq not found", 404));
  }
  res.status(200).json({
    success: true,
    faq,
    message: "Faq find successfully",
  });
});

exports.updateFaq = catchAsyncError(async (req, res, next) => {
  const faq = await faqModel.findById(req.params.id);
  const { title, description, status } = req.body;
  if (!faq) {
    return next(new ErrorHandler("Faq not found", 404));
  }
  if (title) faq.title = title;
  if (description) faq.description = description;
  if (status) faq.status = status;
  await faq.save();
  res.status(200).json({
    success: true,
    message: "Faq updated successfully",
  });
});
