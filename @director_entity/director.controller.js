const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const directorModel = require("./director.model");

exports.createDirector = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;

  const result = await s3Uploadv4(req.file, req.userId);

  if (!name) {
    return next(new ErrorHandler("Name is required", 400));
  }

  const director = await directorModel.create({ name, profile_url: result.Location });

  res.status(201).json({
    success: true,
    director,
    message: "New Director Created Successfully",
  });
});

exports.getDirectors = catchAsyncError(async (req, res, next) => {
  const directors = await directorModel.find().lean();
  // console.log(directors)
  res.status(200).json({
    success: true,
    directors,
    message: "Directors fetch successfully",
  });
});

exports.deleteDirector = catchAsyncError(async (req, res, next) => {
  const director = await directorModel.findByIdAndDelete(req.params.id);
  if (!director) {
    return next(new ErrorHandler("Director not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Director Deleted successfully",
  });
});

exports.getDirector = catchAsyncError(async (req, res, next) => {
  const director = await directorModel.findById(req.params.id);
  if (!director) {
    return next(new ErrorHandler("Director not found", 404));
  }
  res.status(200).json({
    success: true,
    director,
    message: "Director find successfully",
  });
});

exports.updateDirector = catchAsyncError(async (req, res, next) => {
  const director = await directorModel.findById(req.params.id);
  const { name } = req.body;
  let location = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.userId);
    location = result.Location;
  }
  if (!director) {
    return next(new ErrorHandler("Director not found", 404));
  }
  if (name) director.name = name;
  if (location) director.profile_url = location;

  await director.save();
  res.status(200).json({
    success: true,
    message: "Director updated successfully",
  });
});
