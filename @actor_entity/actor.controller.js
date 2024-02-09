const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const actorModel = require("./actor.model");

exports.createActor = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;

  const result = await s3Uploadv4(req.file, req.userId);
  const actor = await actorModel.create({ name, profile_url: result.Location });

  res.status(201).json({
    success: true,
    actor,
    message: "Actor Created Successfully",
  });
});

exports.getActors = catchAsyncError(async (req, res, next) => {
  const actors = await actorModel.find().lean();

  res.status(200).json({
    success: true,
    actors,
    message: "Actors fetch successfully",
  });
});

exports.deleteActor = catchAsyncError(async (req, res, next) => {
  const actor = await actorModel.findByIdAndDelete(req.params.id);
  if (!actor) return next(new ErrorHandler("Actor not found", 404));

  res.status(200).json({
    success: true,
    message: "Actor Deleted successfully",
  });
});

exports.getActor = catchAsyncError(async (req, res, next) => {
  const actor = await actorModel.findById(req.params.id);
  if (!actor) return next(new ErrorHandler("Actor not found", 404));

  res.status(200).json({
    success: true,
    actor,
    message: "Actor find successfully",
  });
});

exports.updateActor = catchAsyncError(async (req, res, next) => {
  const actor = await actorModel.findById(req.params.id);
  if (!actor) return next(new ErrorHandler("Actor not found", 404));
  const { name } = req.body;

  let location = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.userId);
    location = result.Location;
  }
  if (name) actor.name = name;
  if (location) actor.profile_url = location;

  await actor.save();
  res.status(200).json({
    success: true,
    message: "Actor updated successfully",
  });
});
