const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3delete, s3AdminUploadv4 } = require("../utils/s3");
const Carousel = require("./carousel.model");

exports.addCarousel = catchAsyncError(async (req, res, next) => {
  const { video_id, tag } = req.body;
  const file = req.file;
  if (!file) return next(new ErrorHandler("Please select a file", 400));

  let carousel = await Carousel.find({ tag: tag });
  if (carousel.length === 5) {
    return next(new ErrorHandler("Carousel limit reached", 400));
  }

  const result = await s3AdminUploadv4(file);

  if (tag === "Inner") {
    await Carousel.create({ poster_url: result.Location, video_id, tag });
  } else {
    await Carousel.create({ poster_url: result.Location, video_id: null, tag });
  }

  res.status(201).json({
    success: true,
    message: "New Carousel Created Successfully",
  });
});

exports.getAllCarousel = catchAsyncError(async (req, res, next) => {
  const carousels = await Carousel.find()
    .populate({
      path: "video_id",
      select: "title genres language createdAt",
      populate: [
        {
          path: "genres",
          select: "name",
        },
        {
          path: "language",
          select: "name",
        },
      ],
    })
    .lean();

  res.status(200).json({
    success: true,
    carousels,
  });
});

exports.getAllInnerCarousel = catchAsyncError(async (req, res, next) => {
  const carousels = await Carousel.find({ tag: "Inner" })
    .populate({
      path: "video_id",
      select: "title genres language createdAt",
      populate: [
        {
          path: "genres",
          select: "name",
        },
        {
          path: "language",
          select: "name",
        },
      ],
    })
    .lean();

  res.status(200).json({
    success: true,
    carousels,
  });
});

exports.getAllOuterCarousel = catchAsyncError(async (req, res, next) => {
  const carousels = await Carousel.find({ tag: "Outer" }).lean();

  res.status(200).json({
    success: true,
    carousels,
  });
});

exports.deleteCarousel = catchAsyncError(async (req, res, next) => {
  const carousel = await Carousel.findById(req.params.id);
  if (!carousel) return next(new ErrorHandler("Carousel not found", 404));

  const url = carousel.poster_url;
  await Promise.all([s3delete(url), carousel.deleteOne()]);
  // const [delete_1, delete_2] = await Promise.all([
  //   s3delete(url),
  //   carousel.deleteOne(),
  // ]);

  res.status(200).json({
    success: true,
    message: "Carousel Deleted Successfully",
  });
});
