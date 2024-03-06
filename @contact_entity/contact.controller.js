const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv4 } = require("../utils/s3");
const contactModel = require("./contact.model");

exports.createContact = catchAsyncError(async (req, res, next) => {
  const result = await s3Uploadv4(req.file, req.userId);
  const contact = await contactModel.create({ image_url: result.Location });

  res.status(201).json({
    success: true,
    contact,
    message: "Contact Image Created Successfully",
  });
});

exports.getContact = catchAsyncError(async (req, res, next) => {
  const contact = await contactModel.find().lean();
  res.status(200).json({
    success: true,
    contact,
    message: "Contact fetch successfully",
  });
});



exports.updateContact = catchAsyncError(async (req, res, next) => {
  const contact = await contactModel.findById(req.params.id);
  if (!contact) return next(new ErrorHandler("contact not found", 404));

  let location = "";
  if (req.file) {
    const result = await s3Uploadv4(req.file, req.userId);
    location = result.Location;
  }
  if (location) contact.image_url = location;

  await contact.save();
  res.status(200).json({
    success: true,
    message: "Contact Image updated successfully",
  });
});
