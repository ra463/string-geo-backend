const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const aboutModel = require("./about.model");

exports.createAbout = catchAsyncError(async (req, res, next) => {
  req.userId = "65e5b4c51dec04256212b52d";
  const result = await s3Uploadv4(req.file, req.userId);
  const about = await aboutModel.create({ image_url: result.Location });

  res.status(201).json({
    success: true,
    about,
    message: "About Image Created Successfully",
  });
});

exports.getAbouts = catchAsyncError(async (req, res, next) => {
  const abouts = await aboutModel.find().lean();
  res.status(200).json({
    success: true,
    abouts,
    message: "About fetch successfully",
  });
});



exports.updateAbout = catchAsyncError(async (req, res, next) => {
  const about = await aboutModel.findById(req.params.id);
  if (!about) return next(new ErrorHandler("about not found", 404));

  let location = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.userId);
    location = result.Location;
  }
  if (location) about.image_url = location;

  await about.save();
  res.status(200).json({
    success: true,
    message: "About Image updated successfully",
  });
});
