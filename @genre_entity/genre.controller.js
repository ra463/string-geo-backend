const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const genreModel = require("./genre.model");

exports.createGenre = catchAsyncError(async (req, res, next) => {
  const { name, status } = req.body;

  if (!name) {
    return next(new ErrorHandler("Language is required", 400));
  }

  const genre = await genreModel.create({ name, status });

  res.status(201).json({
    success: true,
    genre,
    message: "New Genre Created Successfully",
  });
});

exports.getGenres = catchAsyncError(async (req, res, next) => {
  const genres = await genreModel.find().lean();
  // console.log(languages)
  res.status(200).json({
    success: true,
    genres,
    message: "Genres fetch successfully",
  });
});

exports.deleteGenre = catchAsyncError(async (req, res, next) => {
  const genre = await genreModel.findByIdAndDelete(req.params.id);
  if (!genre) {
    return next(new ErrorHandler("Genre not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Genres Deleted successfully",
  });
});

exports.getGenre = catchAsyncError(async (req, res, next) => {
  const genre = await genreModel.findById(req.params.id);
  if (!genre) {
    return next(new ErrorHandler("Genre not found", 404));
  }
  res.status(200).json({
    success: true,
    genre,
    message: "Genre find successfully",
  });
});

exports.updateGenre = catchAsyncError(async (req, res, next) => {
  const genre = await genreModel.findById(req.params.id);
  const { name, status } = req.body;
  if (!genre) {
    return next(new ErrorHandler("Genre not found", 404));
  }
  if (name) genre.name = name;
  if (status) genre.status = status;
  await genre.save();
  res.status(200).json({
    success: true,
    message: "Genre updated successfully",
  });
});
