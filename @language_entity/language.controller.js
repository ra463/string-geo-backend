const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const languageModel = require("./language.model");

exports.createLanguage = catchAsyncError(async (req, res, next) => {
  const { name, status } = req.body;

  if (!name) {
    return next(new ErrorHandler("Language is required", 400));
  }

  const language = await languageModel.create({ name, status });

  res.status(201).json({
    success: true,
    language,
    message: "New Language Created Successfully",
  });
});

exports.getLanguages = catchAsyncError(async (req, res, next) => {
  const languages = await languageModel.find().lean();
  // console.log(languages)
  res.status(200).json({
    success: true,
    languages,
    message: "Languages fetch successfully",
  });
});

exports.deleteLanguage = catchAsyncError(async (req, res, next) => {
  const language = await languageModel.findByIdAndDelete(req.params.id);
  if (!language) {
    return next(new ErrorHandler("Language not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Languages Deleted successfully",
  });
});

exports.getLanguage = catchAsyncError(async (req, res, next) => {
  const language = await languageModel.findById(req.params.id);
  if (!language) {
    return next(new ErrorHandler("Language not found", 404));
  }
  res.status(200).json({
    success: true,
    language,
    message: "Language find successfully",
  });
});

exports.updateLanguage = catchAsyncError(async (req, res, next) => {
  const language = await languageModel.findById(req.params.id);
  const { name, status } = req.body;
  if (!language) {
    return next(new ErrorHandler("Language not found", 404));
  }
  if (name) language.name = name;
  if (status) language.status = status;
  await language.save();
  res.status(200).json({
    success: true,
    message: "Language updated successfully",
  });
});
