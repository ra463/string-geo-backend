const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const trailerModel = require("./trailer.model");

exports.createTrailer = catchAsyncError(async (req, res, next) => {
  const { video } = req.body;
  const tray = await trailerModel.findOne({});
  if (tray)
    return next(new ErrorHandler("You can add only one video to trailer", 400));

  const trailer = await trailerModel.create({ video });

  res.status(201).json({
    success: true,
    trailer,
    message: "New Trailer Created Successfully",
  });
});

exports.getTrailers = catchAsyncError(async (req, res, next) => {
  const trailers = await trailerModel.find().lean();
  res.status(200).json({
    success: true,
    trailers,
    message: "Trailers fetch successfully",
  });
});

exports.deleteTrailer = catchAsyncError(async (req, res, next) => {
  const trailer = await trailerModel.findByIdAndDelete(req.params.id);
  if (!trailer) {
    return next(new ErrorHandler("Trailer not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Trailer Deleted successfully",
  });
});

exports.getTrailer = catchAsyncError(async (req, res, next) => {
  const trailer = await trailerModel.findById(req.params.id);
  if (!trailer) {
    return next(new ErrorHandler("trailer not found", 404));
  }
  res.status(200).json({
    success: true,
    trailer,
  });
});
